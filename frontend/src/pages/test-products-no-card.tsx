import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Product } from '../types/product';

const TestProductsNoCardPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('TestProductsNoCardPage mounted');
    
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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Products Test (No ProductCard)</h1>
      
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
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product._id} className="border p-4 rounded">
                <h3 className="font-bold">{product.name}</h3>
                <p>Price: ${product.price}</p>
                <p>Stock: {product.stock}</p>
                <p>Images: {product.images?.length || 0}</p>
                <p>Default Image: {product.defaultImage || 'None'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestProductsNoCardPage;
