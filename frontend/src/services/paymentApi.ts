import api from './api';

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  discountAmount?: number;
}

export interface PaymentItem {
  productId: string;
  quantity: number;
  variantPrice?: number;
  variantName?: string;
}

export const paymentAPI = {
  getConfig: async (): Promise<{ publishableKey: string }> => {
    const response = await api.get('/payments/config');
    return response.data.data;
  },

  createPaymentIntent: async (
    items: PaymentItem[],
    token: string,
    promoCode?: string
  ): Promise<PaymentIntentResponse> => {
    const response = await api.post(
      '/payments/create-intent',
      { items, ...(promoCode ? { promoCode } : {}) },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data;
  },

  confirmPayment: async (
    paymentIntentId: string,
    token: string
  ): Promise<{ status: string; amount: number }> => {
    const response = await api.post(
      '/payments/confirm',
      { paymentIntentId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data;
  },

  // Crypto payment methods
  createCryptoPayment: async (
    items: { productId: string; quantity: number }[],
    cryptoType: 'xmr' | 'btc',
    shippingAddress: any,
    token: string,
    promoCode?: string
  ) => {
    const response = await api.post(
      '/payments/crypto/create',
      { items, cryptoType, shippingAddress, ...(promoCode ? { promoCode } : {}) },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  },

  submitCryptoTx: async (
    paymentId: string,
    txHash: string,
    token: string
  ) => {
    const response = await api.post(
      '/payments/crypto/submit-tx',
      { paymentId, txHash },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  checkCryptoStatus: async (
    paymentId: string,
    token: string
  ) => {
    const response = await api.get(
      `/payments/crypto/status/${paymentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  },
};
