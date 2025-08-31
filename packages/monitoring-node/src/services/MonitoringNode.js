const { ethers } = require('ethers');
const axios = require('axios');
const cron = require('node-cron');
const logger = require('../utils/logger');
const HealthChecker = require('./HealthChecker');
const BlockchainService = require('./BlockchainService');
const PerformanceMonitor = require('./PerformanceMonitor');

class MonitoringNode {
  constructor(config) {
    this.config = config;
    this.isRunning = false;
    this.nodeAddress = null;
    this.assignedRequests = new Map();
    this.checkQueue = [];
    this.isProcessingQueue = false;
    
    // Services
    this.healthChecker = new HealthChecker(config);
    this.blockchainService = new BlockchainService(config);
    this.performanceMonitor = new PerformanceMonitor();
    
    // Statistics
    this.stats = {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      startTime: new Date(),
      lastHeartbeat: null,
      errors: []
    };
    
    // Jobs
    this.jobs = {
      heartbeat: null,
      blockchainSync: null,
      queueProcessor: null,
      statsReporter: null
    };
  }

  async start() {
    try {
      logger.info('Initializing monitoring node...');
      
      // Initialize blockchain service
      await this.blockchainService.initialize();
      this.nodeAddress = this.blockchainService.getAddress();
      
      logger.info(`Node address: ${this.nodeAddress}`);
      
      // Check if node is registered on blockchain
      const isRegistered = await this.blockchainService.isNodeRegistered();
      
      if (!isRegistered) {
        logger.info('Node not registered on blockchain, attempting registration...');
        await this.registerNode();
      } else {
        logger.info('Node is already registered on blockchain');
      }
      
      // Start services
      await this.startServices();
      
      // Schedule jobs
      this.scheduleJobs();
      
      this.isRunning = true;
      logger.info('Monitoring node started successfully');
      
    } catch (error) {
      logger.error('Failed to start monitoring node:', error);
      throw error;
    }
  }

  async stop() {
    try {
      logger.info('Stopping monitoring node...');
      
      this.isRunning = false;
      
      // Stop all jobs
      Object.values(this.jobs).forEach(job => {
        if (job) job.stop();
      });
      
      // Stop services
      await this.stopServices();
      
      logger.info('Monitoring node stopped');
      
    } catch (error) {
      logger.error('Error stopping monitoring node:', error);
      throw error;
    }
  }

  async registerNode() {
    try {
      logger.info('Registering node on blockchain...');
      
      const txHash = await this.blockchainService.registerNode();
      logger.info(`Node registration transaction: ${txHash}`);
      
      // Wait for confirmation
      await this.blockchainService.waitForTransaction(txHash);
      logger.info('Node registration confirmed');
      
    } catch (error) {
      logger.error('Failed to register node:', error);
      throw error;
    }
  }

  async startServices() {
    try {
      // Start health check server if enabled
      if (this.config.ENABLE_HEALTH_SERVER) {
        await this.healthChecker.start();
      }
      
      // Start performance monitoring
      this.performanceMonitor.start();
      
      logger.info('All services started');
      
    } catch (error) {
      logger.error('Failed to start services:', error);
      throw error;
    }
  }

  async stopServices() {
    try {
      if (this.healthChecker) {
        await this.healthChecker.stop();
      }
      
      if (this.performanceMonitor) {
        this.performanceMonitor.stop();
      }
      
      logger.info('All services stopped');
      
    } catch (error) {
      logger.error('Error stopping services:', error);
    }
  }

  scheduleJobs() {
    // Heartbeat job - sends status to backend
    this.jobs.heartbeat = cron.schedule('*/30 * * * * *', async () => {
      await this.sendHeartbeat();
    }, { scheduled: false });

    // Blockchain sync job - checks for new monitoring requests
    this.jobs.blockchainSync = cron.schedule('*/60 * * * * *', async () => {
      await this.syncWithBlockchain();
    }, { scheduled: false });

    // Queue processor job - processes monitoring checks
    this.jobs.queueProcessor = cron.schedule('*/5 * * * * *', async () => {
      await this.processCheckQueue();
    }, { scheduled: false });

    // Stats reporter job - reports statistics
    this.jobs.statsReporter = cron.schedule('0 * * * *', async () => {
      await this.reportStats();
    }, { scheduled: false });

    // Start all jobs
    Object.values(this.jobs).forEach(job => {
      if (job) job.start();
    });

    logger.info('All jobs scheduled and started');
  }

  async sendHeartbeat() {
    try {
      const heartbeatData = {
        nodeAddress: this.nodeAddress,
        nodeName: this.config.NODE_NAME,
        location: this.config.NODE_LOCATION,
        status: this.isRunning ? 'online' : 'offline',
        uptime: Date.now() - this.stats.startTime.getTime(),
        stats: {
          totalChecks: this.stats.totalChecks,
          successfulChecks: this.stats.successfulChecks,
          failedChecks: this.stats.failedChecks,
          errorRate: this.stats.totalChecks > 0 ? this.stats.failedChecks / this.stats.totalChecks : 0
        },
        performance: this.performanceMonitor.getMetrics(),
        assignedRequests: Array.from(this.assignedRequests.keys()),
        timestamp: new Date().toISOString()
      };

      // Send to backend API
      try {
        await axios.post(`${this.config.BACKEND_API_URL}/api/nodes/heartbeat`, heartbeatData, {
          headers: {
            'Authorization': `Bearer ${this.config.API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        this.stats.lastHeartbeat = new Date();
        logger.debug('Heartbeat sent successfully');
        
      } catch (apiError) {
        logger.warn('Failed to send heartbeat to backend:', apiError.message);
      }
      
    } catch (error) {
      logger.error('Error in sendHeartbeat:', error);
    }
  }

  async syncWithBlockchain() {
    try {
      logger.debug('Syncing with blockchain...');
      
      // Get assigned monitoring requests
      const assignedRequests = await this.blockchainService.getAssignedRequests(this.nodeAddress);
      
      // Update local assignments
      for (const requestId of assignedRequests) {
        if (!this.assignedRequests.has(requestId)) {
          const requestInfo = await this.blockchainService.getRequestInfo(requestId);
          this.assignedRequests.set(requestId, {
            ...requestInfo,
            lastChecked: 0,
            nextCheck: Date.now()
          });
          
          logger.info(`New monitoring request assigned: ${requestId} for ${requestInfo.url}`);
        }
      }
      
      // Remove unassigned requests
      for (const requestId of this.assignedRequests.keys()) {
        if (!assignedRequests.includes(requestId)) {
          this.assignedRequests.delete(requestId);
          logger.info(`Monitoring request unassigned: ${requestId}`);
        }
      }
      
      logger.debug(`Currently assigned to ${this.assignedRequests.size} monitoring requests`);
      
    } catch (error) {
      logger.error('Error syncing with blockchain:', error);
    }
  }

  async processCheckQueue() {
    if (this.isProcessingQueue) {
      return;
    }

    try {
      this.isProcessingQueue = true;
      
      // Add due checks to queue
      const now = Date.now();
      for (const [requestId, request] of this.assignedRequests) {
        if (request.nextCheck <= now) {
          this.checkQueue.push({
            requestId,
            request,
            priority: request.priority || 0,
            timestamp: now
          });
          
          // Schedule next check
          request.nextCheck = now + (request.interval * 1000);
        }
      }
      
      // Sort queue by priority and timestamp
      this.checkQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.timestamp - b.timestamp; // Earlier timestamp first
      });
      
      // Process checks (limited by MAX_CONCURRENT_CHECKS)
      const maxConcurrent = this.config.MAX_CONCURRENT_CHECKS;
      const checksToProcess = this.checkQueue.splice(0, maxConcurrent);
      
      if (checksToProcess.length > 0) {
        logger.debug(`Processing ${checksToProcess.length} monitoring checks`);
        
        const checkPromises = checksToProcess.map(check => 
          this.performMonitoringCheck(check.requestId, check.request)
        );
        
        await Promise.allSettled(checkPromises);
      }
      
    } catch (error) {
      logger.error('Error processing check queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  async performMonitoringCheck(requestId, request) {
    const startTime = Date.now();
    let result = null;
    
    try {
      logger.debug(`Performing check for request ${requestId}: ${request.url}`);
      
      // Perform the actual HTTP check
      result = await this.httpCheck(request.url, request.timeout);
      
      // Update statistics
      this.stats.totalChecks++;
      if (result.isUp) {
        this.stats.successfulChecks++;
      } else {
        this.stats.failedChecks++;
      }
      
      // Update request info
      request.lastChecked = Date.now();
      
      // Submit result to blockchain
      await this.submitResult(requestId, result);
      
      const duration = Date.now() - startTime;
      logger.info(`Check completed for ${request.url}: ${result.isUp ? 'UP' : 'DOWN'} (${result.responseTime}ms) - Total duration: ${duration}ms`);
      
    } catch (error) {
      logger.error(`Error performing check for request ${requestId}:`, error);
      
      this.stats.totalChecks++;
      this.stats.failedChecks++;
      
      // Record error
      this.stats.errors.push({
        requestId,
        url: request.url,
        error: error.message,
        timestamp: new Date()
      });
      
      // Keep only last 100 errors
      if (this.stats.errors.length > 100) {
        this.stats.errors = this.stats.errors.slice(-100);
      }
      
      // Submit error result
      try {
        await this.submitResult(requestId, {
          isUp: false,
          responseTime: 0,
          error: error.message
        });
      } catch (submitError) {
        logger.error('Failed to submit error result:', submitError);
      }
    }
  }

  async httpCheck(url, timeout = this.config.DEFAULT_TIMEOUT) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(url, {
        timeout: timeout,
        maxRedirects: this.config.MAX_REDIRECTS,
        validateStatus: (status) => status < 500, // Consider 4xx as up, 5xx as down
        headers: {
          'User-Agent': this.config.USER_AGENT
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        isUp: true,
        responseTime: responseTime,
        statusCode: response.status,
        contentLength: response.headers['content-length'] || 0
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Check if it's a timeout or network error
      const isUp = false;
      let statusCode = 0;
      
      if (error.response) {
        statusCode = error.response.status;
      }
      
      return {
        isUp,
        responseTime: responseTime,
        statusCode,
        error: error.message
      };
    }
  }

  async submitResult(requestId, result) {
    try {
      const txHash = await this.blockchainService.submitMonitoringResult(
        requestId,
        result.isUp,
        result.responseTime
      );
      
      logger.debug(`Result submitted to blockchain: ${txHash}`);
      
    } catch (error) {
      logger.error(`Failed to submit result for request ${requestId}:`, error);
      throw error;
    }
  }

  async reportStats() {
    try {
      const stats = {
        nodeAddress: this.nodeAddress,
        nodeName: this.config.NODE_NAME,
        uptime: Date.now() - this.stats.startTime.getTime(),
        totalChecks: this.stats.totalChecks,
        successfulChecks: this.stats.successfulChecks,
        failedChecks: this.stats.failedChecks,
        errorRate: this.stats.totalChecks > 0 ? this.stats.failedChecks / this.stats.totalChecks : 0,
        assignedRequests: this.assignedRequests.size,
        performance: this.performanceMonitor.getMetrics(),
        recentErrors: this.stats.errors.slice(-10) // Last 10 errors
      };
      
      logger.info('Node Statistics:', stats);
      
      // Send to backend if configured
      try {
        await axios.post(`${this.config.BACKEND_API_URL}/api/nodes/stats`, stats, {
          headers: {
            'Authorization': `Bearer ${this.config.API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
      } catch (apiError) {
        logger.warn('Failed to send stats to backend:', apiError.message);
      }
      
    } catch (error) {
      logger.error('Error reporting stats:', error);
    }
  }

  // Getters for external access
  getStats() {
    return {
      ...this.stats,
      nodeAddress: this.nodeAddress,
      assignedRequests: this.assignedRequests.size,
      isRunning: this.isRunning,
      uptime: Date.now() - this.stats.startTime.getTime()
    };
  }

  getHealth() {
    return {
      status: this.isRunning ? 'healthy' : 'unhealthy',
      uptime: Date.now() - this.stats.startTime.getTime(),
      nodeAddress: this.nodeAddress,
      assignedRequests: this.assignedRequests.size,
      queueSize: this.checkQueue.length,
      lastHeartbeat: this.stats.lastHeartbeat,
      performance: this.performanceMonitor.getMetrics(),
      errorRate: this.stats.totalChecks > 0 ? this.stats.failedChecks / this.stats.totalChecks : 0
    };
  }
}

module.exports = MonitoringNode;