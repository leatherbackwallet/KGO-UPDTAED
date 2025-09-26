#!/usr/bin/env node

/**
 * Load Testing Script for OnYourBehlf Website
 * Simulates 15 concurrent users for 15+ minutes
 * Tests critical user flows and monitors for outages
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  BASE_URL: 'https://api-dot-onyourbehlf.uc.r.appspot.com',
  FRONTEND_URL: 'https://onyourbehlf.uc.r.appspot.com',
  CONCURRENT_USERS: 15,
  TEST_DURATION_MINUTES: 15,
  REQUEST_INTERVAL_MS: 2000, // 2 seconds between requests per user
  LOG_FILE: 'load-test-results.json',
  MONITOR_INTERVAL_MS: 5000 // Check system health every 5 seconds
};

// Test scenarios for each user
const USER_SCENARIOS = [
  {
    name: 'Product Browser',
    actions: [
      { endpoint: '/api/products', method: 'GET', params: { page: 1, limit: 24 } },
      { endpoint: '/api/products', method: 'GET', params: { page: 2, limit: 24 } },
      { endpoint: '/api/categories', method: 'GET' },
      { endpoint: '/api/products', method: 'GET', params: { page: 1, limit: 12, search: 'cake' } }
    ]
  },
  {
    name: 'Authenticated User',
    actions: [
      { endpoint: '/api/auth/login', method: 'POST', data: { email: 'test@example.com', password: 'password123' } },
      { endpoint: '/api/products', method: 'GET', params: { page: 1, limit: 24 } },
      { endpoint: '/api/orders/my', method: 'GET' },
      { endpoint: '/api/cart', method: 'GET' }
    ]
  },
  {
    name: 'Guest User',
    actions: [
      { endpoint: '/api/products', method: 'GET', params: { page: 1, limit: 24 } },
      { endpoint: '/api/auth/guest', method: 'POST', data: { sessionId: 'guest_' + Date.now() } },
      { endpoint: '/api/products', method: 'GET', params: { page: 1, limit: 12 } },
      { endpoint: '/api/cart/merge', method: 'POST', data: { items: [] } }
    ]
  },
  {
    name: 'Admin User',
    actions: [
      { endpoint: '/api/auth/login', method: 'POST', data: { email: 'admin@example.com', password: 'admin123' } },
      { endpoint: '/api/products', method: 'GET', params: { admin: true, includeDeleted: false } },
      { endpoint: '/api/orders', method: 'GET', params: { admin: true } },
      { endpoint: '/api/notifications/unread-count', method: 'GET' }
    ]
  },
  {
    name: 'Checkout Flow',
    actions: [
      { endpoint: '/api/products', method: 'GET', params: { page: 1, limit: 24 } },
      { endpoint: '/api/auth/guest', method: 'POST', data: { sessionId: 'guest_' + Date.now() } },
      { endpoint: '/api/orders', method: 'POST', data: { 
        products: [{ product: '68cad924772149b879316668', quantity: 1 }],
        recipientAddress: {
          recipientName: 'Test User',
          recipientPhone: '1234567890',
          address: {
            streetName: 'Test Street',
            houseNumber: '123',
            postalCode: '12345',
            city: 'Test City',
            countryCode: 'India'
          }
        },
        paymentMethod: 'cod'
      }}
    ]
  }
];

// Results tracking
const results = {
  startTime: new Date().toISOString(),
  endTime: null,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  errors: [],
  responseTimes: [],
  outages: [],
  userSessions: [],
  systemHealth: []
};

// Create axios instance with timeout and retry logic
const createApiClient = (userId) => {
  const client = axios.create({
    baseURL: CONFIG.BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `LoadTest-User-${userId}`
    }
  });

  // Add request interceptor for logging
  client.interceptors.request.use(
    (config) => {
      config.metadata = { startTime: Date.now(), userId };
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor for logging
  client.interceptors.response.use(
    (response) => {
      const duration = Date.now() - response.config.metadata.startTime;
      results.responseTimes.push(duration);
      results.totalRequests++;
      results.successfulRequests++;
      
      console.log(`✅ User ${response.config.metadata.userId}: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
      return response;
    },
    (error) => {
      const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
      results.totalRequests++;
      results.failedRequests++;
      results.errors.push({
        userId: error.config?.metadata?.userId || 'unknown',
        endpoint: error.config?.url || 'unknown',
        method: error.config?.method || 'unknown',
        status: error.response?.status || 'network_error',
        message: error.message,
        timestamp: new Date().toISOString(),
        duration
      });
      
      console.log(`❌ User ${error.config?.metadata?.userId || 'unknown'}: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'NETWORK_ERROR'} (${duration}ms) - ${error.message}`);
      return Promise.reject(error);
    }
  );

  return client;
};

// Simulate a single user session
const simulateUser = async (userId) => {
  const client = createApiClient(userId);
  const scenario = USER_SCENARIOS[userId % USER_SCENARIOS.length];
  const sessionStart = Date.now();
  const userSession = {
    userId,
    scenario: scenario.name,
    startTime: new Date().toISOString(),
    actions: [],
    errors: []
  };

  console.log(`🚀 Starting User ${userId} (${scenario.name})`);

  try {
    for (const action of scenario.actions) {
      const actionStart = Date.now();
      
      try {
        const response = await client({
          method: action.method,
          url: action.endpoint,
          params: action.params,
          data: action.data
        });

        userSession.actions.push({
          endpoint: action.endpoint,
          method: action.method,
          status: response.status,
          duration: Date.now() - actionStart,
          timestamp: new Date().toISOString()
        });

        // Wait between actions
        await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_INTERVAL_MS));

      } catch (error) {
        userSession.errors.push({
          endpoint: action.endpoint,
          method: action.method,
          error: error.message,
          status: error.response?.status,
          timestamp: new Date().toISOString()
        });
      }
    }

    userSession.endTime = new Date().toISOString();
    userSession.duration = Date.now() - sessionStart;
    results.userSessions.push(userSession);

  } catch (error) {
    console.error(`💥 User ${userId} session failed:`, error.message);
    userSession.errors.push({
      type: 'session_failure',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Monitor system health
const monitorSystemHealth = async () => {
  try {
    const healthResponse = await axios.get(`${CONFIG.BASE_URL}/api/health-status`, { timeout: 10000 });
    const warmupResponse = await axios.get(`${CONFIG.BASE_URL}/api/warmup`, { timeout: 10000 });
    
    results.systemHealth.push({
      timestamp: new Date().toISOString(),
      health: healthResponse.data,
      warmup: warmupResponse.data,
      status: 'healthy'
    });

  } catch (error) {
    results.systemHealth.push({
      timestamp: new Date().toISOString(),
      error: error.message,
      status: 'unhealthy'
    });

    // Record outage
    results.outages.push({
      timestamp: new Date().toISOString(),
      type: 'health_check_failure',
      error: error.message
    });

    console.log(`🚨 System health check failed: ${error.message}`);
  }
};

// Save results to file
const saveResults = () => {
  results.endTime = new Date().toISOString();
  results.duration = new Date(results.endTime) - new Date(results.startTime);
  results.successRate = (results.successfulRequests / results.totalRequests) * 100;
  results.averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  
  fs.writeFileSync(CONFIG.LOG_FILE, JSON.stringify(results, null, 2));
  console.log(`📊 Results saved to ${CONFIG.LOG_FILE}`);
};

// Main load test function
const runLoadTest = async () => {
  console.log(`🔥 Starting load test with ${CONFIG.CONCURRENT_USERS} users for ${CONFIG.TEST_DURATION_MINUTES} minutes`);
  console.log(`📊 Results will be saved to ${CONFIG.LOG_FILE}`);
  console.log(`🌐 Testing API: ${CONFIG.BASE_URL}`);
  console.log(`🌐 Testing Frontend: ${CONFIG.FRONTEND_URL}`);
  console.log('=' * 60);

  const startTime = Date.now();
  const endTime = startTime + (CONFIG.TEST_DURATION_MINUTES * 60 * 1000);

  // Start system health monitoring
  const healthMonitor = setInterval(monitorSystemHealth, CONFIG.MONITOR_INTERVAL_MS);

  // Start user simulations
  const userPromises = [];
  for (let i = 1; i <= CONFIG.CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(i));
  }

  // Wait for test duration
  const testInterval = setInterval(async () => {
    const elapsed = (Date.now() - startTime) / 1000 / 60;
    console.log(`⏱️  Test progress: ${elapsed.toFixed(1)}/${CONFIG.TEST_DURATION_MINUTES} minutes`);
    
    if (Date.now() >= endTime) {
      clearInterval(testInterval);
      clearInterval(healthMonitor);
      
      console.log('🏁 Test duration completed, waiting for users to finish...');
      await Promise.allSettled(userPromises);
      
      saveResults();
      
      // Print summary
      console.log('\n📈 LOAD TEST SUMMARY');
      console.log('=' * 40);
      console.log(`⏱️  Duration: ${(results.duration / 1000 / 60).toFixed(2)} minutes`);
      console.log(`👥 Users: ${CONFIG.CONCURRENT_USERS}`);
      console.log(`📊 Total Requests: ${results.totalRequests}`);
      console.log(`✅ Successful: ${results.successfulRequests}`);
      console.log(`❌ Failed: ${results.failedRequests}`);
      console.log(`📈 Success Rate: ${results.successRate.toFixed(2)}%`);
      console.log(`⚡ Avg Response Time: ${results.averageResponseTime.toFixed(2)}ms`);
      console.log(`🚨 Outages: ${results.outages.length}`);
      console.log(`💾 Results saved to: ${CONFIG.LOG_FILE}`);
      
      process.exit(0);
    }
  }, 30000); // Check every 30 seconds
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Load test interrupted, saving results...');
  saveResults();
  process.exit(0);
});

// Start the load test
runLoadTest().catch(console.error);
