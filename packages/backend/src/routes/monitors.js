const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Monitor = require('../models/Monitor');
const User = require('../models/User');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// Get all monitors for authenticated user
router.get('/', 
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'paused', 'inactive', 'pending']).withMessage('Invalid status'),
    query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search term too long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Build query
      const query = { owner: req.user.id };
      
      if (req.query.status) {
        query.status = req.query.status;
      }
      
      if (req.query.search) {
        query.$or = [
          { name: { $regex: req.query.search, $options: 'i' } },
          { url: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      const [monitors, total] = await Promise.all([
        Monitor.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('owner', 'firstName lastName email'),
        Monitor.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          monitors,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching monitors:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching monitors'
      });
    }
  }
);

// Get monitor by ID
router.get('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid monitor ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const monitor = await Monitor.findOne({
        _id: req.params.id,
        owner: req.user.id
      }).populate('owner', 'firstName lastName email');

      if (!monitor) {
        return res.status(404).json({
          success: false,
          message: 'Monitor not found'
        });
      }

      res.json({
        success: true,
        data: monitor
      });

    } catch (error) {
      logger.error('Error fetching monitor:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching monitor'
      });
    }
  }
);

// Create new monitor
router.post('/',
  auth,
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('url')
      .isURL({ protocols: ['http', 'https'] })
      .withMessage('Valid URL is required'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('interval')
      .isInt({ min: 60, max: 86400 })
      .withMessage('Interval must be between 60 and 86400 seconds'),
    body('timeout')
      .isInt({ min: 1000, max: 30000 })
      .withMessage('Timeout must be between 1000 and 30000 milliseconds'),
    body('retryCount')
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage('Retry count must be between 0 and 5'),
    body('rewardPerCheck')
      .isFloat({ min: 0.001 })
      .withMessage('Reward per check must be at least 0.001'),
    body('notifications.email.addresses')
      .optional()
      .isArray()
      .withMessage('Email addresses must be an array'),
    body('notifications.email.addresses.*')
      .optional()
      .isEmail()
      .withMessage('Invalid email address'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // Check if user can create more monitors
      const user = await User.findById(req.user.id);
      if (!user.canCreateMonitor()) {
        return res.status(403).json({
          success: false,
          message: 'Monitor limit reached for your plan'
        });
      }

      // Check for duplicate URL
      const existingMonitor = await Monitor.findOne({
        url: req.body.url,
        owner: req.user.id,
        status: { $ne: 'inactive' }
      });

      if (existingMonitor) {
        return res.status(409).json({
          success: false,
          message: 'A monitor for this URL already exists'
        });
      }

      const monitorData = {
        ...req.body,
        owner: req.user.id,
        ownerAddress: user.walletAddress,
        status: 'pending' // Will be activated after blockchain transaction
      };

      const monitor = new Monitor(monitorData);
      await monitor.save();

      // Create monitoring request on blockchain
      try {
        const requestId = await req.blockchainService.createMonitoringRequest(
          monitor.url,
          monitor.interval,
          monitor.timeout,
          monitor.rewardPerCheck
        );

        if (requestId) {
          monitor.contractRequestId = requestId;
          monitor.status = 'active';
          await monitor.save();
        }
      } catch (blockchainError) {
        logger.error('Blockchain error when creating monitor:', blockchainError);
        // Continue with database monitor, but mark as pending
        monitor.status = 'pending';
        await monitor.save();
      }

      // Add monitor to monitoring service
      try {
        await req.monitoringService.addMonitor(monitor);
      } catch (serviceError) {
        logger.error('Error adding monitor to monitoring service:', serviceError);
      }

      // Update user usage
      await user.incrementUsage('monitors');

      res.status(201).json({
        success: true,
        message: 'Monitor created successfully',
        data: monitor
      });

    } catch (error) {
      logger.error('Error creating monitor:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating monitor'
      });
    }
  }
);

// Update monitor
router.put('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid monitor ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('interval')
      .optional()
      .isInt({ min: 60, max: 86400 })
      .withMessage('Interval must be between 60 and 86400 seconds'),
    body('timeout')
      .optional()
      .isInt({ min: 1000, max: 30000 })
      .withMessage('Timeout must be between 1000 and 30000 milliseconds'),
    body('retryCount')
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage('Retry count must be between 0 and 5'),
    body('notifications')
      .optional()
      .isObject()
      .withMessage('Notifications must be an object'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const monitor = await Monitor.findOne({
        _id: req.params.id,
        owner: req.user.id
      });

      if (!monitor) {
        return res.status(404).json({
          success: false,
          message: 'Monitor not found'
        });
      }

      // Update allowed fields
      const allowedUpdates = [
        'name', 'description', 'interval', 'timeout', 'retryCount',
        'notifications', 'tags', 'maintenanceWindows'
      ];

      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          monitor[field] = req.body[field];
        }
      });

      await monitor.save();

      // Update monitoring service
      try {
        await req.monitoringService.updateMonitor(monitor);
      } catch (serviceError) {
        logger.error('Error updating monitor in monitoring service:', serviceError);
      }

      res.json({
        success: true,
        message: 'Monitor updated successfully',
        data: monitor
      });

    } catch (error) {
      logger.error('Error updating monitor:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating monitor'
      });
    }
  }
);

// Pause/Resume monitor
router.patch('/:id/toggle',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid monitor ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const monitor = await Monitor.findOne({
        _id: req.params.id,
        owner: req.user.id
      });

      if (!monitor) {
        return res.status(404).json({
          success: false,
          message: 'Monitor not found'
        });
      }

      const newStatus = monitor.status === 'active' ? 'paused' : 'active';
      monitor.status = newStatus;
      await monitor.save();

      if (newStatus === 'paused') {
        await req.monitoringService.removeMonitor(monitor._id);
      } else {
        await req.monitoringService.addMonitor(monitor);
      }

      res.json({
        success: true,
        message: `Monitor ${newStatus === 'active' ? 'resumed' : 'paused'} successfully`,
        data: { status: newStatus }
      });

    } catch (error) {
      logger.error('Error toggling monitor status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating monitor status'
      });
    }
  }
);

// Delete monitor
router.delete('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid monitor ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const monitor = await Monitor.findOne({
        _id: req.params.id,
        owner: req.user.id
      });

      if (!monitor) {
        return res.status(404).json({
          success: false,
          message: 'Monitor not found'
        });
      }

      // Deactivate on blockchain if active
      if (monitor.contractRequestId && monitor.status === 'active') {
        try {
          // In a real implementation, you would call a deactivate function
          // await req.blockchainService.deactivateMonitoringRequest(monitor.contractRequestId);
        } catch (blockchainError) {
          logger.error('Error deactivating monitor on blockchain:', blockchainError);
        }
      }

      // Remove from monitoring service
      await req.monitoringService.removeMonitor(monitor._id);

      // Delete from database
      await Monitor.deleteOne({ _id: monitor._id });

      res.json({
        success: true,
        message: 'Monitor deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting monitor:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting monitor'
      });
    }
  }
);

// Get monitor statistics
router.get('/:id/stats',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid monitor ID'),
    query('period').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid period')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const monitor = await Monitor.findOne({
        _id: req.params.id,
        owner: req.user.id
      });

      if (!monitor) {
        return res.status(404).json({
          success: false,
          message: 'Monitor not found'
        });
      }

      const period = req.query.period || '24h';
      
      // In a real implementation, you would fetch historical data
      // For now, return current stats
      const stats = {
        uptime: monitor.uptime,
        totalChecks: monitor.totalChecks,
        successfulChecks: monitor.successfulChecks,
        failedChecks: monitor.failedChecks,
        averageResponseTime: monitor.lastResponseTime,
        currentStatus: monitor.isUp,
        lastChecked: monitor.lastChecked,
        period
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error fetching monitor stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching monitor stats'
      });
    }
  }
);

// Test notifications
router.post('/:id/test-notification',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid monitor ID'),
    body('type').isIn(['email', 'webhook', 'discord', 'slack']).withMessage('Invalid notification type')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const monitor = await Monitor.findOne({
        _id: req.params.id,
        owner: req.user.id
      });

      if (!monitor) {
        return res.status(404).json({
          success: false,
          message: 'Monitor not found'
        });
      }

      await req.notificationService.sendTestNotification(monitor, req.body.type);

      res.json({
        success: true,
        message: 'Test notification sent successfully'
      });

    } catch (error) {
      logger.error('Error sending test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending test notification'
      });
    }
  }
);

module.exports = router;