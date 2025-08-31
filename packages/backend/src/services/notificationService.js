const nodemailer = require('nodemailer');
const axios = require('axios');
const logger = require('../utils/logger');

class NotificationService {
  constructor(io) {
    this.io = io;
    this.emailTransporter = null;
    this.initializeEmailTransporter();
  }

  initializeEmailTransporter() {
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        this.emailTransporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        logger.info('Email transporter initialized');
      } else {
        logger.warn('Email configuration missing, email notifications disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  async sendMonitorAlert(monitor, type, message) {
    try {
      logger.info(`Sending ${type} alert for monitor ${monitor._id}: ${monitor.url}`);

      const alertData = {
        monitor: {
          id: monitor._id,
          name: monitor.name,
          url: monitor.url,
          status: type
        },
        message,
        timestamp: new Date(),
        type
      };

      // Send real-time notification via WebSocket
      await this.sendRealtimeNotification(monitor, alertData);

      // Send email notifications if configured
      if (monitor.notifications.email.enabled && monitor.notifications.email.addresses.length > 0) {
        await this.sendEmailNotification(monitor, alertData);
      }

      // Send webhook notifications if configured
      if (monitor.notifications.webhook.enabled && monitor.notifications.webhook.url) {
        await this.sendWebhookNotification(monitor, alertData);
      }

      // Send Discord notifications if configured
      if (monitor.notifications.discord.enabled && monitor.notifications.discord.webhookUrl) {
        await this.sendDiscordNotification(monitor, alertData);
      }

      // Send Slack notifications if configured
      if (monitor.notifications.slack.enabled && monitor.notifications.slack.webhookUrl) {
        await this.sendSlackNotification(monitor, alertData);
      }

      logger.info(`Alert notifications sent for monitor ${monitor._id}`);

    } catch (error) {
      logger.error(`Error sending monitor alert for ${monitor._id}:`, error);
    }
  }

  async sendRealtimeNotification(monitor, alertData) {
    try {
      // Send to monitor-specific room
      this.io.to(`monitor-${monitor._id}`).emit('alert', alertData);

      // Send to user-specific room (if we have user sessions)
      if (monitor.owner) {
        this.io.to(`user-${monitor.owner}`).emit('alert', alertData);
      }

      logger.debug(`Real-time notification sent for monitor ${monitor._id}`);
    } catch (error) {
      logger.error('Error sending real-time notification:', error);
    }
  }

  async sendEmailNotification(monitor, alertData) {
    if (!this.emailTransporter) {
      logger.warn('Email transporter not configured, skipping email notification');
      return;
    }

    try {
      const subject = `[${alertData.type.toUpperCase()}] ${monitor.name} - ${monitor.url}`;
      const emailContent = this.generateEmailContent(monitor, alertData);

      for (const email of monitor.notifications.email.addresses) {
        await this.emailTransporter.sendMail({
          from: process.env.SMTP_USER,
          to: email,
          subject,
          html: emailContent
        });

        logger.debug(`Email notification sent to ${email} for monitor ${monitor._id}`);
      }

    } catch (error) {
      logger.error('Error sending email notification:', error);
    }
  }

  generateEmailContent(monitor, alertData) {
    const statusColor = alertData.type === 'down' ? '#ff4444' : '#44ff44';
    const statusIcon = alertData.type === 'down' ? '🔴' : '🟢';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
          .status { display: inline-block; padding: 10px 20px; border-radius: 5px; color: white; background-color: ${statusColor}; font-weight: bold; }
          .monitor-info { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .timestamp { color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusIcon} Monitor Alert</h1>
            <div class="status">${alertData.type.toUpperCase()}</div>
          </div>
          
          <div class="monitor-info">
            <h3>Monitor Details</h3>
            <p><strong>Name:</strong> ${monitor.name}</p>
            <p><strong>URL:</strong> <a href="${monitor.url}" target="_blank">${monitor.url}</a></p>
            <p><strong>Status:</strong> ${alertData.type === 'down' ? 'Website is down' : 'Website is back online'}</p>
            <p><strong>Message:</strong> ${alertData.message}</p>
            <p class="timestamp"><strong>Time:</strong> ${alertData.timestamp.toLocaleString()}</p>
          </div>

          <div class="footer">
            <p>This alert was sent by Web3 Uptime Monitor</p>
            <p>Powered by decentralized monitoring nodes</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendWebhookNotification(monitor, alertData) {
    try {
      const payload = {
        event: 'monitor_alert',
        monitor: {
          id: monitor._id,
          name: monitor.name,
          url: monitor.url
        },
        alert: alertData,
        timestamp: alertData.timestamp.toISOString()
      };

      await axios.post(monitor.notifications.webhook.url, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Web3-Uptime-Monitor/1.0'
        }
      });

      logger.debug(`Webhook notification sent for monitor ${monitor._id}`);

    } catch (error) {
      logger.error('Error sending webhook notification:', error);
    }
  }

  async sendDiscordNotification(monitor, alertData) {
    try {
      const color = alertData.type === 'down' ? 0xff4444 : 0x44ff44;
      const title = alertData.type === 'down' ? '🔴 Website Down' : '🟢 Website Back Online';

      const embed = {
        title,
        description: alertData.message,
        color,
        fields: [
          {
            name: 'Monitor',
            value: monitor.name,
            inline: true
          },
          {
            name: 'URL',
            value: monitor.url,
            inline: true
          },
          {
            name: 'Status',
            value: alertData.type.toUpperCase(),
            inline: true
          }
        ],
        timestamp: alertData.timestamp.toISOString(),
        footer: {
          text: 'Web3 Uptime Monitor'
        }
      };

      await axios.post(monitor.notifications.discord.webhookUrl, {
        embeds: [embed]
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.debug(`Discord notification sent for monitor ${monitor._id}`);

    } catch (error) {
      logger.error('Error sending Discord notification:', error);
    }
  }

  async sendSlackNotification(monitor, alertData) {
    try {
      const color = alertData.type === 'down' ? 'danger' : 'good';
      const icon = alertData.type === 'down' ? ':red_circle:' : ':green_circle:';

      const attachment = {
        color,
        title: `${icon} ${monitor.name}`,
        title_link: monitor.url,
        text: alertData.message,
        fields: [
          {
            title: 'URL',
            value: monitor.url,
            short: true
          },
          {
            title: 'Status',
            value: alertData.type.toUpperCase(),
            short: true
          },
          {
            title: 'Time',
            value: alertData.timestamp.toLocaleString(),
            short: false
          }
        ],
        footer: 'Web3 Uptime Monitor',
        ts: Math.floor(alertData.timestamp.getTime() / 1000)
      };

      await axios.post(monitor.notifications.slack.webhookUrl, {
        attachments: [attachment]
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.debug(`Slack notification sent for monitor ${monitor._id}`);

    } catch (error) {
      logger.error('Error sending Slack notification:', error);
    }
  }

  // Send test notification to verify configuration
  async sendTestNotification(monitor, notificationType) {
    try {
      const testAlertData = {
        monitor: {
          id: monitor._id,
          name: monitor.name,
          url: monitor.url,
          status: 'test'
        },
        message: 'This is a test notification to verify your notification settings.',
        timestamp: new Date(),
        type: 'test'
      };

      switch (notificationType) {
        case 'email':
          if (monitor.notifications.email.enabled) {
            await this.sendEmailNotification(monitor, testAlertData);
          }
          break;
        case 'webhook':
          if (monitor.notifications.webhook.enabled) {
            await this.sendWebhookNotification(monitor, testAlertData);
          }
          break;
        case 'discord':
          if (monitor.notifications.discord.enabled) {
            await this.sendDiscordNotification(monitor, testAlertData);
          }
          break;
        case 'slack':
          if (monitor.notifications.slack.enabled) {
            await this.sendSlackNotification(monitor, testAlertData);
          }
          break;
        default:
          throw new Error(`Unknown notification type: ${notificationType}`);
      }

      logger.info(`Test notification sent for monitor ${monitor._id}, type: ${notificationType}`);
      return true;

    } catch (error) {
      logger.error(`Error sending test notification for monitor ${monitor._id}:`, error);
      throw error;
    }
  }

  // Send system notifications (maintenance, updates, etc.)
  async sendSystemNotification(type, message, recipients = []) {
    try {
      const systemAlert = {
        type: 'system',
        subtype: type,
        message,
        timestamp: new Date()
      };

      // Broadcast to all connected clients
      this.io.emit('systemAlert', systemAlert);

      // Send emails if recipients provided
      if (recipients.length > 0 && this.emailTransporter) {
        for (const email of recipients) {
          await this.emailTransporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: `[SYSTEM] ${type.toUpperCase()} - Web3 Uptime Monitor`,
            html: `
              <h2>System Notification</h2>
              <p><strong>Type:</strong> ${type}</p>
              <p><strong>Message:</strong> ${message}</p>
              <p><strong>Time:</strong> ${systemAlert.timestamp.toLocaleString()}</p>
            `
          });
        }
      }

      logger.info(`System notification sent: ${type}`);

    } catch (error) {
      logger.error('Error sending system notification:', error);
    }
  }
}

module.exports = NotificationService;