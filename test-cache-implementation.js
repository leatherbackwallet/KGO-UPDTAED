/**
 * Simple test to verify the cache implementation
 */

// Test backend image routes
async function testBackendRoutes() {
  console.log('Testing backend image routes...');
  
  try {
    // Test critical images endpoint
    const response = await fetch('http://localhost:5000/api/images/critical');
    if (response.ok) {
      const data = await response.json();
      console.log('✓ Critical images endpoint working:', data.data?.images?.length || 0, 'images');
    } else {
      console.log('✗ Critical images endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('✗ Backend not running or error:', error.message);
  }
  
  try {
    // Test cache warming endpoint
    const response = await fetch('http://localhost:5000/api/images/warm-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicIds: ['test-image-1', 'test-image-2'],
        priority: 'high',
        sizes: ['thumb', 'small']
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✓ Cache warming endpoint working:', data.data?.urls?.length || 0, 'URLs generated');
    } else {
      console.log('✗ Cache warming endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('✗ Cache warming test failed:', error.message);
  }
}

// Test Service Worker functionality
function testServiceWorker() {
  console.log('Testing Service Worker functionality...');
  
  if ('serviceWorker' in navigator) {
    console.log('✓ Service Worker supported');
    
    // Test Service Worker registration
    navigator.serviceWorker.register('/sw-image-cache.js', { scope: '/' })
      .then(registration => {
        console.log('✓ Image cache Service Worker registered:', registration.scope);
        
        // Test cache warming message
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'WARM_CACHE',
            data: {
              urls: ['https://example.com/test-image.jpg'],
              priority: 'high'
            }
          });
          console.log('✓ Cache warming message sent');
        }
      })
      .catch(error => {
        console.log('✗ Service Worker registration failed:', error);
      });
  } else {
    console.log('✗ Service Worker not supported');
  }
}

// Run tests
if (typeof window !== 'undefined') {
  // Browser environment
  testServiceWorker();
  testBackendRoutes();
} else {
  // Node environment
  const fetch = require('node-fetch');
  testBackendRoutes();
}

console.log('Cache implementation test completed');