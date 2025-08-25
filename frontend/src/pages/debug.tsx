import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const DebugPage: React.FC = () => {
  const [apiResult, setApiResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>({});

  const testAPI = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Testing API call...');
      
      // Log configuration
      const apiConfig = {
        baseURL: api.defaults.baseURL,
        timeout: api.defaults.timeout,
        headers: api.defaults.headers,
        env: {
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
          NODE_ENV: process.env.NODE_ENV
        }
      };
      setConfig(apiConfig);
      console.log('API Config:', apiConfig);
      
      const response = await api.get('/products');
      console.log('API Response:', response);
      setApiResult(response.data);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message || 'Unknown error');
      if (err.response) {
        setError(`Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Configuration:</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
      
      <button 
        onClick={testAPI}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? 'Testing...' : 'Test API'}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {apiResult && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <strong>Success!</strong> API call worked.
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(apiResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugPage;
