const http = require('http');
const logger = require('../utils/logger');

class HealthChecker {
  constructor(config) {
    this.config = config;
    this.server = null;
    this.isRunning = false;
    this.startTime = new Date();
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Health checker already running');
      return;
    }

    try {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      await new Promise((resolve, reject) => {
        this.server.listen(this.config.HEALTH_CHECK_PORT, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      this.isRunning = true;
      logger.info(`Health check server started on port ${this.config.HEALTH_CHECK_PORT}`);
      
    } catch (error) {
      logger.error('Failed to start health check server:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning || !this.server) {
      return;
    }

    try {
      await new Promise((resolve) => {
        this.server.close(() => {
          resolve();
        });
      });

      this.isRunning = false;
      logger.info('Health check server stopped');
      
    } catch (error) {
      logger.error('Error stopping health check server:', error);
      throw error;
    }
  }

  handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method !== 'GET') {
      this.sendResponse(res, 405, { error: 'Method not allowed' });
      return;
    }

    try {
      switch (url.pathname) {
        case '/health':
          this.handleHealthCheck(req, res);
          break;
        case '/metrics':
          this.handleMetrics(req, res);
          break;
        case '/status':
          this.handleStatus(req, res);
          break;
        default:
          this.sendResponse(res, 404, { error: 'Endpoint not found' });
      }
    } catch (error) {
      logger.error('Error handling health check request:', error);
      this.sendResponse(res, 500, { error: 'Internal server error' });
    }
  }

  handleHealthCheck(req, res) {
    const uptime = Date.now() - this.startTime.getTime();
    const memoryUsage = process.memoryUsage();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      version: process.version,
      nodeEnv: this.config.NODE_ENV,
      nodeName: this.config.NODE_NAME
    };

    this.sendResponse(res, 200, health);
  }

  handleMetrics(req, res) {
    const uptime = Date.now() - this.startTime.getTime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Generate Prometheus-style metrics
    const metrics = [
      `# HELP node_uptime_seconds Total uptime of the monitoring node`,
      `# TYPE node_uptime_seconds counter`,
      `node_uptime_seconds ${Math.floor(uptime / 1000)}`,
      '',
      `# HELP node_memory_usage_bytes Memory usage in bytes`,
      `# TYPE node_memory_usage_bytes gauge`,
      `node_memory_usage_bytes{type="rss"} ${memoryUsage.rss}`,
      `node_memory_usage_bytes{type="heap_total"} ${memoryUsage.heapTotal}`,
      `node_memory_usage_bytes{type="heap_used"} ${memoryUsage.heapUsed}`,
      `node_memory_usage_bytes{type="external"} ${memoryUsage.external}`,
      '',
      `# HELP node_cpu_usage_microseconds CPU usage in microseconds`,
      `# TYPE node_cpu_usage_microseconds counter`,
      `node_cpu_usage_microseconds{type="user"} ${cpuUsage.user}`,
      `node_cpu_usage_microseconds{type="system"} ${cpuUsage.system}`,
      ''
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain');
    res.writeHead(200);
    res.end(metrics);
  }

  handleStatus(req, res) {
    // This would typically get status from the main monitoring node
    // For now, return basic status
    const status = {
      node: {
        name: this.config.NODE_NAME,
        address: this.config.NODE_ADDRESS,
        status: 'running',
        uptime: Date.now() - this.startTime.getTime()
      },
      blockchain: {
        connected: true, // Would check actual blockchain connection
        network: 'unknown'
      },
      monitoring: {
        active: true,
        assignedRequests: 0 // Would get from monitoring node
      },
      timestamp: new Date().toISOString()
    };

    this.sendResponse(res, 200, status);
  }

  sendResponse(res, statusCode, data) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(statusCode);
    res.end(JSON.stringify(data, null, 2));
  }

  formatUptime(uptime) {
    const seconds = Math.floor(uptime / 1000) % 60;
    const minutes = Math.floor(uptime / (1000 * 60)) % 60;
    const hours = Math.floor(uptime / (1000 * 60 * 60)) % 24;
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

module.exports = HealthChecker;