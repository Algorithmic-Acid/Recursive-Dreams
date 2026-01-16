import { db } from '../config/postgres';
import { IOrder, ICartItem } from '../types';
import { PoolClient } from 'pg';

interface OrderRow {
  id: string;
  user_id: string;
  order_number: string;
  total_amount: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_intent_id: string | null;
  shipping_full_name: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_zip_code: string | null;
  shipping_country: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_icon: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  created_at: Date;
}

class OrderRepository {
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async findAll(): Promise<IOrder[]> {
    const result = await db.query<OrderRow>(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );

    const orders = [];
    for (const row of result.rows) {
      const order = await this.mapRowToOrder(row);
      orders.push(order);
    }

    return orders;
  }

  async findById(id: string): Promise<IOrder | null> {
    const result = await db.query<OrderRow>(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return await this.mapRowToOrder(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<IOrder[]> {
    const result = await db.query<OrderRow>(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const orders = [];
    for (const row of result.rows) {
      const order = await this.mapRowToOrder(row);
      orders.push(order);
    }

    return orders;
  }

  async findByStatus(status: string): Promise<IOrder[]> {
    const result = await db.query<OrderRow>(
      'SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );

    const orders = [];
    for (const row of result.rows) {
      const order = await this.mapRowToOrder(row);
      orders.push(order);
    }

    return orders;
  }

  async create(orderData: {
    userId: string;
    items: ICartItem[];
    total: number;
    shippingAddress: any;
    paymentMethod: string;
  }): Promise<IOrder> {
    return await db.transaction(async (client: PoolClient) => {
      // Create order
      const orderNumber = this.generateOrderNumber();

      const orderResult = await client.query<OrderRow>(
        `INSERT INTO orders (
          user_id, order_number, total_amount, payment_method,
          shipping_full_name, shipping_address, shipping_city,
          shipping_state, shipping_zip_code, shipping_country
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          orderData.userId,
          orderNumber,
          orderData.total,
          orderData.paymentMethod,
          orderData.shippingAddress?.fullName || null,
          orderData.shippingAddress?.address || null,
          orderData.shippingAddress?.city || null,
          orderData.shippingAddress?.state || null,
          orderData.shippingAddress?.zipCode || null,
          orderData.shippingAddress?.country || 'United States',
        ]
      );

      const order = orderResult.rows[0];

      // Create order items
      for (const item of orderData.items) {
        const product = item.product;
        if (!product) continue;

        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, product_icon,
            quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            order.id,
            item.productId,
            product.name,
            product.icon,
            item.quantity,
            product.price,
            product.price * item.quantity,
          ]
        );

        // Update product stock
        await client.query(
          `UPDATE products
           SET stock_quantity = GREATEST(0, stock_quantity - $1)
           WHERE id = $2`,
          [item.quantity, item.productId]
        );

        // Log inventory event
        await client.query(
          `INSERT INTO inventory_events (
            product_id, event_type, quantity_change,
            quantity_before, quantity_after, order_id, notes
          )
          SELECT
            $1, 'sale', $2,
            stock_quantity + $2,
            stock_quantity,
            $3,
            'Product sold via order ' || $4
          FROM products
          WHERE id = $1`,
          [item.productId, -item.quantity, order.id, orderNumber]
        );
      }

      return await this.mapRowToOrder(order, client);
    });
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  ): Promise<IOrder | null> {
    const result = await db.query<OrderRow>(
      `UPDATE orders
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return await this.mapRowToOrder(result.rows[0]);
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
    paymentIntentId?: string
  ): Promise<IOrder | null> {
    const result = await db.query<OrderRow>(
      `UPDATE orders
       SET payment_status = $1,
           payment_intent_id = COALESCE($2, payment_intent_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [paymentStatus, paymentIntentId || null, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return await this.mapRowToOrder(result.rows[0]);
  }

  async updateTrackingNumber(id: string, trackingNumber: string): Promise<IOrder | null> {
    const result = await db.query<OrderRow>(
      `UPDATE orders
       SET tracking_number = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [trackingNumber, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return await this.mapRowToOrder(result.rows[0]);
  }

  private async getOrderItems(orderId: string, client?: PoolClient): Promise<ICartItem[]> {
    const result = client
      ? await client.query<OrderItemRow>(
          'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at',
          [orderId]
        )
      : await db.query<OrderItemRow>(
          'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at',
          [orderId]
        );

    return result.rows.map(row => ({
      productId: row.product_id,
      quantity: row.quantity,
      product: {
        id: row.product_id,
        name: row.product_name,
        icon: row.product_icon,
        price: parseFloat(row.unit_price),
        category: 'software' as any,
        description: '',
        stock: 0,
      },
    }));
  }

  private async mapRowToOrder(row: OrderRow, client?: PoolClient): Promise<IOrder> {
    const items = await this.getOrderItems(row.id, client);

    return {
      id: row.id,
      userId: row.user_id,
      items,
      total: parseFloat(row.total_amount),
      status: row.status as any,
      shippingAddress: {
        fullName: row.shipping_full_name || '',
        address: row.shipping_address || '',
        city: row.shipping_city || '',
        state: row.shipping_state || '',
        zipCode: row.shipping_zip_code || '',
        country: row.shipping_country || 'United States',
      },
      paymentMethod: row.payment_method || 'card',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new OrderRepository();
