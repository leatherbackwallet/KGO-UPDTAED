/**
 * Unit tests for request batching and deduplication middleware
 */

const { 
  generateRequestSignature,
  deduplicateRequests,
  globalRequestQueue 
} = require('./middleware/requestBatching');

// Mock request object
function createMockRequest(method = 'GET', url = '/api/products', query = {}, body = {}) {
  return {
    method,
    originalUrl: url,
    query,
    body
  };
}

// Mock response object
function createMockResponse() {
  const headers = {};
  const response = {
    headers,
    statusCode: 200,
    json: function(data) {
      this._jsonData = data;
      return this;
    },
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    setHeader: function(name, value) {
      headers[name] = value;
    },
    getHeader: function(name) {
      return headers[name];
    },
    getHeaders: function() {
      return headers;
    },
    end: function(data) {
      this._endData = data;
    }
  };
  return response;
}

// Test request signature generation
function testRequestSignature() {
  console.log('Testing request signature generation...');
  
  const req1 = createMockRequest('GET', '/api/products', { featured: 'true' });
  const req2 = createMockRequest('GET', '/api/products', { featured: 'true' });
  const req3 = createMockRequest('GET', '/api/products', { featured: 'false' });
  
  const sig1 = generateRequestSignature(req1);
  const sig2 = generateRequestSignature(req2);
  const sig3 = generateRequestSignature(req3);
  
  console.log('Signature 1:', sig1);
  console.log('Signature 2:', sig2);
  console.log('Signature 3:', sig3);
  
  if (sig1 === sig2) {
    console.log('✅ Identical requests generate same signature');
  } else {
    console.log('❌ Identical requests should generate same signature');
  }
  
  if (sig1 !== sig3) {
    console.log('✅ Different requests generate different signatures');
  } else {
    console.log('❌ Different requests should generate different signatures');
  }
}

// Test deduplication middleware
function testDeduplicationMiddleware() {
  console.log('\nTesting deduplication middleware...');
  
  const middleware = deduplicateRequests();
  const req = createMockRequest('GET', '/api/products', { featured: 'true' });
  const res1 = createMockResponse();
  const res2 = createMockResponse();
  
  let nextCalled = 0;
  const next = () => { nextCalled++; };
  
  // First request should call next
  middleware(req, res1, next);
  
  if (nextCalled === 1) {
    console.log('✅ First request calls next()');
  } else {
    console.log('❌ First request should call next()');
  }
  
  // Second identical request should not call next
  middleware(req, res2, next);
  
  if (nextCalled === 1) {
    console.log('✅ Duplicate request does not call next()');
  } else {
    console.log('❌ Duplicate request should not call next()');
  }
  
  // Simulate response from first request
  res1.json({ success: true, data: [] });
  
  // Check if second response received the data
  if (res2._jsonData && res2._jsonData.success) {
    console.log('✅ Duplicate request receives response data');
  } else {
    console.log('❌ Duplicate request should receive response data');
  }
}

// Test request queue
function testRequestQueue() {
  console.log('\nTesting request queue...');
  
  const queue = globalRequestQueue;
  const initialStats = queue.getStats();
  
  console.log('Initial queue stats:', initialStats);
  
  // Add a test request
  const testRequest = () => Promise.resolve({ test: 'data' });
  
  queue.add(testRequest, 'high').then(result => {
    console.log('✅ Queue processed request:', result);
    
    const finalStats = queue.getStats();
    console.log('Final queue stats:', finalStats);
    
    if (finalStats.processed > initialStats.processed) {
      console.log('✅ Queue processed counter incremented');
    } else {
      console.log('❌ Queue processed counter should increment');
    }
  }).catch(error => {
    console.log('❌ Queue request failed:', error);
  });
}

// Test non-GET request handling
function testNonGetRequests() {
  console.log('\nTesting non-GET request handling...');
  
  const middleware = deduplicateRequests();
  const req = createMockRequest('POST', '/api/products');
  const res = createMockResponse();
  
  let nextCalled = false;
  const next = () => { nextCalled = true; };
  
  middleware(req, res, next);
  
  if (nextCalled) {
    console.log('✅ Non-GET requests bypass deduplication');
  } else {
    console.log('❌ Non-GET requests should bypass deduplication');
  }
}

// Run all tests
function runUnitTests() {
  console.log('🧪 Running request batching unit tests...\n');
  
  testRequestSignature();
  testDeduplicationMiddleware();
  testRequestQueue();
  testNonGetRequests();
  
  console.log('\n✨ Unit tests completed!');
}

// Handle command line execution
if (require.main === module) {
  runUnitTests();
}

module.exports = {
  testRequestSignature,
  testDeduplicationMiddleware,
  testRequestQueue,
  testNonGetRequests,
  runUnitTests
};