#!/usr/bin/env node

/**
 * FREE Keep-Alive Service for OnYourBehlf
 * Prevents cold starts by pinging API every 4-5 minutes
 * Run this on any free service like Railway, Render, or even GitHub Actions
 */

const https = require('https');

const CONFIG = {
  API_URL: 'https://api-dot-onyourbehlf.uc.r.appspot.com',
  PING_INTERVAL: 4 * 60 * 1000, // 4 minutes (before 5min App Engine timeout)
  ENDPOINTS_TO_PING: [
    '/api/health-status',
    '/api/warmup',
    '/api/products?limit=1' // Light products call
  ],
  TIMEOUT: 30000 // 30 seconds
};

class KeepAliveService {
  constructor() {
    this.stats = {
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      lastPing: null,
      lastError: null
    };
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp}: ${message}`);
  }

  async pingEndpoint(endpoint) {
    return new Promise((resolve) => {
      const url = `${CONFIG.API_URL}${endpoint}`;
      const startTime = Date.now();
      
      const req = https.get(url, {
        timeout: CONFIG.TIMEOUT,
        headers: {
          'User-Agent': 'KeepAlive-Service/1.0',
          'Accept': 'application/json'
        }
      }, (res) => {
        const responseTime = Date.now() - startTime;
        
        // Read response body to ensure full request processing
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            responseTime,
            endpoint
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime,
          endpoint
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Timeout',
          responseTime: Date.now() - startTime,
          endpoint
        });
      });
    });
  }

  async performKeepAlive() {
    this.stats.totalPings++;
    this.stats.lastPing = new Date();
    
    this.log('🏓 Performing keep-alive ping...');
    
    // Ping all endpoints in sequence (not parallel to avoid overwhelming)
    let allSuccessful = true;
    
    for (const endpoint of CONFIG.ENDPOINTS_TO_PING) {
      const result = await this.pingEndpoint(endpoint);
      
      if (result.success) {
        this.log(`✅ ${endpoint}: ${result.statusCode} (${result.responseTime}ms)`);
      } else {
        this.log(`❌ ${endpoint}: ${result.error} (${result.responseTime}ms)`);
        allSuccessful = false;
        this.stats.lastError = result.error;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (allSuccessful) {
      this.stats.successfulPings++;
      this.log('💚 Keep-alive successful - API instance is warm');
    } else {
      this.stats.failedPings++;
      this.log('💔 Keep-alive had failures - instance may be cold starting');
    }
    
    // Log stats every 10 pings
    if (this.stats.totalPings % 10 === 0) {
      this.logStats();
    }
  }

  logStats() {
    const successRate = this.stats.totalPings > 0 
      ? ((this.stats.successfulPings / this.stats.totalPings) * 100).toFixed(1)
      : 0;
    
    this.log(`📊 Stats: ${this.stats.totalPings} pings, ${successRate}% success rate, Last: ${this.stats.lastPing?.toLocaleTimeString()}`);
  }

  start() {
    this.log('🚀 Starting FREE Keep-Alive Service');
    this.log(`📡 Target: ${CONFIG.API_URL}`);
    this.log(`⏱️  Interval: ${CONFIG.PING_INTERVAL / 60000} minutes`);
    this.log(`🎯 Endpoints: ${CONFIG.ENDPOINTS_TO_PING.join(', ')}`);
    
    // Initial ping
    this.performKeepAlive();
    
    // Schedule regular pings
    setInterval(() => {
      this.performKeepAlive();
    }, CONFIG.PING_INTERVAL);
    
    // Also ping every hour during business hours (extra insurance)
    setInterval(() => {
      const hour = new Date().getHours();
      // Ping extra during business hours (6 AM - 11 PM IST)
      if (hour >= 6 && hour <= 23) {
        this.log('🕐 Business hours extra ping');
        this.performKeepAlive();
      }
    }, 60 * 60 * 1000); // Every hour
  }
}

// Health check endpoint for the keep-alive service itself
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'alive',
      service: 'OnYourBehlf Keep-Alive',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Start the service
if (require.main === module) {
  const keepAlive = new KeepAliveService();
  keepAlive.start();
  
  // Start health check server on port from environment or 3000
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Keep-Alive health check server running on port ${port}`);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    keepAlive.log('🛑 Keep-Alive service stopping...');
    keepAlive.logStats();
    server.close();
    process.exit(0);
  });
}

module.exports = KeepAliveService;
