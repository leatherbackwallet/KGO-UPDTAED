#!/usr/bin/env node

/**
 * Internet Access Verification Script
 * Tests critical endpoints to ensure they work for internet users
 */

const https = require('https');
const http = require('http');

// Test URLs
const TEST_URLS = {
  frontend: 'https://onyourbehlf.uc.r.appspot.com',
  api: 'https://api-dot-onyourbehlf.uc.r.appspot.com/api/health',
  products: 'https://api-dot-onyourbehlf.uc.r.appspot.com/api/products',
  cloudinary: 'https://res.cloudinary.com/deojqbepy/image/upload/w_400,h_auto,q_auto,f_auto/keralagiftsonline/products/sample.jpg'
};

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function testUrl(url, description) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        log(colors.green, `✅ ${description}: ${res.statusCode} - OK`);
        resolve(true);
      } else {
        log(colors.red, `❌ ${description}: ${res.statusCode} - FAILED`);
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      log(colors.red, `❌ ${description}: ERROR - ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(30000, () => {
      log(colors.red, `❌ ${description}: TIMEOUT`);
      req.destroy();
      resolve(false);
    });
  });
}

async function testCors(apiUrl, frontendOrigin) {
  return new Promise((resolve) => {
    const url = new URL(apiUrl);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': frontendOrigin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };
    
    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      const corsHeader = res.headers['access-control-allow-origin'];
      if (corsHeader === frontendOrigin || corsHeader === '*') {
        log(colors.green, `✅ CORS: ${frontendOrigin} allowed`);
        resolve(true);
      } else {
        log(colors.red, `❌ CORS: ${frontendOrigin} not allowed (got: ${corsHeader})`);
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      log(colors.red, `❌ CORS Test: ERROR - ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      log(colors.red, `❌ CORS Test: TIMEOUT`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

async function main() {
  log(colors.blue, '🚀 Testing Internet Access for OnYourBehlf');
  log(colors.blue, '================================================');
  
  const results = [];
  
  // Test basic connectivity
  log(colors.yellow, '\n📡 Testing Basic Connectivity:');
  results.push(await testUrl(TEST_URLS.frontend, 'Frontend'));
  results.push(await testUrl(TEST_URLS.api, 'API Health'));
  results.push(await testUrl(TEST_URLS.products, 'Products API'));
  results.push(await testUrl(TEST_URLS.cloudinary, 'Cloudinary CDN'));
  
  // Test CORS configuration
  log(colors.yellow, '\n🌐 Testing CORS Configuration:');
  results.push(await testCors(TEST_URLS.api, 'https://onyourbehlf.uc.r.appspot.com'));
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log(colors.blue, '\n📊 Test Summary:');
  log(colors.blue, '=================');
  
  if (passed === total) {
    log(colors.green, `✅ All tests passed! (${passed}/${total})`);
    log(colors.green, '🎉 Website should work perfectly for internet users');
    process.exit(0);
  } else {
    log(colors.red, `❌ ${total - passed} tests failed (${passed}/${total} passed)`);
    log(colors.red, '🚨 Website may have issues for internet users');
    process.exit(1);
  }
}

main().catch(console.error);
