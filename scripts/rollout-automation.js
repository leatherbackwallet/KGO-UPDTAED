#!/usr/bin/env node

/**
 * Automated Rollout Script for Reliability Features
 * Manages gradual rollout with safety checks and automatic rollback
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class RolloutAutomation {
  constructor(config) {
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:3001',
      rolloutSteps: config.rolloutSteps || [5, 10, 25, 50, 75, 100],
      monitoringInterval: config.monitoringInterval || 30000, // 30 seconds
      stabilityPeriod: config.stabilityPeriod || 300000, // 5 minutes
      maxErrorRate: config.maxErrorRate || 3,
      maxPerformanceDegradation: config.maxPerformanceDegradation || 3,
      minUserFeedback: config.minUserFeedback || 2.0,
      ...config
    };
    
    this.rolloutState = new Map();
    this.isRunning = false;
  }

  async start() {
    console.log('🚀 Starting automated rollout process...');
    this.isRunning = true;
    
    try {
      // Load rollout configuration
      await this.loadRolloutConfig();
      
      // Start monitoring loop
      while (this.isRunning) {
        await this.processRollouts();
        await this.sleep(this.config.monitoringInterval);
      }
    } catch (error) {
      console.error('❌ Rollout automation error:', error);
      await this.emergencyRollback();
    }
  }

  async stop() {
    console.log('🛑 Stopping automated rollout process...');
    this.isRunning = false;
  }

  async loadRolloutConfig() {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/feature-flags`);
      const flags = response.data.flags;
      
      Object.entries(flags).forEach(([flagName, flag]) => {
        if (flag.enabled && flag.rolloutPercentage < 100) {
          this.rolloutState.set(flagName, {
            currentStep: this.getCurrentStep(flag.rolloutPercentage),
            lastUpdate: new Date(flag.metadata.lastModified),
            stabilityStartTime: null,
            metrics: null
          });
        }
      });
      
      console.log(`📊 Loaded ${this.rolloutState.size} flags for automated rollout`);
    } catch (error) {
      console.error('Failed to load rollout configuration:', error);
      throw error;
    }
  }

  getCurrentStep(percentage) {
    for (let i = 0; i < this.config.rolloutSteps.length; i++) {
      if (percentage <= this.config.rolloutSteps[i]) {
        return i;
      }
    }
    return this.config.rolloutSteps.length - 1;
  }

  async processRollouts() {
    for (const [flagName, state] of this.rolloutState.entries()) {
      try {
        await this.processFlag(flagName, state);
      } catch (error) {
        console.error(`Error processing flag ${flagName}:`, error);
      }
    }
  }

  async processFlag(flagName, state) {
    // Get current metrics
    const metrics = await this.getMetrics(flagName);
    state.metrics = metrics;
    
    // Check if rollback is needed
    if (this.shouldRollback(metrics)) {
      await this.rollbackFlag(flagName, 'Automated rollback due to poor metrics');
      return;
    }
    
    // Check if we can proceed to next step
    if (this.canProceedToNextStep(state, metrics)) {
      await this.advanceRollout(flagName, state);
    }
  }

  async getMetrics(flagName) {
    try {
      const response = await axios.get(
        `${this.config.apiUrl}/api/feature-flags/${flagName}/metrics`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.adminToken}`
          }
        }
      );
      return response.data.metrics;
    } catch (error) {
      console.warn(`Failed to get metrics for ${flagName}:`, error.message);
      return null;
    }
  }

  shouldRollback(metrics) {
    if (!metrics) return false;
    
    return (
      metrics.errorRate > this.config.maxErrorRate ||
      metrics.performanceImpact < -this.config.maxPerformanceDegradation ||
      metrics.userFeedback < this.config.minUserFeedback
    );
  }

  canProceedToNextStep(state, metrics) {
    if (!metrics) return false;
    
    // Check if we're at the final step
    if (state.currentStep >= this.config.rolloutSteps.length - 1) {
      return false;
    }
    
    // Check if stability period has passed
    if (!state.stabilityStartTime) {
      state.stabilityStartTime = new Date();
      return false;
    }
    
    const stabilityDuration = Date.now() - state.stabilityStartTime.getTime();
    if (stabilityDuration < this.config.stabilityPeriod) {
      return false;
    }
    
    // Check if metrics are healthy
    return (
      metrics.errorRate <= this.config.maxErrorRate &&
      metrics.performanceImpact >= -this.config.maxPerformanceDegradation &&
      metrics.userFeedback >= this.config.minUserFeedback
    );
  }

  async advanceRollout(flagName, state) {
    const nextStep = state.currentStep + 1;
    const nextPercentage = this.config.rolloutSteps[nextStep];
    
    try {
      await axios.put(
        `${this.config.apiUrl}/api/feature-flags/${flagName}`,
        { rolloutPercentage: nextPercentage },
        {
          headers: {
            'Authorization': `Bearer ${this.config.adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      state.currentStep = nextStep;
      state.stabilityStartTime = null; // Reset stability timer
      
      console.log(`✅ Advanced ${flagName} to ${nextPercentage}% rollout`);
      
      // Log to rollout history
      await this.logRolloutEvent(flagName, 'advance', {
        fromPercentage: this.config.rolloutSteps[nextStep - 1] || 0,
        toPercentage: nextPercentage,
        metrics: state.metrics
      });
      
    } catch (error) {
      console.error(`Failed to advance rollout for ${flagName}:`, error);
    }
  }

  async rollbackFlag(flagName, reason) {
    try {
      await axios.post(
        `${this.config.apiUrl}/api/feature-flags/${flagName}/rollback`,
        { reason },
        {
          headers: {
            'Authorization': `Bearer ${this.config.adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Remove from active rollout
      this.rolloutState.delete(flagName);
      
      console.log(`🔄 Rolled back ${flagName}: ${reason}`);
      
      // Log to rollout history
      await this.logRolloutEvent(flagName, 'rollback', {
        reason,
        metrics: this.rolloutState.get(flagName)?.metrics
      });
      
      // Send alert
      await this.sendAlert(flagName, 'rollback', reason);
      
    } catch (error) {
      console.error(`Failed to rollback ${flagName}:`, error);
    }
  }

  async emergencyRollback() {
    console.log('🚨 Performing emergency rollback of all active rollouts...');
    
    const rollbackPromises = Array.from(this.rolloutState.keys()).map(flagName =>
      this.rollbackFlag(flagName, 'Emergency rollback due to system error')
    );
    
    await Promise.allSettled(rollbackPromises);
  }

  async logRolloutEvent(flagName, action, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      flagName,
      action,
      data
    };
    
    try {
      const logFile = path.join(__dirname, '../logs/rollout-history.json');
      let history = [];
      
      try {
        const existingLog = await fs.readFile(logFile, 'utf8');
        history = JSON.parse(existingLog);
      } catch (error) {
        // File doesn't exist or is invalid, start fresh
      }
      
      history.push(logEntry);
      
      // Keep only last 1000 entries
      if (history.length > 1000) {
        history = history.slice(-1000);
      }
      
      await fs.writeFile(logFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('Failed to log rollout event:', error);
    }
  }

  async sendAlert(flagName, type, message) {
    // In production, integrate with alerting system (Slack, PagerDuty, etc.)
    console.log(`🚨 ALERT [${type.toUpperCase()}] ${flagName}: ${message}`);
    
    // Mock webhook notification
    try {
      if (this.config.webhookUrl) {
        await axios.post(this.config.webhookUrl, {
          text: `🚨 Feature Flag Alert: ${flagName} - ${message}`,
          type,
          flagName,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      activeRollouts: this.rolloutState.size,
      flags: {}
    };
    
    for (const [flagName, state] of this.rolloutState.entries()) {
      const currentPercentage = this.config.rolloutSteps[state.currentStep];
      report.flags[flagName] = {
        currentPercentage,
        step: state.currentStep + 1,
        totalSteps: this.config.rolloutSteps.length,
        lastUpdate: state.lastUpdate,
        metrics: state.metrics
      };
    }
    
    return report;
  }
}

// CLI interface
if (require.main === module) {
  const config = {
    apiUrl: process.env.API_URL || 'http://localhost:3001',
    adminToken: process.env.ADMIN_TOKEN,
    webhookUrl: process.env.WEBHOOK_URL,
    rolloutSteps: process.env.ROLLOUT_STEPS ? 
      process.env.ROLLOUT_STEPS.split(',').map(Number) : 
      [5, 10, 25, 50, 75, 100]
  };
  
  const automation = new RolloutAutomation(config);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await automation.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await automation.stop();
    process.exit(0);
  });
  
  // Start automation
  automation.start().catch(error => {
    console.error('❌ Rollout automation failed:', error);
    process.exit(1);
  });
}

module.exports = RolloutAutomation;