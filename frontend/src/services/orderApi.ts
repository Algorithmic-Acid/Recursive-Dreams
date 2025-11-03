import api from './api';
import { Order, CreateOrderRequest, ApiResponse } from '../types';

export const orderAPI = {
  create: async (orderData: CreateOrderRequest, token: string): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>(
      '/orders',
      orderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data!;
  },

  getMyOrders: async (token: string): Promise<Order[]> => {
    const response = await api.get<ApiResponse<Order[]>>('/orders/my-orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data || [];
  },

  getById: async (id: string, token: string): Promise<Order | null> => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data || null;
  },

  cancel: async (id: string, token: string): Promise<Order> => {
    const response = await api.patch<ApiResponse<Order>>(
      `/orders/${id}/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data!;
  },
};
