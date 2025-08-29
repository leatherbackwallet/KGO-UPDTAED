/**
 * Authentication Test Script
 * Tests the login and registration endpoints to verify MongoDB connection
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5001';

async function testHealthEndpoint() {
  try {
    console.log('🔍 Testing health endpoint...');
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health endpoint response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health endpoint failed:', error.response?.data || error.message);
    return false;
  }
}

async function testRegistration() {
  try {
    console.log('\n🔍 Testing registration endpoint...');
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: `test${Date.now()}@example.com`,
      password: 'TestPass123!',
      phone: '+1234567890'
    };

    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    console.log('✅ Registration successful:', response.data.success);
    return response.data.data?.tokens?.accessToken;
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
    return null;
  }
}

async function testLogin() {
  try {
    console.log('\n🔍 Testing login endpoint...');
    const loginData = {
      email: 'test@example.com',
      password: 'TestPass123!'
    };

    const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log('✅ Login successful:', response.data.success);
    return response.data.data?.tokens?.accessToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting authentication tests...\n');
  
  // Test health endpoint
  const healthOk = await testHealthEndpoint();
  if (!healthOk) {
    console.log('❌ Health check failed, stopping tests');
    return;
  }

  // Test registration
  const registrationToken = await testRegistration();
  
  // Test login
  const loginToken = await testLogin();

  console.log('\n📊 Test Results:');
  console.log(`Health Endpoint: ${healthOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Registration: ${registrationToken ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Login: ${loginToken ? '✅ PASS' : '❌ FAIL'}`);

  if (healthOk && (registrationToken || loginToken)) {
    console.log('\n🎉 MongoDB connection is working! Authentication endpoints are functional.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runTests().catch(console.error);
