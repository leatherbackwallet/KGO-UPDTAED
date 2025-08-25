import React, { useState, useEffect } from 'react';

const TestMinimalPage: React.FC = () => {
  const [count, setCount] = useState(0);
  const [apiResult, setApiResult] = useState<any>(null);

  useEffect(() => {
    console.log('TestMinimalPage mounted');
    
    // Test basic fetch
    fetch('http://localhost:5001/api/products')
      .then(response => response.json())
      .then(data => {
        console.log('API call successful:', data);
        setApiResult(data);
      })
      .catch(error => {
        console.error('API call failed:', error);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Minimal Test Page</h1>
      
      <div className="mb-4">
        <p>Count: {count}</p>
        <button 
          onClick={() => setCount(count + 1)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Increment
        </button>
      </div>
      
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

export default TestMinimalPage;
