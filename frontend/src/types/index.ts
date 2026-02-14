export type ProductCategory = 'synthesizers' | 'midi_controllers' | 'effects_pedals' | 'hoodies' | 'shirts' | 'pants' | 'software' | 'soundscapes' | 'music' | 'templates';

export interface PricingVariant {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
  icon: string;
  stock: number;
  image?: string;
  download_url?: string;
  file_size_mb?: number;
  pricing_variants?: PricingVariant[];
  download_file?: string;
  preview_url?: string;
  license_type?: string;
  metadata?: {
    download_file?: string;
    is_downloadable?: boolean;
    pricing_variants?: PricingVariant[];
    bpm?: number;
    musical_key?: string;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: PricingVariant;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Traffic monitoring types
export interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  userAgent: string;
  userId?: string;
  userName?: string;
}

export interface TrafficStats {
  totalRequests: number;
  uniqueVisitors: number;
  requestsLastMinute: number;
  requestsLastHour: number;
  requestsToday: number;
  avgResponseTime: number;
  methodCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  topPaths: Array<{ path: string; count: number; avgResponseTime: number }>;
  authenticatedVsGuest: { authenticated: number; guest: number };
}

export interface TrafficTrend {
  timestamp: string;
  requestCount: number;
  avgResponseTime: number;
  errorCount: number;
}

// Export order types
export * from './order';
