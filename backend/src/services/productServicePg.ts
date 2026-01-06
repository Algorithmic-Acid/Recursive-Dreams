import ProductRepository from '../repositories/ProductRepository';
import { IProduct } from '../types';

/**
 * PostgreSQL Product Service
 * Replaces the old MongoDB/In-memory hybrid service
 */
class ProductServicePg {
  async findAll(): Promise<IProduct[]> {
    return await ProductRepository.findAll();
  }

  async findById(id: string): Promise<IProduct | null> {
    return await ProductRepository.findById(id);
  }

  async findByCategory(category: string): Promise<IProduct[]> {
    return await ProductRepository.findByCategory(category);
  }

  async search(query: string): Promise<IProduct[]> {
    return await ProductRepository.search(query);
  }

  async create(productData: Omit<IProduct, 'id'>): Promise<IProduct> {
    return await ProductRepository.create(productData);
  }

  async update(id: string, productData: Partial<IProduct>): Promise<IProduct | null> {
    return await ProductRepository.update(id, productData);
  }

  async delete(id: string): Promise<boolean> {
    return await ProductRepository.delete(id);
  }

  async updateStock(id: string, quantity: number): Promise<IProduct | null> {
    return await ProductRepository.updateStock(id, quantity);
  }

  async setStock(id: string, quantity: number): Promise<IProduct | null> {
    return await ProductRepository.setStock(id, quantity);
  }

  async findLowStock(): Promise<IProduct[]> {
    return await ProductRepository.findLowStock();
  }

  async findOutOfStock(): Promise<IProduct[]> {
    return await ProductRepository.findOutOfStock();
  }

  getStorageType(): string {
    return 'PostgreSQL';
  }
}

export default new ProductServicePg();
