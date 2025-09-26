#!/usr/bin/env node

/**
 * Uptime Monitoring Script for OnYourBehlf
 * Monitors API health and sends alerts for cold start issues
 */

const https = require('https');
const fs = require('fs');

const CONFIG = {
  API_URL: 'https://api-dot-onyourbehlf.uc.r.appspot.com',
  FRONTEND_URL: 'https://keralagiftsonline.in',
  CHECK_INTERVAL: 60000, // 1 minute
  TIMEOUT: 30000, // 30 seconds
  LOG_FILE: './uptime-monitor.log'
};

class UptimeMonitor {
  constructor() {
    this.stats = {
      totalChecks: 0,
      successCount: 0,
      failureCount: 0,
      coldStartDetected: 0,
      corsErrors: 0,
      lastFailure: null
    };
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ${message}\n`;
    console.log(message);
    
    try {
      fs.appendFileSync(CONFIG.LOG_FILE, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async checkEndpoint(url, description) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const req = https.get(url, {
        timeout: CONFIG.TIMEOUT,
        headers: {
          'User-Agent': 'OnYourBehlf-Uptime-Monitor/1.0',
          'Accept': 'application/json'
        }
      }, (res) => {
        const responseTime = Date.now() - startTime;
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            success: true,
            statusCode: res.statusCode,
            responseTime,
            description
          });
        } else {
          resolve({
            success: false,
            statusCode: res.statusCode,
            responseTime,
            description,
            error: `HTTP ${res.statusCode}`
          });
        }
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          success: false,
          responseTime,
          description,
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        resolve({
          success: false,
          responseTime,
          description,
          error: 'Timeout'
        });
      });
    });
  }

  async performHealthCheck() {
    this.stats.totalChecks++;
    
    const checks = [
      {
        url: `${CONFIG.API_URL}/api/health-status`,
        description: 'API Health Check'
      },
      {
        url: `${CONFIG.API_URL}/api/products?limit=1`,
        description: 'Products API'
      },
      {
        url: `${CONFIG.API_URL}/api/warmup`,
        description: 'Warmup Endpoint'
      }
    ];

    const results = await Promise.all(
      checks.map(check => this.checkEndpoint(check.url, check.description))
    );

    let allHealthy = true;
    let coldStartSuspected = false;
    let corsError = false;

    for (const result of results) {
      if (!result.success) {
        allHealthy = false;
        
        // Detect cold start patterns
        if (result.error && (
          result.error.includes('CORS') ||
          result.error.includes('502') ||
          result.error.includes('ECONNREFUSED') ||
          result.responseTime > 20000
        )) {
          coldStartSuspected = true;
          if (result.error.includes('CORS')) {
            corsError = true;
          }
        }

        this.log(`❌ ${result.description} FAILED: ${result.error} (${result.responseTime}ms)`);
      } else {
        this.log(`✅ ${result.description} OK: ${result.statusCode} (${result.responseTime}ms)`);
      }
    }

    if (allHealthy) {
      this.stats.successCount++;
    } else {
      this.stats.failureCount++;
      this.stats.lastFailure = new Date();
      
      if (coldStartSuspected) {
        this.stats.coldStartDetected++;
        this.log(`🥶 COLD START DETECTED - Triggering warmup sequence`);
        await this.triggerWarmup();
      }
      
      if (corsError) {
        this.stats.corsErrors++;
        this.log(`🚫 CORS ERROR DETECTED - Instance may be starting up`);
      }
    }

    // Log statistics every 10 checks
    if (this.stats.totalChecks % 10 === 0) {
      this.logStatistics();
    }
  }

  async triggerWarmup() {
    try {
      const warmupResult = await this.checkEndpoint(
        `${CONFIG.API_URL}/api/warmup`,
        'Emergency Warmup'
      );
      
      if (warmupResult.success) {
        this.log(`🔥 Emergency warmup successful (${warmupResult.responseTime}ms)`);
      } else {
        this.log(`❌ Emergency warmup failed: ${warmupResult.error}`);
      }
    } catch (error) {
      this.log(`❌ Emergency warmup error: ${error.message}`);
    }
  }

  logStatistics() {
    const uptime = this.stats.totalChecks > 0 
      ? ((this.stats.successCount / this.stats.totalChecks) * 100).toFixed(2)
      : 0;
    
    this.log(`📊 STATISTICS: Uptime: ${uptime}% | Success: ${this.stats.successCount} | Failures: ${this.stats.failureCount} | Cold Starts: ${this.stats.coldStartDetected} | CORS Errors: ${this.stats.corsErrors}`);
  }

  start() {
    this.log(`🚀 Starting uptime monitor for ${CONFIG.API_URL}`);
    this.log(`📊 Check interval: ${CONFIG.CHECK_INTERVAL / 1000}s | Timeout: ${CONFIG.TIMEOUT / 1000}s`);
    
    // Initial check
    this.performHealthCheck();
    
    // Schedule regular checks
    setInterval(() => {
      this.performHealthCheck();
    }, CONFIG.CHECK_INTERVAL);
  }
}

// Start monitoring if run directly
if (require.main === module) {
  const monitor = new UptimeMonitor();
  monitor.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    monitor.log('🛑 Uptime monitor stopped');
    monitor.logStatistics();
    process.exit(0);
  });
}

module.exports = UptimeMonitor;
