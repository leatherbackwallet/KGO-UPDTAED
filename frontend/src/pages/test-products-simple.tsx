import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import api from '../utils/api';
import { Product } from '../types/product';

const TestProductsSimplePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('TestProductsSimplePage mounted');
    
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching products...');
        
        const response = await api.get('/products');
        console.log('✅ API Response:', response);
        
        const productsData = response.data?.data || response.data || [];
        console.log('📦 Products data length:', productsData.length);
        
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err: any) {
        console.error('❌ Error fetching products:', err);
        setError(err.message);
        setProducts([]);
      } finally {
        console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  const handleQuickView = (product: Product) => {
    console.log('Quick view for:', product.name);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Products Test</h1>
      
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full border-2 border-gray-300 border-t-current w-6 h-6 text-blue-600 mx-auto"></div>
          <p className="mt-2">Loading products...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <p>No products found</p>
        </div>
      )}
      
      {!loading && !error && products.length > 0 && (
        <div>
          <p className="mb-4">Found {products.length} products</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onQuickView={handleQuickView}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestProductsSimplePage;
