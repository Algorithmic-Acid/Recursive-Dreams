import axios from 'axios';
import { Product, ApiResponse, ProductCategory } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products API
export const productAPI = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get<ApiResponse<Product[]>>('/products');
    return response.data.data || [];
  },

  getById: async (id: string): Promise<Product | null> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data || null;
  },

  getByCategory: async (category: ProductCategory): Promise<Product[]> => {
    const response = await api.get<ApiResponse<Product[]>>(`/products?category=${category}`);
    return response.data.data || [];
  },

  search: async (query: string): Promise<Product[]> => {
    const response = await api.get<ApiResponse<Product[]>>(`/products?search=${query}`);
    return response.data.data || [];
  },
};

export default api;
