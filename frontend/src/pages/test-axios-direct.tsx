import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TestAxiosDirectPage: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Testing axios directly...');
      
      // Use axios directly without custom interceptors
      const response = await axios.get('http://localhost:5001/api/products', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000,
      });
      
      console.log('Axios Response:', response);
      setResult(response.data);
    } catch (err: any) {
      console.error('Axios Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Axios Direct Test</h1>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <strong>Success!</strong> Found {result.data?.length || 0} products
        </div>
      )}
      
      <button 
        onClick={testAPI}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Again
      </button>
      
      {result && (
        <pre className="mt-4 bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default TestAxiosDirectPage;
