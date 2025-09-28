/**
 * Centralized Products Hook
 * Single hook for all product loading logic across the application
 * Eliminates duplicate product loading functions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { productApiService } from '../services/productApiService';
import { Product, ProductFilters, UseProductsReturn, AppliedFilters, PaginationInfo } from '../types/shared';

interface UseProductsOptions {
  autoLoad?: boolean;
  initialFilters?: ProductFilters;
  onError?: (error: string) => void;
  onSuccess?: (products: Product[]) => void;
}

/**
 * Centralized hook for product loading
 * Replaces all individual product loading functions
 */
export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const {
    autoLoad = true,
    initialFilters = {},
    onError,
    onSuccess
  } = options;

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);

  // Computed values
  const pagination: PaginationInfo | null = useMemo(() => {
    if (!products.length) return null;
    
    return {
      page: filters.page || 1,
      limit: filters.limit || 24,
      total: products.length,
      pages: Math.ceil(products.length / (filters.limit || 24)),
      hasNext: (filters.page || 1) < Math.ceil(products.length / (filters.limit || 24)),
      hasPrev: (filters.page || 1) > 1
    };
  }, [products, filters]);

  const appliedFilters: AppliedFilters = useMemo(() => ({
    category: filters.category,
    occasions: filters.occasions ? [filters.occasions] : undefined,
    search: filters.search,
    featured: filters.featured,
    priceRange: filters.min || filters.max ? {
      min: filters.min || 0,
      max: filters.max || Infinity
    } : undefined,
    sort: filters.sort
  }), [filters]);

  // Load products function
  const loadProducts = useCallback(async (customFilters?: Partial<ProductFilters>) => {
    try {
      console.log('🔄 Loading products with filters:', { ...filters, ...customFilters });
      setLoading(true);
      setError(null);

      const finalFilters = { ...filters, ...customFilters };
      const response = await productApiService.getProducts(finalFilters);
      
      console.log('📦 Products API response:', response);
      
      if (response.success) {
        setProducts(response.data || []);
        onSuccess?.(response.data || []);
        console.log('✅ Products loaded successfully:', response.data?.length || 0);
      } else {
        throw new Error(response.error?.message || 'Failed to load products');
      }
    } catch (err: any) {
      console.error('❌ Products loading error:', err);
      const errorMessage = err.message || 'Failed to load products';
      setError(errorMessage);
      onError?.(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, onError, onSuccess]);

  // Update filters function
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Refetch function
  const refetch = useCallback(async () => {
    await loadProducts();
  }, [loadProducts]);

  // Auto-load on mount and filter changes
  useEffect(() => {
    if (autoLoad) {
      loadProducts();
    }
  }, [autoLoad, loadProducts]);

  return {
    products,
    loading,
    error,
    refetch,
    filters,
    setFilters: updateFilters,
    pagination,
    appliedFilters
  };
}

/**
 * Hook for admin products (with all data)
 */
export function useAdminProducts(options: UseProductsOptions = {}) {
  return useProducts({
    ...options,
    initialFilters: { ...options.initialFilters, admin: true, includeDeleted: false }
  });
}

/**
 * Hook for featured products
 */
export function useFeaturedProducts(limit: number = 12) {
  return useProducts({
    initialFilters: { featured: true, limit },
    autoLoad: true
  });
}

/**
 * Hook for products by category
 */
export function useProductsByCategory(categorySlug: string, limit: number = 50) {
  return useProducts({
    initialFilters: { category: categorySlug, limit },
    autoLoad: true
  });
}

/**
 * Hook for products by occasion
 */
export function useProductsByOccasion(occasionSlug: string, limit: number = 50) {
  return useProducts({
    initialFilters: { occasions: occasionSlug, limit },
    autoLoad: true
  });
}

/**
 * Hook for product search
 */
export function useProductSearch(query: string, filters: Omit<ProductFilters, 'search'> = {}) {
  return useProducts({
    initialFilters: { ...filters, search: query },
    autoLoad: !!query
  });
}

/**
 * Hook for single product
 */
export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const productData = await productApiService.getProductById(id);
      setProduct(productData);
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct
  };
}
