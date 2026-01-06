import { db } from '../config/postgres';
import { IProduct, ProductCategory } from '../types';

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  product_type: 'digital' | 'physical';
  price: string;
  description: string;
  icon: string;
  image_url: string | null;
  is_active: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  optimal_stock_level: number | null;
  reorder_point: number | null;
  download_url: string | null;
  file_size_mb: string | null;
  physical_attributes: any;
  sku: string | null;
  supplier_id: string | null;
  supplier_sku: string | null;
  cost_price: string | null;
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

class ProductRepository {
  private mapRowToProduct(row: ProductRow): IProduct {
    return {
      id: row.id,
      name: row.name,
      category: row.category as ProductCategory,
      price: parseFloat(row.price),
      description: row.description,
      icon: row.icon,
      stock: row.stock_quantity,
      image: row.image_url || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findAll(): Promise<IProduct[]> {
    const result = await db.query<ProductRow>(
      'SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    return result.rows.map(row => this.mapRowToProduct(row));
  }

  async findById(id: string): Promise<IProduct | null> {
    const result = await db.query<ProductRow>(
      'SELECT * FROM products WHERE id = $1 AND is_active = TRUE',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProduct(result.rows[0]);
  }

  async findByCategory(category: string): Promise<IProduct[]> {
    const result = await db.query<ProductRow>(
      'SELECT * FROM products WHERE category = $1 AND is_active = TRUE ORDER BY created_at DESC',
      [category]
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  async search(query: string): Promise<IProduct[]> {
    const searchPattern = `%${query}%`;
    const result = await db.query<ProductRow>(
      `SELECT * FROM products
       WHERE is_active = TRUE
         AND (
           name ILIKE $1
           OR description ILIKE $1
           OR category::text ILIKE $1
           OR sku ILIKE $1
         )
       ORDER BY created_at DESC`,
      [searchPattern]
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  async create(productData: Omit<IProduct, 'id'>): Promise<IProduct> {
    const slug = productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const result = await db.query<ProductRow>(
      `INSERT INTO products (
        name, slug, category, product_type, price, description, icon,
        image_url, stock_quantity, low_stock_threshold
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        productData.name,
        slug,
        productData.category,
        'physical', // Default to physical, can be enhanced later
        productData.price,
        productData.description,
        productData.icon,
        productData.image || null,
        productData.stock,
        10, // Default low stock threshold
      ]
    );

    return this.mapRowToProduct(result.rows[0]);
  }

  async update(id: string, productData: Partial<IProduct>): Promise<IProduct | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (productData.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(productData.name);
      // Update slug if name changes
      updates.push(`slug = $${paramCount++}`);
      values.push(productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }

    if (productData.category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(productData.category);
    }

    if (productData.price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(productData.price);
    }

    if (productData.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(productData.description);
    }

    if (productData.icon !== undefined) {
      updates.push(`icon = $${paramCount++}`);
      values.push(productData.icon);
    }

    if (productData.stock !== undefined) {
      updates.push(`stock_quantity = $${paramCount++}`);
      values.push(productData.stock);
    }

    if (productData.image !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(productData.image);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await db.query<ProductRow>(
      `UPDATE products
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} AND is_active = TRUE
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProduct(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    // Soft delete
    const result = await db.query(
      'UPDATE products SET is_active = FALSE WHERE id = $1',
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateStock(id: string, quantity: number): Promise<IProduct | null> {
    const result = await db.query<ProductRow>(
      `UPDATE products
       SET stock_quantity = GREATEST(0, stock_quantity + $1),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND is_active = TRUE
       RETURNING *`,
      [quantity, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProduct(result.rows[0]);
  }

  async setStock(id: string, quantity: number): Promise<IProduct | null> {
    const result = await db.query<ProductRow>(
      `UPDATE products
       SET stock_quantity = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND is_active = TRUE
       RETURNING *`,
      [Math.max(0, quantity), id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProduct(result.rows[0]);
  }

  async findLowStock(): Promise<IProduct[]> {
    const result = await db.query<ProductRow>(
      `SELECT * FROM products
       WHERE is_active = TRUE
         AND stock_quantity <= low_stock_threshold
       ORDER BY stock_quantity ASC`
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }

  async findOutOfStock(): Promise<IProduct[]> {
    const result = await db.query<ProductRow>(
      `SELECT * FROM products
       WHERE is_active = TRUE AND stock_quantity = 0
       ORDER BY created_at DESC`
    );

    return result.rows.map(row => this.mapRowToProduct(row));
  }
}

export default new ProductRepository();
