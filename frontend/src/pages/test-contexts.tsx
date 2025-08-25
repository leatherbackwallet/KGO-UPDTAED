import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../utils/api';

const TestContextsPage: React.FC = () => {
  const { cart, addToCart } = useCart();
  const { user } = useAuth();
  const { wishlist } = useWishlist();
  const [apiResult, setApiResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    console.log('TestContextsPage mounted');
    console.log('Cart:', cart);
    console.log('User:', user);
    console.log('Wishlist:', wishlist);
    
    // Test API call using the same api utility
    const testAPI = async () => {
      try {
        console.log('Testing API with api utility...');
        const response = await api.get('/products');
        console.log('API Response:', response);
        setApiResult(response.data);
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.message);
      }
    };
    
    testAPI();
  }, [cart, user, wishlist]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Contexts Test Page</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Contexts Status:</h2>
        <p>Cart items: {cart.length}</p>
        <p>User: {user ? 'Logged in' : 'Not logged in'}</p>
        <p>Wishlist items: {wishlist.length}</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {apiResult ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong>API Success!</strong> Found {apiResult.data?.length || 0} products
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <strong>Loading API...</strong>
        </div>
      )}
    </div>
  );
};

export default TestContextsPage;
