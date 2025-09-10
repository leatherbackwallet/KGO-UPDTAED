/**
 * Test script for request batching and deduplication functionality
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5001';

// Test deduplication by making multiple identical requests
async function testDeduplication() {
  console.log('Testing request deduplication...');
  
  const startTime = Date.now();
  
  // Make 5 identical requests simultaneously
  const promises = Array(5).fill().map(() => 
    axios.get(`${BASE_URL}/api/products?featured=true`)
  );
  
  try {
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    
    console.log(`✅ Deduplication test completed in ${endTime - startTime}ms`);
    console.log(`All responses identical: ${responses.every(r => 
      JSON.stringify(r.data) === JSON.stringify(responses[0].data)
    )}`);
    
    // Check cache headers
    const headers = responses[0].headers;
    console.log('Cache headers:', {
      'cache-control': headers['cache-control'],
      'etag': headers['etag'],
      'last-modified': headers['last-modified']
    });
    
  } catch (error) {
    console.error('❌ Deduplication test failed:', error.message);
  }
}

// Test batch API endpoint
async function testBatchAPI() {
  console.log('\nTesting batch API...');
  
  const batchRequest = {
    requests: [
      { type: 'products', params: { featured: true, limit: 5 } },
      { type: 'categories' },
      { type: 'featured-products', params: { limit: 3 } }
    ]
  };
  
  try {
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/api/products/batch`, batchRequest);
    const endTime = Date.now();
    
    console.log(`✅ Batch API test completed in ${endTime - startTime}ms`);
    console.log('Batch results:', response.data.results.map(r => ({
      type: r.type,
      success: r.success,
      count: r.count
    })));
    
  } catch (error) {
    console.error('❌ Batch API test failed:', error.response?.data || error.message);
  }
}

// Test ETag conditional requests
async function testETagConditionalRequests() {
  console.log('\nTesting ETag conditional requests...');
  
  try {
    // First request to get ETag
    const firstResponse = await axios.get(`${BASE_URL}/api/products?featured=true`);
    const etag = firstResponse.headers['etag'];
    
    if (!etag) {
      console.log('❌ No ETag header found');
      return;
    }
    
    console.log('Received ETag:', etag);
    
    // Second request with If-None-Match header
    try {
      const secondResponse = await axios.get(`${BASE_URL}/api/products?featured=true`, {
        headers: { 'If-None-Match': etag }
      });
      
      console.log('❌ Expected 304 Not Modified, got:', secondResponse.status);
    } catch (error) {
      if (error.response?.status === 304) {
        console.log('✅ ETag conditional request working - received 304 Not Modified');
      } else {
        console.log('❌ Unexpected error:', error.response?.status || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ ETag test failed:', error.message);
  }
}

// Test queue statistics (requires admin auth)
async function testQueueStats() {
  console.log('\nTesting queue statistics...');
  
  try {
    // This would require admin authentication in a real scenario
    const response = await axios.get(`${BASE_URL}/api/products/queue-stats`);
    console.log('✅ Queue stats:', response.data.data);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('⚠️ Queue stats requires authentication (expected)');
    } else {
      console.error('❌ Queue stats test failed:', error.response?.data || error.message);
    }
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting request batching and deduplication tests...\n');
  
  await testDeduplication();
  await testBatchAPI();
  await testETagConditionalRequests();
  await testQueueStats();
  
  console.log('\n✨ All tests completed!');
}

// Handle command line execution
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testDeduplication,
  testBatchAPI,
  testETagConditionalRequests,
  testQueueStats,
  runTests
};