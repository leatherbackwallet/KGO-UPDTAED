/**
 * Shared Type Definitions
 * Centralized type definitions to eliminate duplicacies across the application
 */

// Base Product Interface
export interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  originalPrice?: number;
  category: string | { _id: string; name: string; slug: string };
  categories?: (string | { _id: string; name: string; slug: string })[];
  stock?: number;
  images: string[];
  slug?: string;
  occasions?: string[];
  isFeatured?: boolean;
  inStock?: boolean;
  featured?: boolean;
  defaultImage?: string;
  
  // Combo product fields
  isCombo?: boolean;
  comboBasePrice?: number;
  comboItems?: ComboItem[];
  
  // Additional fields
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  isActive?: boolean;
  isSeasonal?: boolean;
}

// Combo Item Interface
export interface ComboItem {
  name: string;
  unitPrice: number;
  unit: string;
  defaultQuantity?: number;
}

// Category Interface
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  isSeasonal?: boolean;
}

// Occasion Interface
export interface Occasion {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  color?: string;
  dateRange?: {
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    isRecurring: boolean;
    specificYear?: number;
  };
  priority?: {
    level: 'low' | 'medium' | 'high' | 'peak';
    boostMultiplier: number;
  };
  seasonalFlags?: {
    isFestival: boolean;
    isHoliday: boolean;
    isPersonal: boolean;
    isSeasonal: boolean;
  };
  isActive?: boolean;
  isSeasonal?: boolean;
}

// Product Filters Interface
export interface ProductFilters {
  category?: string;
  occasions?: string;
  search?: string;
  featured?: boolean;
  min?: number;
  max?: number;
  page?: number;
  limit?: number;
  sort?: string;
  includeDeleted?: boolean;
  admin?: boolean;
}

// API Response Interfaces
export interface ProductResponse {
  success: boolean;
  data: Product[];
  count?: number;
  total?: number;
  pages?: number;
  currentPage?: number;
  error?: {
    message: string;
    code: string;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AppliedFilters {
  category?: string;
  occasions?: string[];
  search?: string;
  featured?: boolean;
  priceRange?: {
    min: number;
    max: number;
  };
  sort?: string;
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

// Product Loading Hook Return Type
export interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  filters: ProductFilters;
  setFilters: (filters: Partial<ProductFilters>) => void;
  pagination: PaginationInfo | null;
  appliedFilters: AppliedFilters;
}

// API Service Configuration
export interface ApiServiceConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  cacheStrategy?: 'cache-first' | 'network-first' | 'cache-only' | 'network-only';
}

// Error Types
export interface ApiError {
  message: string;
  code: string;
  status?: number;
  retryable?: boolean;
}

// Cache Entry
export interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
  key: string;
}
