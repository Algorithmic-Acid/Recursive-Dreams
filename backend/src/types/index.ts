export type ProductCategory = 'shirts' | 'music' | 'anime' | 'games' | 'software';

export interface IProduct {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
  icon: string;
  stock: number;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICartItem {
  productId: string;
  quantity: number;
  product?: IProduct;
}

export interface ICart {
  userId?: string;
  items: ICartItem[];
  total: number;
}

export interface IUser {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrder {
  id: string;
  userId: string;
  items: ICartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: IShippingAddress;
  paymentMethod: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
