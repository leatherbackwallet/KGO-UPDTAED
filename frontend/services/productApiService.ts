/**
 * Centralized Product API Service
 * Single source of truth for all product-related API calls
 * Eliminates duplicacies across components
 */

import api from '../utils/api';
import { Product, ProductFilters, ProductResponse, ApiError } from '../types/shared';

class ProductApiService {
  private baseEndpoint = '/products';

  /**
   * Get products with filters
   */
  async getProducts(filters: ProductFilters = {}): Promise<ProductResponse> {
    try {
      console.log('🔍 ProductApiService: Getting products with filters:', filters);
      const params = new URLSearchParams();
      
      // Add filters to query params
      if (filters.category) params.append('category', filters.category);
      if (filters.occasions) params.append('occasions', filters.occasions);
      if (filters.search) params.append('search', filters.search);
      if (filters.featured) params.append('featured', 'true');
      if (filters.min) params.append('min', filters.min.toString());
      if (filters.max) params.append('max', filters.max.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.includeDeleted) params.append('includeDeleted', 'true');
      if (filters.admin) params.append('admin', 'true');

      const url = `${this.baseEndpoint}?${params.toString()}`;
      console.log('🌐 ProductApiService: Making request to:', url);
      
      const response = await api.get(url);
      console.log('📡 ProductApiService: Response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ ProductApiService: Error occurred:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get single product by ID
   */
  async getProductById(id: string): Promise<Product> {
    try {
      const response = await api.get(`${this.baseEndpoint}/${id}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string, filters: Omit<ProductFilters, 'search'> = {}): Promise<ProductResponse> {
    return this.getProducts({ ...filters, search: query });
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 12): Promise<ProductResponse> {
    return this.getProducts({ featured: true, limit });
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categorySlug: string, limit: number = 50): Promise<ProductResponse> {
    return this.getProducts({ category: categorySlug, limit });
  }

  /**
   * Get products by occasion
   */
  async getProductsByOccasion(occasionSlug: string, limit: number = 50): Promise<ProductResponse> {
    return this.getProducts({ occasions: occasionSlug, limit });
  }

  /**
   * Get products for admin (with all data)
   */
  async getAdminProducts(filters: ProductFilters = {}): Promise<ProductResponse> {
    return this.getProducts({ ...filters, admin: true, includeDeleted: false });
  }

  /**
   * Create new product (admin only)
   */
  async createProduct(productData: Partial<Product>): Promise<Product> {
    try {
      const response = await api.post(this.baseEndpoint, productData);
      return response.data.data || response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update product (admin only)
   */
  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    try {
      const response = await api.put(`${this.baseEndpoint}/${id}`, productData);
      return response.data.data || response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete product (admin only)
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseEndpoint}/${id}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get products for sitemap (public, no auth required)
   */
  async getProductsForSitemap(limit: number = 1000): Promise<Product[]> {
    try {
      const response = await this.getProducts({ limit, admin: true });
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching products for sitemap:', error);
      return [];
    }
  }

  /**
   * Get products for delivery pages
   */
  async getProductsForDelivery(limit: number = 12): Promise<Product[]> {
    try {
      const response = await this.getProducts({ featured: true, limit });
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching products for delivery:', error);
      return [];
    }
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: any): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500,
      retryable: false
    };

    if (error.response) {
      // Server responded with error status
      apiError.status = error.response.status;
      apiError.message = error.response.data?.error?.message || 
                         error.response.data?.message || 
                         error.response.statusText;
      apiError.code = error.response.data?.error?.code || 
                     error.response.data?.code || 
                     'API_ERROR';
      apiError.retryable = error.response.status >= 500;
    } else if (error.request) {
      // Network error
      apiError.message = 'Network error - please check your connection';
      apiError.code = 'NETWORK_ERROR';
      apiError.retryable = true;
    } else {
      // Other error
      apiError.message = error.message || 'Unknown error occurred';
      apiError.code = 'CLIENT_ERROR';
    }

    return apiError;
  }
}

// Export singleton instance
export const productApiService = new ProductApiService();
export default productApiService;
