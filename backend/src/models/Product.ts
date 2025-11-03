import { IProduct } from '../types';

// In-memory storage (replace with MongoDB in production)
class ProductModel {
  private products: IProduct[] = [];
  private nextId = 1;

  constructor() {
    // Initialize with empty array
  }

  async findAll(): Promise<IProduct[]> {
    return this.products;
  }

  async findById(id: string): Promise<IProduct | null> {
    return this.products.find(p => p.id === id) || null;
  }

  async findByCategory(category: string): Promise<IProduct[]> {
    return this.products.filter(p => p.category === category);
  }

  async search(query: string): Promise<IProduct[]> {
    const searchTerm = query.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm)
    );
  }

  async create(productData: Omit<IProduct, 'id'>): Promise<IProduct> {
    const product: IProduct = {
      id: String(this.nextId++),
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.products.push(product);
    return product;
  }

  async update(id: string, productData: Partial<IProduct>): Promise<IProduct | null> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    this.products[index] = {
      ...this.products[index],
      ...productData,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };
    return this.products[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.products.splice(index, 1);
    return true;
  }

  async updateStock(id: string, quantity: number): Promise<IProduct | null> {
    const product = await this.findById(id);
    if (!product) return null;

    product.stock += quantity;
    product.updatedAt = new Date();
    return product;
  }

  // Initialize with seed data
  async seed(products: Omit<IProduct, 'id'>[]): Promise<void> {
    this.products = [];
    this.nextId = 1;
    for (const product of products) {
      await this.create(product);
    }
  }
}

export default new ProductModel();
