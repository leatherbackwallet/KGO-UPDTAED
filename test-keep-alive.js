/**
 * Test Keep-Alive Script
 * Run this to test if your services are staying alive
 */

const https = require('https');
const http = require('http');

const API_URL = 'https://api-dot-onyourbehlf.uc.r.appspot.com';
const FRONTEND_URL = 'https://onyourbehlf.uc.r.appspot.com';

// Test endpoints
const endpoints = [
  { name: 'Backend Health', url: `${API_URL}/api/health` },
  { name: 'Backend Keep-Alive', url: `${API_URL}/api/keep-alive` },
  { name: 'Backend Health Status', url: `${API_URL}/api/health-status` },
  { name: 'Frontend Health', url: `${FRONTEND_URL}/health` }
];

async function testEndpoint(name, url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            name,
            status: res.statusCode,
            responseTime: `${responseTime}ms`,
            data: jsonData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          resolve({
            name,
            status: res.statusCode,
            responseTime: `${responseTime}ms`,
            data: data,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name,
        status: 'ERROR',
        responseTime: 'N/A',
        error: error.message,
        success: false
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        name,
        status: 'TIMEOUT',
        responseTime: '>10s',
        error: 'Request timeout',
        success: false
      });
    });
  });
}

async function runTests() {
  console.log('🧪 Testing Keep-Alive Endpoints...\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint.name}...`);
    const result = await testEndpoint(endpoint.name, endpoint.url);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.name}: ${result.status} (${result.responseTime})`);
    } else {
      console.log(`❌ ${result.name}: ${result.status} (${result.responseTime})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    console.log('');
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log('📊 Summary:');
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);
  
  if (successful === total) {
    console.log('\n🎉 All endpoints are healthy!');
  } else {
    console.log('\n⚠️ Some endpoints are having issues.');
  }
  
  // Show detailed results
  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Response Time: ${result.responseTime}`);
    if (result.data) {
      console.log(`  Data: ${JSON.stringify(result.data, null, 2)}`);
    }
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
}

// Run tests
runTests().catch(console.error);
