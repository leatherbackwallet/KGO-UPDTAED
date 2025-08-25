import React, { useState, useEffect } from 'react';

const TestAsyncPage: React.FC = () => {
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testAsync = async () => {
      try {
        setStatus('Starting async test...');
        console.log('Starting async test...');
        
        // Test 1: Basic async
        await new Promise(resolve => setTimeout(resolve, 100));
        setStatus('Basic async works...');
        console.log('Basic async works...');
        
        // Test 2: Fetch API
        setStatus('Testing fetch...');
        console.log('Testing fetch...');
        
        const response = await fetch('http://localhost:5001/api/products');
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetch data:', data);
        
        setStatus(`Success! Found ${data.data?.length || 0} products`);
      } catch (err: any) {
        console.error('Async test error:', err);
        setError(err.message);
        setStatus('Error occurred');
      }
    };
    
    testAsync();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Async Test Page</h1>
      
      <div className="mb-4">
        <p><strong>Status:</strong> {status}</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <p>Check the browser console for detailed logs.</p>
    </div>
  );
};

export default TestAsyncPage;
