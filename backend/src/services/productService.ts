import mongoose from 'mongoose';
import ProductModel from '../models/ProductModel.mongoose';
import InMemoryProduct from '../models/Product';
import { IProduct } from '../types';

// Service layer that works with both MongoDB and in-memory storage
class ProductService {
  private useDatabase: boolean = false;

  constructor() {
    // Check if MongoDB is connected
    this.useDatabase = mongoose.connection.readyState === 1;
  }

  private checkConnection() {
    this.useDatabase = mongoose.connection.readyState === 1;
  }

  async findAll(): Promise<IProduct[]> {
    this.checkConnection();

    if (this.useDatabase) {
      const products = await ProductModel.find().lean();
      return products.map(p => ({ ...p, id: p._id.toString() }));
    }
    return InMemoryProduct.findAll();
  }

  async findById(id: string): Promise<IProduct | null> {
    this.checkConnection();

    if (this.useDatabase) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return InMemoryProduct.findById(id);
      }
      const product = await ProductModel.findById(id).lean();
      return product ? { ...product, id: product._id.toString() } : null;
    }
    return InMemoryProduct.findById(id);
  }

  async findByCategory(category: string): Promise<IProduct[]> {
    this.checkConnection();

    if (this.useDatabase) {
      const products = await ProductModel.find({ category }).lean();
      return products.map(p => ({ ...p, id: p._id.toString() }));
    }
    return InMemoryProduct.findByCategory(category);
  }

  async search(query: string): Promise<IProduct[]> {
    this.checkConnection();

    if (this.useDatabase) {
      const products = await ProductModel.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
        ],
      }).lean();
      return products.map(p => ({ ...p, id: p._id.toString() }));
    }
    return InMemoryProduct.search(query);
  }

  async create(productData: Omit<IProduct, 'id'>): Promise<IProduct> {
    this.checkConnection();

    if (this.useDatabase) {
      const product = await ProductModel.create(productData);
      return { ...product.toJSON(), id: product._id.toString() };
    }
    return InMemoryProduct.create(productData);
  }

  async update(id: string, productData: Partial<IProduct>): Promise<IProduct | null> {
    this.checkConnection();

    if (this.useDatabase) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return InMemoryProduct.update(id, productData);
      }
      const product = await ProductModel.findByIdAndUpdate(
        id,
        productData,
        { new: true, runValidators: true }
      ).lean();
      return product ? { ...product, id: product._id.toString() } : null;
    }
    return InMemoryProduct.update(id, productData);
  }

  async delete(id: string): Promise<boolean> {
    this.checkConnection();

    if (this.useDatabase) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return InMemoryProduct.delete(id);
      }
      const result = await ProductModel.findByIdAndDelete(id);
      return !!result;
    }
    return InMemoryProduct.delete(id);
  }

  async updateStock(id: string, quantity: number): Promise<IProduct | null> {
    this.checkConnection();

    if (this.useDatabase) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return InMemoryProduct.updateStock(id, quantity);
      }
      const product = await ProductModel.findById(id);
      if (!product) return null;

      product.stock += quantity;
      if (product.stock < 0) product.stock = 0;
      await product.save();

      return { ...product.toJSON(), id: product._id.toString() };
    }
    return InMemoryProduct.updateStock(id, quantity);
  }

  getStorageType(): string {
    this.checkConnection();
    return this.useDatabase ? 'MongoDB' : 'In-Memory';
  }
}

export default new ProductService();
