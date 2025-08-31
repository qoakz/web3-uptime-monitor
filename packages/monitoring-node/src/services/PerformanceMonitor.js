class PerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      requestsPerformed: 0,
      requestsSuccessful: 0,
      requestsFailed: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      memoryPeakUsage: 0,
      cpuUsageHistory: [],
      responseTimeHistory: []
    };
    
    this.intervalId = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Collect metrics every 30 seconds
    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, 30000);
    
    // Initial collection
    this.collectMetrics();
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  collectMetrics() {
    try {
      // Memory metrics
      const memoryUsage = process.memoryUsage();
      this.metrics.memoryPeakUsage = Math.max(
        this.metrics.memoryPeakUsage,
        memoryUsage.heapUsed
      );

      // CPU metrics
      const cpuUsage = process.cpuUsage();
      const cpuPercent = this.calculateCpuPercent(cpuUsage);
      
      this.metrics.cpuUsageHistory.push({
        timestamp: Date.now(),
        user: cpuUsage.user,
        system: cpuUsage.system,
        percent: cpuPercent
      });

      // Keep only last 100 entries
      if (this.metrics.cpuUsageHistory.length > 100) {
        this.metrics.cpuUsageHistory = this.metrics.cpuUsageHistory.slice(-100);
      }

      if (this.metrics.responseTimeHistory.length > 1000) {
        this.metrics.responseTimeHistory = this.metrics.responseTimeHistory.slice(-1000);
      }

    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }

  calculateCpuPercent(cpuUsage) {
    // Simple CPU percentage calculation
    // In a real implementation, you'd want to track the delta between measurements
    const totalUsage = cpuUsage.user + cpuUsage.system;
    const elapsedTime = Date.now() - this.startTime;
    
    // Convert microseconds to percentage (very rough approximation)
    return Math.min(100, (totalUsage / (elapsedTime * 1000)) * 100);
  }

  recordRequest(isSuccessful, responseTime) {
    this.metrics.requestsPerformed++;
    
    if (isSuccessful) {
      this.metrics.requestsSuccessful++;
    } else {
      this.metrics.requestsFailed++;
    }

    // Update response time metrics
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.requestsPerformed;
    this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, responseTime);
    this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, responseTime);

    // Record response time history
    this.metrics.responseTimeHistory.push({
      timestamp: Date.now(),
      responseTime: responseTime,
      isSuccessful: isSuccessful
    });
  }

  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    
    // Calculate current success rate
    const successRate = this.metrics.requestsPerformed > 0 
      ? (this.metrics.requestsSuccessful / this.metrics.requestsPerformed) * 100 
      : 100;

    // Calculate recent metrics (last 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentResponseTimes = this.metrics.responseTimeHistory.filter(
      entry => entry.timestamp > fiveMinutesAgo
    );

    const recentAverageResponseTime = recentResponseTimes.length > 0
      ? recentResponseTimes.reduce((sum, entry) => sum + entry.responseTime, 0) / recentResponseTimes.length
      : 0;

    const recentSuccessRate = recentResponseTimes.length > 0
      ? (recentResponseTimes.filter(entry => entry.isSuccessful).length / recentResponseTimes.length) * 100
      : 100;

    // Calculate current CPU usage
    const currentCpuUsage = this.metrics.cpuUsageHistory.length > 0
      ? this.metrics.cpuUsageHistory[this.metrics.cpuUsageHistory.length - 1]
      : { percent: 0 };

    return {
      uptime: uptime,
      memory: {
        current: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024) // MB
        },
        peak: Math.round(this.metrics.memoryPeakUsage / 1024 / 1024) // MB
      },
      cpu: {
        current: Math.round(currentCpuUsage.percent * 100) / 100,
        average: this.getAverageCpuUsage()
      },
      requests: {
        total: this.metrics.requestsPerformed,
        successful: this.metrics.requestsSuccessful,
        failed: this.metrics.requestsFailed,
        successRate: Math.round(successRate * 100) / 100,
        recentSuccessRate: Math.round(recentSuccessRate * 100) / 100
      },
      responseTime: {
        average: Math.round(this.metrics.averageResponseTime * 100) / 100,
        min: this.metrics.minResponseTime === Infinity ? 0 : this.metrics.minResponseTime,
        max: this.metrics.maxResponseTime,
        recentAverage: Math.round(recentAverageResponseTime * 100) / 100
      },
      throughput: {
        requestsPerMinute: this.calculateRequestsPerMinute(),
        recentRequestsPerMinute: this.calculateRecentRequestsPerMinute()
      }
    };
  }

  getAverageCpuUsage() {
    if (this.metrics.cpuUsageHistory.length === 0) {
      return 0;
    }

    const sum = this.metrics.cpuUsageHistory.reduce(
      (total, entry) => total + entry.percent, 
      0
    );
    
    return Math.round((sum / this.metrics.cpuUsageHistory.length) * 100) / 100;
  }

  calculateRequestsPerMinute() {
    const uptimeMinutes = (Date.now() - this.startTime) / (1000 * 60);
    return uptimeMinutes > 0 ? Math.round((this.metrics.requestsPerformed / uptimeMinutes) * 100) / 100 : 0;
  }

  calculateRecentRequestsPerMinute() {
    const oneMinuteAgo = Date.now() - (60 * 1000);
    const recentRequests = this.metrics.responseTimeHistory.filter(
      entry => entry.timestamp > oneMinuteAgo
    );
    
    return recentRequests.length;
  }

  // Get detailed performance report
  getDetailedReport() {
    const metrics = this.getMetrics();
    
    return {
      ...metrics,
      history: {
        cpuUsage: this.metrics.cpuUsageHistory.slice(-20), // Last 20 entries
        responseTime: this.metrics.responseTimeHistory.slice(-100) // Last 100 entries
      },
      thresholds: {
        memoryWarning: metrics.memory.current.heapUsed > 500, // 500MB
        cpuWarning: metrics.cpu.current > 80, // 80%
        responseTimeWarning: metrics.responseTime.recentAverage > 5000, // 5 seconds
        successRateWarning: metrics.requests.recentSuccessRate < 95 // 95%
      }
    };
  }

  // Reset metrics
  reset() {
    this.startTime = Date.now();
    this.metrics = {
      requestsPerformed: 0,
      requestsSuccessful: 0,
      requestsFailed: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      memoryPeakUsage: 0,
      cpuUsageHistory: [],
      responseTimeHistory: []
    };
  }
}

module.exports = PerformanceMonitor;