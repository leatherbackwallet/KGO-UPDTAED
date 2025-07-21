import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../utils/api';

export default function DebugWishlist() {
  const { user, token } = useAuth();
  const { wishlist } = useWishlist();
  const [serverWishlist, setServerWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServerWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/wishlist');
      setServerWishlist(response.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching wishlist');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Wishlist Debug</h1>
      
      <div className="space-y-6">
        {/* Authentication Status */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
          <p><strong>User:</strong> {user ? `${user.firstName} ${user.lastName}` : 'Not logged in'}</p>
          <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
          <p><strong>Token:</strong> {token ? 'Present' : 'Not present'}</p>
          <p><strong>Local Storage Token:</strong> {typeof window !== 'undefined' ? (localStorage.getItem('token') ? 'Present' : 'Not present') : 'N/A'}</p>
        </div>

        {/* Local Wishlist */}
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Local Wishlist</h2>
          <p><strong>Items:</strong> {wishlist.length}</p>
          <pre className="text-sm bg-white p-2 rounded mt-2 overflow-auto">
            {JSON.stringify(wishlist, null, 2)}
          </pre>
        </div>

        {/* Server Wishlist */}
        <div className="bg-green-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Server Wishlist</h2>
          <button 
            onClick={fetchServerWishlist}
            disabled={loading}
            className="btn-primary mb-2"
          >
            {loading ? 'Loading...' : 'Fetch Server Wishlist'}
          </button>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-2">
              Error: {error}
            </div>
          )}
          
          {serverWishlist && (
            <div>
              <p><strong>Success:</strong> {serverWishlist.success ? 'Yes' : 'No'}</p>
              <p><strong>Product Count:</strong> {serverWishlist.data?.productCount || 0}</p>
              <pre className="text-sm bg-white p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(serverWishlist, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* API Test */}
        <div className="bg-yellow-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">API Test</h2>
          <p>Test adding a product to wishlist:</p>
          <button 
            onClick={async () => {
              try {
                const response = await api.post('/wishlist/add/687e222a4f5f12b5c68367ff');
                alert('Product added successfully!');
                fetchServerWishlist();
              } catch (err: any) {
                alert(`Error: ${err.message}`);
              }
            }}
            className="btn-secondary"
          >
            Add Test Product
          </button>
        </div>
      </div>
    </div>
  );
} 