import { useState, useEffect, useCallback } from 'react';
import { productsApi, type Product } from '@/api/routers/products';

// Custom hook for product operations with optimized caching
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all products
  const loadProducts = useCallback(async (useCache: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getAllProducts(useCache);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search products
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      await loadProducts();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.searchProducts(query);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  // Filter by category
  const filterByCategory = useCallback(async (category: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getProductsByCategory(category);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Category filter failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter by brand
  const filterByBrand = useCallback(async (brand: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getProductsByBrand(brand);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Brand filter failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter by price range
  const filterByPriceRange = useCallback(async (minPrice: number, maxPrice: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getProductsByPriceRange(minPrice, maxPrice);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Price filter failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get trending products
  const loadTrendingProducts = useCallback(async (limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getTrendingProducts(limit);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending products');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get discounted products
  const loadDiscountedProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getDiscountedProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load discounted products');
    } finally {
      setLoading(false);
    }
  }, []);

  // Multi-criteria filtering
  const applyFilters = useCallback(async (filters: {
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    availability?: string;
    specifications?: string[];
  }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getFilteredProducts(filters);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Filtering failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear cache and reload
  const refresh = useCallback(async () => {
    productsApi.clearCache();
    await loadProducts(false);
  }, [loadProducts]);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    return productsApi.getCacheStats();
  }, []);

  return {
    products,
    loading,
    error,
    loadProducts,
    searchProducts,
    filterByCategory,
    filterByBrand,
    filterByPriceRange,
    loadTrendingProducts,
    loadDiscountedProducts,
    applyFilters,
    refresh,
    getCacheStats,
  };
};

// Hook for single product operations
export const useProduct = (id?: number) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async (productId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getProductById(productId);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id, loadProduct]);

  return {
    product,
    loading,
    error,
    loadProduct,
    refetch: () => id && loadProduct(id),
  };
};

// Hook for product statistics
export const useProductStats = () => {
  const [stats, setStats] = useState<{
    total: number;
    byCategory: Record<string, number>;
    byAvailability: Record<string, number>;
    avgRating: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getProductStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refetch: loadStats,
  };
};