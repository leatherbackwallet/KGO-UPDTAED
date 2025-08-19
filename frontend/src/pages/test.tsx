import { useState, useEffect } from 'react';

export default function TestPage() {
  const [message, setMessage] = useState<string>('Initial state');

  useEffect(() => {
    console.log('Test page loaded');
    setMessage('Component mounted successfully');
    
    // Test if we can make a simple fetch
    fetch('http://localhost:5001/api/products')
      .then(response => {
        console.log('Fetch response status:', response.status);
        if (response.ok) {
          return response.json();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      })
      .then(data => {
        console.log('Fetch success:', data);
        setMessage(`API call successful! Found ${data.data?.length || 0} products`);
      })
      .catch(error => {
        console.error('Fetch error:', error);
        setMessage(`API call failed: ${error.message}`);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Frontend Test Page</h1>
      
      <div className="mb-4">
        <p><strong>Current State:</strong> {message}</p>
        <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}</p>
        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
      </div>
      
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <strong>Debug Info:</strong>
        <ul className="mt-2">
          <li>• Frontend is running on localhost:3000</li>
          <li>• Backend should be on localhost:5001</li>
          <li>• Check browser console for detailed logs</li>
        </ul>
      </div>
    </div>
  );
}
