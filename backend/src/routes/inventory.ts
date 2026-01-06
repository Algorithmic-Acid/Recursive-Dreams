import express, { Request, Response, Router } from 'express';
import inventoryAIService from '../services/InventoryAIService';
import { db } from '../config/postgres';

const router: Router = express.Router();

/**
 * GET /api/inventory/dashboard
 * Get inventory health dashboard summary
 */
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        name,
        category,
        stock_quantity,
        low_stock_threshold,
        avg_daily_sales_30d,
        trend_direction,
        stock_status,
        active_alerts
      FROM inventory_health_summary
      ORDER BY
        CASE stock_status
          WHEN 'out_of_stock' THEN 1
          WHEN 'low' THEN 2
          WHEN 'overstock' THEN 3
          WHEN 'healthy' THEN 4
        END,
        name
    `);

    const summary = {
      total_products: result.rows.length,
      out_of_stock: result.rows.filter((r: any) => r.stock_status === 'out_of_stock').length,
      low_stock: result.rows.filter((r: any) => r.stock_status === 'low').length,
      healthy: result.rows.filter((r: any) => r.stock_status === 'healthy').length,
      overstock: result.rows.filter((r: any) => r.stock_status === 'overstock').length,
      total_alerts: result.rows.reduce((sum: number, r: any) => sum + (r.active_alerts || 0), 0),
      products: result.rows,
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error fetching inventory dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory dashboard',
      message: error.message,
    });
  }
});

/**
 * GET /api/inventory/alerts
 * Get current inventory alerts
 */
router.get('/alerts', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        ia.*,
        p.name as product_name,
        p.category
      FROM inventory_alerts ia
      JOIN products p ON ia.product_id = p.id
      WHERE ia.is_resolved = FALSE
      ORDER BY
        CASE ia.severity
          WHEN 'critical' THEN 1
          WHEN 'warning' THEN 2
          WHEN 'info' THEN 3
        END,
        ia.created_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      message: error.message,
    });
  }
});

/**
 * POST /api/inventory/alerts/:id/resolve
 * Mark an alert as resolved
 */
router.post('/alerts/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE inventory_alerts
       SET is_resolved = TRUE, resolved_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert',
      message: error.message,
    });
  }
});

/**
 * POST /api/inventory/forecast
 * Generate AI forecast for inventory
 */
router.post('/forecast', async (req: Request, res: Response) => {
  try {
    const { horizonDays = 30 } = req.body;

    const forecasts = await inventoryAIService.generateForecast(horizonDays);

    res.json({
      success: true,
      data: {
        forecasts,
        horizon_days: horizonDays,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate forecast',
      message: error.message,
    });
  }
});

/**
 * GET /api/inventory/forecast/:productId
 * Get latest forecast for a specific product
 */
router.get('/forecast/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const result = await db.query(
      `SELECT * FROM inventory_forecasts
       WHERE product_id = $1
       ORDER BY forecast_date DESC, created_at DESC
       LIMIT 10`,
      [productId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forecast',
      message: error.message,
    });
  }
});

/**
 * POST /api/inventory/recommendations
 * Generate purchase recommendations
 */
router.post('/recommendations', async (_req: Request, res: Response) => {
  try {
    const recommendations = await inventoryAIService.generatePurchaseRecommendations();

    res.json({
      success: true,
      data: {
        recommendations,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      message: error.message,
    });
  }
});

/**
 * GET /api/inventory/recommendations
 * Get pending purchase recommendations
 */
router.get('/recommendations', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        pr.*,
        p.name as product_name,
        p.category,
        p.stock_quantity as current_stock,
        s.name as supplier_name
      FROM purchase_recommendations pr
      JOIN products p ON pr.product_id = p.id
      LEFT JOIN suppliers s ON pr.supplier_id = s.id
      WHERE pr.status = 'pending'
      ORDER BY pr.priority_level DESC, pr.recommended_order_date ASC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations',
      message: error.message,
    });
  }
});

/**
 * POST /api/inventory/recommendations/:id/approve
 * Approve a purchase recommendation
 */
router.post('/recommendations/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // In production, get from auth middleware

    const result = await db.query(
      `UPDATE purchase_recommendations
       SET status = 'approved',
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [userId || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recommendation not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Purchase recommendation approved',
    });
  } catch (error: any) {
    console.error('Error approving recommendation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve recommendation',
      message: error.message,
    });
  }
});

/**
 * POST /api/inventory/recommendations/:id/reject
 * Reject a purchase recommendation
 */
router.post('/recommendations/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE purchase_recommendations
       SET status = 'rejected'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recommendation not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Purchase recommendation rejected',
    });
  } catch (error: any) {
    console.error('Error rejecting recommendation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject recommendation',
      message: error.message,
    });
  }
});

/**
 * POST /api/inventory/reports/daily
 * Generate daily AI summary report
 */
router.post('/reports/daily', async (_req: Request, res: Response) => {
  try {
    const report = await inventoryAIService.generateDailySummaryReport();

    res.json({
      success: true,
      data: {
        report,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating daily report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily report',
      message: error.message,
    });
  }
});

/**
 * GET /api/inventory/reports
 * Get recent AI reports
 */
router.get('/reports', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT * FROM inventory_ai_reports
      ORDER BY created_at DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      message: error.message,
    });
  }
});

/**
 * POST /api/inventory/update-velocity
 * Manually trigger sales velocity update
 */
router.post('/update-velocity', async (_req: Request, res: Response) => {
  try {
    await inventoryAIService.updateSalesVelocity();

    res.json({
      success: true,
      message: 'Sales velocity updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating sales velocity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sales velocity',
      message: error.message,
    });
  }
});

/**
 * GET /api/inventory/products-needing-reorder
 * Get products that need reordering
 */
router.get('/products-needing-reorder', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT * FROM products_needing_reorder
      ORDER BY days_until_stockout ASC NULLS LAST
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching products needing reorder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products needing reorder',
      message: error.message,
    });
  }
});

/**
 * GET /api/inventory/analytics/:productId
 * Get detailed analytics for a specific product
 */
router.get('/analytics/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    // Get product info with sales velocity
    const productResult = await db.query(`
      SELECT
        p.*,
        sv.*
      FROM products p
      LEFT JOIN sales_velocity sv ON p.id = sv.product_id
      WHERE p.id = $1
    `, [productId]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    // Get recent inventory events
    const eventsResult = await db.query(`
      SELECT * FROM inventory_events
      WHERE product_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [productId]);

    // Get recent forecasts
    const forecastsResult = await db.query(`
      SELECT * FROM inventory_forecasts
      WHERE product_id = $1
      ORDER BY forecast_date DESC
      LIMIT 10
    `, [productId]);

    // Get active alerts
    const alertsResult = await db.query(`
      SELECT * FROM inventory_alerts
      WHERE product_id = $1 AND is_resolved = FALSE
      ORDER BY created_at DESC
    `, [productId]);

    res.json({
      success: true,
      data: {
        product: productResult.rows[0],
        recent_events: eventsResult.rows,
        forecasts: forecastsResult.rows,
        active_alerts: alertsResult.rows,
      },
    });
  } catch (error: any) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product analytics',
      message: error.message,
    });
  }
});

export default router;
