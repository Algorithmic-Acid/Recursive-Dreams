export type ProductCategory = 'synthesizers' | 'midi_controllers' | 'effects_pedals' | 'hoodies' | 'shirts' | 'pants';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
  icon: string;
  stock: number;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Export order types
export * from './order';
