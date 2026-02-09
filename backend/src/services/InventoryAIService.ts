import Anthropic from '@anthropic-ai/sdk';
import { db } from '../config/postgres';

interface SalesData {
  product_id: string;
  product_name: string;
  category: string;
  current_stock: number;
  low_stock_threshold: number;
  optimal_stock_level: number | null;
  reorder_point: number | null;
  sales_last_7_days: number;
  sales_last_30_days: number;
  sales_last_90_days: number;
  avg_daily_sales_7d: number;
  avg_daily_sales_30d: number;
  avg_daily_sales_90d: number;
  trend_direction: string | null;
  days_until_stockout: number | null;
  supplier_lead_time: number | null;
  cost_price: number | null;
}

interface ForecastResult {
  product_id: string;
  forecast_horizon_days: number;
  predicted_sales: number;
  predicted_stock_level: number;
  recommended_reorder_quantity: number;
  confidence: 'low' | 'medium' | 'high';
  confidence_score: number;
  reasoning: string;
  factors_considered: any;
}

interface PurchaseRecommendation {
  product_id: string;
  recommended_quantity: number;
  recommended_order_date: Date;
  expected_delivery_date: Date;
  priority_level: number;
  reason: string;
  supporting_data: any;
}

interface InventoryAlert {
  product_id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  current_stock: number;
  threshold_value: number;
}

class InventoryAIService {
  private anthropic: Anthropic | null = null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey !== 'your_anthropic_api_key_here') {
      this.anthropic = new Anthropic({ apiKey });
    } else {
      console.warn('ANTHROPIC_API_KEY not configured - AI inventory features disabled');
    }
  }

  /**
   * Collect comprehensive sales and inventory data for AI analysis
   */
  async collectInventoryData(productIds?: string[]): Promise<SalesData[]> {
    let query = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.category,
        p.stock_quantity as current_stock,
        p.low_stock_threshold,
        p.optimal_stock_level,
        p.reorder_point,
        p.cost_price,
        COALESCE(sv.sales_last_7_days, 0) as sales_last_7_days,
        COALESCE(sv.sales_last_30_days, 0) as sales_last_30_days,
        COALESCE(sv.sales_last_90_days, 0) as sales_last_90_days,
        COALESCE(sv.avg_daily_sales_7d, 0) as avg_daily_sales_7d,
        COALESCE(sv.avg_daily_sales_30d, 0) as avg_daily_sales_30d,
        COALESCE(sv.avg_daily_sales_90d, 0) as avg_daily_sales_90d,
        sv.trend_direction,
        CASE
          WHEN sv.avg_daily_sales_30d > 0 THEN
            FLOOR(p.stock_quantity / sv.avg_daily_sales_30d)
          ELSE NULL
        END as days_until_stockout,
        s.lead_time_days as supplier_lead_time
      FROM products p
      LEFT JOIN sales_velocity sv ON p.id = sv.product_id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = TRUE
    `;

    const params: any[] = [];

    if (productIds && productIds.length > 0) {
      query += ' AND p.id = ANY($1)';
      params.push(productIds);
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await db.query<SalesData>(query, params.length > 0 ? params : undefined);
    return result.rows;
  }

  /**
   * Generate AI-powered inventory forecast using Claude
   */
  async generateForecast(horizonDays: number = 30): Promise<ForecastResult[]> {
    if (!this.anthropic) {
      console.warn('AI forecasting not available - API key not configured');
      return [];
    }

    const inventoryData = await this.collectInventoryData();

    if (inventoryData.length === 0) {
      return [];
    }

    const prompt = this.buildForecastPrompt(inventoryData, horizonDays);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const forecasts = this.parseForecastResponse(responseText, inventoryData, horizonDays);

      // Save forecasts to database
      await this.saveForecastsToDatabase(forecasts);

      return forecasts;
    } catch (error) {
      console.error('Error generating AI forecast:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive prompt for Claude AI
   */
  private buildForecastPrompt(data: SalesData[], horizonDays: number): string {
    const today = new Date().toISOString().split('T')[0];

    return `You are an expert inventory management AI for an e-commerce platform selling digital products (soundscapes, templates, music, software) and physical products (clothing, hardware like effects pedals, MIDI controllers, synthesizers).

Today's date: ${today}
Forecast horizon: ${horizonDays} days

Current Inventory Data:
${JSON.stringify(data, null, 2)}

Please analyze this inventory data and provide:

1. Sales forecasts for each product over the next ${horizonDays} days
2. Predicted stock levels considering current stock and forecasted sales
3. Recommended reorder quantities (if needed)
4. Confidence level (low/medium/high) and confidence score (0-100)
5. Key factors influencing your forecast (trends, seasonality, etc.)

For each product, respond with a JSON object in this exact format:
{
  "forecasts": [
    {
      "product_id": "uuid",
      "predicted_sales": number,
      "predicted_stock_level": number,
      "recommended_reorder_quantity": number,
      "confidence": "low" | "medium" | "high",
      "confidence_score": number (0-100),
      "reasoning": "Brief explanation of forecast rationale",
      "factors": {
        "trend": "description",
        "velocity_pattern": "description",
        "stockout_risk": "low|medium|high",
        "seasonality": "description if applicable"
      }
    }
  ]
}

Consider:
- Current sales velocity (7d, 30d, 90d averages)
- Trend direction (increasing/stable/decreasing)
- Days until stockout
- Supplier lead times
- Product category patterns
- Digital products don't need physical restocking but may have licensing limits
- Physical products need reordering before stockout considering lead time

Respond ONLY with valid JSON, no additional text.`;
  }

  /**
   * Parse Claude's response into structured forecast data
   */
  private parseForecastResponse(
    responseText: string,
    inventoryData: SalesData[],
    horizonDays: number
  ): ForecastResult[] {
    try {
      // Extract JSON from response (in case Claude adds any wrapper text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const forecasts: ForecastResult[] = [];

      for (const forecast of parsed.forecasts || []) {
        forecasts.push({
          product_id: forecast.product_id,
          forecast_horizon_days: horizonDays,
          predicted_sales: Math.max(0, Math.round(forecast.predicted_sales || 0)),
          predicted_stock_level: Math.max(0, Math.round(forecast.predicted_stock_level || 0)),
          recommended_reorder_quantity: Math.max(0, Math.round(forecast.recommended_reorder_quantity || 0)),
          confidence: forecast.confidence || 'medium',
          confidence_score: Math.min(100, Math.max(0, forecast.confidence_score || 50)),
          reasoning: forecast.reasoning || 'AI-generated forecast',
          factors_considered: forecast.factors || {},
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Error parsing forecast response:', error);
      console.error('Response text:', responseText);
      // Return fallback forecasts based on simple velocity
      return this.generateFallbackForecasts(inventoryData, horizonDays);
    }
  }

  /**
   * Fallback forecast using simple math if AI fails
   */
  private generateFallbackForecasts(data: SalesData[], horizonDays: number): ForecastResult[] {
    return data.map(item => {
      const predictedSales = Math.round(item.avg_daily_sales_30d * horizonDays);
      const predictedStock = Math.max(0, item.current_stock - predictedSales);
      const needsReorder = predictedStock < (item.low_stock_threshold || 10);
      const reorderQty = needsReorder
        ? Math.max(0, (item.optimal_stock_level || item.low_stock_threshold * 3 || 30) - predictedStock)
        : 0;

      return {
        product_id: item.product_id,
        forecast_horizon_days: horizonDays,
        predicted_sales: predictedSales,
        predicted_stock_level: predictedStock,
        recommended_reorder_quantity: reorderQty,
        confidence: 'medium',
        confidence_score: 60,
        reasoning: 'Fallback forecast based on 30-day average sales velocity',
        factors_considered: {
          trend: item.trend_direction || 'stable',
          velocity_pattern: 'linear extrapolation',
          stockout_risk: needsReorder ? 'high' : 'low',
        },
      };
    });
  }

  /**
   * Save forecasts to database
   */
  private async saveForecastsToDatabase(forecasts: ForecastResult[]): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    for (const forecast of forecasts) {
      await db.query(
        `INSERT INTO inventory_forecasts (
          product_id, forecast_date, forecast_horizon_days,
          predicted_sales, predicted_stock_level, recommended_reorder_quantity,
          confidence, confidence_score, model_version, reasoning, factors_considered
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (product_id, forecast_date, forecast_horizon_days)
        DO UPDATE SET
          predicted_sales = EXCLUDED.predicted_sales,
          predicted_stock_level = EXCLUDED.predicted_stock_level,
          recommended_reorder_quantity = EXCLUDED.recommended_reorder_quantity,
          confidence = EXCLUDED.confidence,
          confidence_score = EXCLUDED.confidence_score,
          reasoning = EXCLUDED.reasoning,
          factors_considered = EXCLUDED.factors_considered,
          created_at = CURRENT_TIMESTAMP`,
        [
          forecast.product_id,
          today,
          forecast.forecast_horizon_days,
          forecast.predicted_sales,
          forecast.predicted_stock_level,
          forecast.recommended_reorder_quantity,
          forecast.confidence,
          forecast.confidence_score,
          'claude-sonnet-4-20250514',
          forecast.reasoning,
          JSON.stringify(forecast.factors_considered),
        ]
      );
    }
  }

  /**
   * Generate purchase recommendations
   */
  async generatePurchaseRecommendations(): Promise<PurchaseRecommendation[]> {
    const inventoryData = await this.collectInventoryData();
    const forecasts = await this.getLatestForecasts();

    const recommendations: PurchaseRecommendation[] = [];

    for (const item of inventoryData) {
      const forecast = forecasts.find(f => f.product_id === item.product_id);

      if (!forecast) continue;

      const needsReorder =
        forecast.recommended_reorder_quantity > 0 ||
        item.current_stock <= (item.reorder_point || item.low_stock_threshold);

      if (needsReorder) {
        const leadTime = item.supplier_lead_time || 7;
        const daysUntilStockout = item.days_until_stockout || 999;

        // Calculate priority: higher number = more urgent
        let priority = 5;
        if (daysUntilStockout <= leadTime) priority = 10;
        else if (daysUntilStockout <= leadTime * 2) priority = 8;
        else if (item.current_stock === 0) priority = 9;

        const recommendedOrderDate = new Date();
        const expectedDeliveryDate = new Date();
        expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + leadTime);

        // Use AI recommendation or calculate based on optimal level
        const quantity = forecast.recommended_reorder_quantity > 0
          ? forecast.recommended_reorder_quantity
          : Math.max(item.optimal_stock_level || item.low_stock_threshold * 3 || 30, item.low_stock_threshold * 2);

        recommendations.push({
          product_id: item.product_id,
          recommended_quantity: quantity,
          recommended_order_date: recommendedOrderDate,
          expected_delivery_date: expectedDeliveryDate,
          priority_level: priority,
          reason: this.buildRecommendationReason(item, forecast, daysUntilStockout, leadTime),
          supporting_data: {
            current_stock: item.current_stock,
            forecast_predicted_sales: forecast.predicted_sales,
            forecast_confidence: forecast.confidence,
            days_until_stockout: daysUntilStockout,
            lead_time_days: leadTime,
            avg_daily_sales: item.avg_daily_sales_30d,
          },
        });
      }
    }

    // Save recommendations to database
    await this.savePurchaseRecommendations(recommendations);

    return recommendations.sort((a, b) => b.priority_level - a.priority_level);
  }

  private buildRecommendationReason(
    item: SalesData,
    forecast: any,
    daysUntilStockout: number,
    leadTime: number
  ): string {
    const reasons: string[] = [];

    if (item.current_stock === 0) {
      reasons.push('OUT OF STOCK - Immediate action required');
    } else if (daysUntilStockout <= leadTime) {
      reasons.push(`Stock will run out in ${daysUntilStockout} days, before supplier can deliver (${leadTime} days)`);
    } else if (item.current_stock <= item.low_stock_threshold) {
      reasons.push(`Current stock (${item.current_stock}) below threshold (${item.low_stock_threshold})`);
    }

    if (item.trend_direction === 'increasing') {
      reasons.push('Sales trending upward');
    }

    if (forecast.confidence === 'high') {
      reasons.push('High confidence forecast');
    }

    return reasons.join('. ') || 'Preventive restock to maintain optimal inventory levels';
  }

  private async savePurchaseRecommendations(recommendations: PurchaseRecommendation[]): Promise<void> {
    for (const rec of recommendations) {
      await db.query(
        `INSERT INTO purchase_recommendations (
          product_id, recommended_quantity, recommended_order_date,
          expected_delivery_date, priority_level, reason, supporting_data, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          rec.product_id,
          rec.recommended_quantity,
          rec.recommended_order_date,
          rec.expected_delivery_date,
          rec.priority_level,
          rec.reason,
          JSON.stringify(rec.supporting_data),
          'pending',
        ]
      );
    }
  }

  private async getLatestForecasts(): Promise<any[]> {
    const result = await db.query(`
      SELECT DISTINCT ON (product_id)
        product_id, forecast_date, forecast_horizon_days,
        predicted_sales, predicted_stock_level,
        recommended_reorder_quantity, confidence, confidence_score
      FROM inventory_forecasts
      ORDER BY product_id, forecast_date DESC, created_at DESC
    `);

    return result.rows;
  }

  /**
   * Generate daily AI summary report
   */
  async generateDailySummaryReport(): Promise<string> {
    if (!this.anthropic) {
      return 'AI reporting not available - API key not configured';
    }

    const inventoryData = await this.collectInventoryData();
    const forecasts = await this.getLatestForecasts();
    const alerts = await this.generateAlerts();

    const prompt = `You are an inventory management AI assistant. Generate a concise daily summary report.

Inventory Status:
- Total products: ${inventoryData.length}
- Out of stock: ${inventoryData.filter(i => i.current_stock === 0).length}
- Low stock: ${inventoryData.filter(i => i.current_stock > 0 && i.current_stock <= i.low_stock_threshold).length}
- Critical alerts: ${alerts.filter(a => a.severity === 'critical').length}

Top Issues:
${alerts.slice(0, 5).map(a => `- ${a.message}`).join('\n')}

Sales Trends:
${inventoryData.slice(0, 10).map(i =>
      `- ${i.product_name}: ${i.sales_last_7_days} sales (7d), trend: ${i.trend_direction || 'stable'}`
    ).join('\n')}

Provide:
1. Executive summary (2-3 sentences)
2. Top 3 action items
3. Overall inventory health status (Excellent/Good/Fair/Poor)
4. Brief commentary on trends

Keep it concise and actionable.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const reportText = message.content[0].type === 'text' ? message.content[0].text : '';

      // Save report to database
      await db.query(
        `INSERT INTO inventory_ai_reports (
          report_type, title, summary, detailed_analysis, product_ids, severity
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'daily_summary',
          `Daily Inventory Report - ${new Date().toISOString().split('T')[0]}`,
          reportText.substring(0, 500),
          reportText,
          inventoryData.map(i => i.product_id),
          alerts.some(a => a.severity === 'critical') ? 'critical' : 'info',
        ]
      );

      return reportText;
    } catch (error) {
      console.error('Error generating summary report:', error);
      return 'Unable to generate AI summary at this time.';
    }
  }

  /**
   * Generate alerts for low stock, stockouts, etc.
   */
  async generateAlerts(): Promise<InventoryAlert[]> {
    const inventoryData = await this.collectInventoryData();
    const alerts: InventoryAlert[] = [];

    for (const item of inventoryData) {
      // Out of stock alert
      if (item.current_stock === 0) {
        alerts.push({
          product_id: item.product_id,
          alert_type: 'stockout',
          severity: 'critical',
          message: `${item.product_name} is OUT OF STOCK`,
          current_stock: item.current_stock,
          threshold_value: item.low_stock_threshold,
        });
      }
      // Low stock alert
      else if (item.current_stock <= item.low_stock_threshold) {
        alerts.push({
          product_id: item.product_id,
          alert_type: 'low_stock',
          severity: item.current_stock <= item.low_stock_threshold / 2 ? 'warning' : 'info',
          message: `${item.product_name} stock is low: ${item.current_stock} units remaining`,
          current_stock: item.current_stock,
          threshold_value: item.low_stock_threshold,
        });
      }

      // Trending product alert
      if (item.trend_direction === 'increasing' && item.avg_daily_sales_7d > item.avg_daily_sales_30d * 1.5) {
        alerts.push({
          product_id: item.product_id,
          alert_type: 'trending',
          severity: 'info',
          message: `${item.product_name} is trending! Sales increased ${Math.round(
            ((item.avg_daily_sales_7d - item.avg_daily_sales_30d) / item.avg_daily_sales_30d) * 100
          )}% recently`,
          current_stock: item.current_stock,
          threshold_value: 0,
        });
      }

      // Imminent stockout alert
      if (item.days_until_stockout !== null && item.days_until_stockout <= (item.supplier_lead_time || 7)) {
        alerts.push({
          product_id: item.product_id,
          alert_type: 'imminent_stockout',
          severity: 'warning',
          message: `${item.product_name} will run out in ~${item.days_until_stockout} days (lead time: ${item.supplier_lead_time || 7} days)`,
          current_stock: item.current_stock,
          threshold_value: item.days_until_stockout,
        });
      }
    }

    return alerts;
  }

  /**
   * Update sales velocity for all products
   */
  async updateSalesVelocity(): Promise<void> {
    await db.query(`
      INSERT INTO sales_velocity (
        product_id,
        sales_last_7_days,
        sales_last_30_days,
        sales_last_90_days,
        avg_daily_sales_7d,
        avg_daily_sales_30d,
        avg_daily_sales_90d,
        trend_direction,
        trend_percentage
      )
      SELECT
        p.id,
        COALESCE((
          SELECT SUM(oi.quantity)
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.product_id = p.id
            AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
            AND o.status NOT IN ('cancelled')
        ), 0) as sales_last_7_days,
        COALESCE((
          SELECT SUM(oi.quantity)
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.product_id = p.id
            AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
            AND o.status NOT IN ('cancelled')
        ), 0) as sales_last_30_days,
        COALESCE((
          SELECT SUM(oi.quantity)
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.product_id = p.id
            AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
            AND o.status NOT IN ('cancelled')
        ), 0) as sales_last_90_days,
        ROUND(COALESCE((
          SELECT SUM(oi.quantity) / 7.0
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.product_id = p.id
            AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
            AND o.status NOT IN ('cancelled')
        ), 0), 2) as avg_daily_sales_7d,
        ROUND(COALESCE((
          SELECT SUM(oi.quantity) / 30.0
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.product_id = p.id
            AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
            AND o.status NOT IN ('cancelled')
        ), 0), 2) as avg_daily_sales_30d,
        ROUND(COALESCE((
          SELECT SUM(oi.quantity) / 90.0
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.product_id = p.id
            AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
            AND o.status NOT IN ('cancelled')
        ), 0), 2) as avg_daily_sales_90d,
        CASE
          WHEN (
            SELECT SUM(oi.quantity) / 7.0
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.product_id = p.id
              AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
          ) > (
            SELECT SUM(oi.quantity) / 30.0
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.product_id = p.id
              AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
          ) * 1.2 THEN 'increasing'
          WHEN (
            SELECT SUM(oi.quantity) / 7.0
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.product_id = p.id
              AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
          ) < (
            SELECT SUM(oi.quantity) / 30.0
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.product_id = p.id
              AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
          ) * 0.8 THEN 'decreasing'
          ELSE 'stable'
        END as trend_direction,
        0 as trend_percentage
      FROM products p
      WHERE p.is_active = TRUE
      ON CONFLICT (product_id)
      DO UPDATE SET
        sales_last_7_days = EXCLUDED.sales_last_7_days,
        sales_last_30_days = EXCLUDED.sales_last_30_days,
        sales_last_90_days = EXCLUDED.sales_last_90_days,
        avg_daily_sales_7d = EXCLUDED.avg_daily_sales_7d,
        avg_daily_sales_30d = EXCLUDED.avg_daily_sales_30d,
        avg_daily_sales_90d = EXCLUDED.avg_daily_sales_90d,
        trend_direction = EXCLUDED.trend_direction,
        updated_at = CURRENT_TIMESTAMP
    `);
  }
}

export default new InventoryAIService();
