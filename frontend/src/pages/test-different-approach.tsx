import React, { useState, useEffect } from 'react';

const TestDifferentApproachPage: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testWithXMLHttpRequest = () => {
    setLoading(true);
    setError('');
    
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://localhost:5001/api/products', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          console.log('XMLHttpRequest success:', data);
          setResult(data);
        } catch (e) {
          console.error('XMLHttpRequest parse error:', e);
          setError('Failed to parse response');
        }
      } else {
        console.error('XMLHttpRequest error:', xhr.status, xhr.statusText);
        setError(`HTTP ${xhr.status}: ${xhr.statusText}`);
      }
      setLoading(false);
    };
    
    xhr.onerror = function() {
      console.error('XMLHttpRequest network error');
      setError('Network error');
      setLoading(false);
    };
    
    xhr.ontimeout = function() {
      console.error('XMLHttpRequest timeout');
      setError('Request timeout');
      setLoading(false);
    };
    
    xhr.timeout = 10000;
    xhr.send();
  };

  const testWithFetchAndAbort = () => {
    setLoading(true);
    setError('');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    fetch('http://localhost:5001/api/products', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
    .then(response => {
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Fetch with abort success:', data);
      setResult(data);
    })
    .catch(err => {
      clearTimeout(timeoutId);
      console.error('Fetch with abort error:', err);
      setError(err.message);
    })
    .finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    console.log('TestDifferentApproachPage mounted');
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Different Approach Test</h1>
      
      <div className="space-y-4 mb-4">
        <button 
          onClick={testWithXMLHttpRequest}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Test XMLHttpRequest
        </button>
        
        <button 
          onClick={testWithFetchAndAbort}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Fetch with Abort
        </button>
      </div>
      
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
      
      {result && (
        <pre className="mt-4 bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default TestDifferentApproachPage;
