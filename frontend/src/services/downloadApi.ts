import api from './api';

export interface PurchasedDownload {
  productId: string;
  name: string;
  icon: string;
  downloadFile: string;
  purchasedAt: string;
}

export const downloadAPI = {
  getMyDownloads: async (token: string): Promise<PurchasedDownload[]> => {
    const response = await api.get('/downloads/my-downloads', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data || [];
  },

  checkAccess: async (
    productId: string,
    token: string
  ): Promise<{ hasAccess: boolean; productName: string; downloadFile: string }> => {
    const response = await api.get(`/downloads/check/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  },

  getDownloadUrl: (productId: string, token: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return `${baseUrl}/api/downloads/file/${productId}?token=${token}`;
  },
};
