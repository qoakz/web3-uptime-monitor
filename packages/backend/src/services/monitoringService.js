const cron = require('node-cron');
const logger = require('../utils/logger');
const Monitor = require('../models/Monitor');

class MonitoringService {
  constructor(io) {
    this.io = io;
    this.activeJobs = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      logger.warn('Monitoring service already running');
      return;
    }

    logger.info('Starting monitoring service');
    
    // Schedule the main monitoring job to run every minute
    this.mainJob = cron.schedule('* * * * *', async () => {
      await this.checkMonitors();
    }, {
      scheduled: false
    });

    this.mainJob.start();
    this.isRunning = true;
    
    logger.info('Monitoring service started');
  }

  stop() {
    if (!this.isRunning) {
      logger.warn('Monitoring service not running');
      return;
    }

    logger.info('Stopping monitoring service');
    
    if (this.mainJob) {
      this.mainJob.stop();
    }

    // Stop all individual monitor jobs
    this.activeJobs.forEach(job => job.stop());
    this.activeJobs.clear();
    
    this.isRunning = false;
    logger.info('Monitoring service stopped');
  }

  async checkMonitors() {
    try {
      const monitors = await Monitor.find({ status: 'active' });
      
      for (const monitor of monitors) {
        await this.processMonitor(monitor);
      }
    } catch (error) {
      logger.error('Error in checkMonitors:', error);
    }
  }

  async processMonitor(monitor) {
    try {
      // Check if monitor is in maintenance window
      if (monitor.isInMaintenanceWindow()) {
        logger.debug(`Monitor ${monitor._id} is in maintenance window, skipping`);
        return;
      }

      // Check if it's time for the next check
      const now = new Date();
      const lastChecked = monitor.lastChecked || new Date(0);
      const timeSinceLastCheck = now - lastChecked;
      const intervalMs = monitor.interval * 1000;

      if (timeSinceLastCheck < intervalMs) {
        return; // Not time yet
      }

      logger.debug(`Scheduling check for monitor ${monitor._id}: ${monitor.url}`);
      
      // In a real decentralized system, this would trigger the monitoring nodes
      // For now, we'll simulate the process
      await this.simulateMonitoringCheck(monitor);
      
    } catch (error) {
      logger.error(`Error processing monitor ${monitor._id}:`, error);
    }
  }

  async simulateMonitoringCheck(monitor) {
    try {
      logger.info(`Simulating monitoring check for ${monitor.url}`);
      
      // In the real system, this would:
      // 1. Get assigned nodes from the blockchain
      // 2. Send check requests to nodes
      // 3. Collect results
      // 4. Submit results to blockchain
      // 5. Wait for consensus
      
      // For simulation, we'll create a mock result
      const isUp = Math.random() > 0.1; // 90% uptime simulation
      const responseTime = isUp ? Math.floor(Math.random() * 2000) + 100 : 0; // 100-2100ms when up
      
      // Update monitor with simulated result
      const wasUp = monitor.isUp;
      monitor.isUp = isUp;
      monitor.lastChecked = new Date();
      monitor.lastResponseTime = responseTime;
      monitor.totalChecks += 1;
      
      if (isUp) {
        monitor.successfulChecks += 1;
      } else {
        monitor.failedChecks += 1;
      }

      // Calculate uptime percentage
      monitor.uptime = (monitor.successfulChecks / monitor.totalChecks) * 100;

      // Handle status changes and incidents
      if (wasUp !== null && wasUp !== isUp) {
        if (isUp) {
          logger.info(`Website ${monitor.url} is back up`);
          await monitor.resolveCurrentIncident();
          
          // Send notification
          await this.sendNotification(monitor, 'up', `Website ${monitor.url} is back online`);
          
        } else {
          logger.warn(`Website ${monitor.url} is down`);
          await monitor.addIncident('down', 'Website is not responding');
          
          // Send notification
          await this.sendNotification(monitor, 'down', `Website ${monitor.url} is down`);
        }
      }

      await monitor.save();

      // Emit real-time update to connected clients
      this.io.to(`monitor-${monitor._id}`).emit('statusUpdate', {
        monitorId: monitor._id,
        isUp,
        responseTime,
        uptime: monitor.uptime,
        lastChecked: monitor.lastChecked,
        totalChecks: monitor.totalChecks,
        successfulChecks: monitor.successfulChecks,
        failedChecks: monitor.failedChecks
      });

      logger.info(`Monitor check completed for ${monitor.url}: ${isUp ? 'UP' : 'DOWN'} (${responseTime}ms)`);
      
    } catch (error) {
      logger.error(`Error in simulateMonitoringCheck for ${monitor.url}:`, error);
    }
  }

  async sendNotification(monitor, type, message) {
    try {
      const NotificationService = require('./notificationService');
      const notificationService = new NotificationService(this.io);
      
      await notificationService.sendMonitorAlert(monitor, type, message);
      
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  // Method to add a new monitor to the service
  async addMonitor(monitor) {
    try {
      logger.info(`Adding monitor ${monitor._id} to monitoring service`);
      
      // In a real system, this would interact with the blockchain
      // to create a monitoring request and assign nodes
      
      // For now, we'll just log it
      logger.info(`Monitor ${monitor._id} added successfully`);
      
    } catch (error) {
      logger.error(`Error adding monitor ${monitor._id}:`, error);
      throw error;
    }
  }

  // Method to remove a monitor from the service
  async removeMonitor(monitorId) {
    try {
      logger.info(`Removing monitor ${monitorId} from monitoring service`);
      
      // Stop any individual job for this monitor
      if (this.activeJobs.has(monitorId)) {
        this.activeJobs.get(monitorId).stop();
        this.activeJobs.delete(monitorId);
      }
      
      // In a real system, this would deactivate the monitoring request
      // on the blockchain
      
      logger.info(`Monitor ${monitorId} removed successfully`);
      
    } catch (error) {
      logger.error(`Error removing monitor ${monitorId}:`, error);
      throw error;
    }
  }

  // Method to update monitor configuration
  async updateMonitor(monitor) {
    try {
      logger.info(`Updating monitor ${monitor._id} configuration`);
      
      // Remove old job if exists
      if (this.activeJobs.has(monitor._id.toString())) {
        this.activeJobs.get(monitor._id.toString()).stop();
        this.activeJobs.delete(monitor._id.toString());
      }
      
      // In a real system, this would update the monitoring request
      // on the blockchain
      
      logger.info(`Monitor ${monitor._id} updated successfully`);
      
    } catch (error) {
      logger.error(`Error updating monitor ${monitor._id}:`, error);
      throw error;
    }
  }

  // Get monitoring statistics
  async getStats() {
    try {
      const totalMonitors = await Monitor.countDocuments();
      const activeMonitors = await Monitor.countDocuments({ status: 'active' });
      const upMonitors = await Monitor.countDocuments({ status: 'active', isUp: true });
      const downMonitors = await Monitor.countDocuments({ status: 'active', isUp: false });
      
      const avgUptimeResult = await Monitor.aggregate([
        { $match: { status: 'active', totalChecks: { $gt: 0 } } },
        { $group: { _id: null, avgUptime: { $avg: '$uptime' } } }
      ]);
      
      const avgUptime = avgUptimeResult.length > 0 ? avgUptimeResult[0].avgUptime : 100;
      
      // Total checks in last 24 hours
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentChecks = await Monitor.aggregate([
        { $match: { lastChecked: { $gte: last24Hours } } },
        { $group: { _id: null, totalChecks: { $sum: '$totalChecks' } } }
      ]);
      
      const checksLast24h = recentChecks.length > 0 ? recentChecks[0].totalChecks : 0;

      return {
        totalMonitors,
        activeMonitors,
        upMonitors,
        downMonitors,
        avgUptime: Math.round(avgUptime * 100) / 100,
        checksLast24h,
        serviceUptime: this.isRunning ? process.uptime() : 0
      };
      
    } catch (error) {
      logger.error('Error getting monitoring stats:', error);
      throw error;
    }
  }

  // Health check for the monitoring service
  getHealth() {
    return {
      status: this.isRunning ? 'running' : 'stopped',
      uptime: process.uptime(),
      activeJobs: this.activeJobs.size,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = MonitoringService;