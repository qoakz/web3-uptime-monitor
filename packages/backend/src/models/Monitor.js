const mongoose = require('mongoose');

const monitorSchema = new mongoose.Schema({
  // Basic monitor information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  url: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Owner information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerAddress: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid Ethereum address'
    }
  },

  // Monitoring configuration
  interval: {
    type: Number,
    required: true,
    min: 60, // minimum 1 minute
    max: 86400, // maximum 24 hours
    default: 300 // 5 minutes
  },
  timeout: {
    type: Number,
    required: true,
    min: 1000, // minimum 1 second
    max: 30000, // maximum 30 seconds
    default: 10000 // 10 seconds
  },
  retryCount: {
    type: Number,
    min: 0,
    max: 5,
    default: 3
  },

  // Blockchain information
  contractRequestId: {
    type: Number,
    unique: true,
    sparse: true
  },
  rewardPerCheck: {
    type: String, // Store as string to handle big numbers
    required: true
  },

  // Status and statistics
  status: {
    type: String,
    enum: ['active', 'paused', 'inactive', 'pending'],
    default: 'pending'
  },
  isUp: {
    type: Boolean,
    default: null
  },
  lastChecked: {
    type: Date,
    default: null
  },
  lastResponseTime: {
    type: Number,
    default: null
  },
  uptime: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  totalChecks: {
    type: Number,
    default: 0
  },
  successfulChecks: {
    type: Number,
    default: 0
  },
  failedChecks: {
    type: Number,
    default: 0
  },

  // Notification settings
  notifications: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      addresses: [{
        type: String,
        validate: {
          validator: function(v) {
            return /\S+@\S+\.\S+/.test(v);
          },
          message: 'Invalid email address'
        }
      }]
    },
    webhook: {
      enabled: {
        type: Boolean,
        default: false
      },
      url: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'Invalid webhook URL'
        }
      }
    },
    discord: {
      enabled: {
        type: Boolean,
        default: false
      },
      webhookUrl: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^https:\/\/discord(app)?\.com\/api\/webhooks\/.+/.test(v);
          },
          message: 'Invalid Discord webhook URL'
        }
      }
    },
    slack: {
      enabled: {
        type: Boolean,
        default: false
      },
      webhookUrl: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^https:\/\/hooks\.slack\.com\/services\/.+/.test(v);
          },
          message: 'Invalid Slack webhook URL'
        }
      }
    }
  },

  // Assigned monitoring nodes
  assignedNodes: [{
    nodeAddress: {
      type: String,
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Recent incidents
  incidents: [{
    type: {
      type: String,
      enum: ['down', 'up', 'timeout', 'error'],
      required: true
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    duration: Number, // in milliseconds
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedAt: Date
  }],

  // Tags for organization
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],

  // Maintenance windows
  maintenanceWindows: [{
    name: String,
    startTime: Date,
    endTime: Date,
    recurring: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none'
    },
    active: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
monitorSchema.index({ owner: 1, status: 1 });
monitorSchema.index({ ownerAddress: 1 });
monitorSchema.index({ contractRequestId: 1 });
monitorSchema.index({ status: 1, lastChecked: 1 });
monitorSchema.index({ 'assignedNodes.nodeAddress': 1 });

// Virtual for current incident
monitorSchema.virtual('currentIncident').get(function() {
  return this.incidents.find(incident => !incident.resolved);
});

// Virtual for uptime percentage calculation
monitorSchema.virtual('uptimePercentage').get(function() {
  if (this.totalChecks === 0) return 100;
  return Math.round((this.successfulChecks / this.totalChecks) * 100 * 100) / 100;
});

// Methods
monitorSchema.methods.addIncident = function(type, message) {
  // Close any existing unresolved incidents
  this.incidents.forEach(incident => {
    if (!incident.resolved) {
      incident.resolved = true;
      incident.resolvedAt = new Date();
      if (incident.timestamp) {
        incident.duration = Date.now() - incident.timestamp.getTime();
      }
    }
  });

  // Add new incident
  this.incidents.push({
    type,
    message,
    timestamp: new Date()
  });

  return this.save();
};

monitorSchema.methods.resolveCurrentIncident = function() {
  const currentIncident = this.incidents.find(incident => !incident.resolved);
  if (currentIncident) {
    currentIncident.resolved = true;
    currentIncident.resolvedAt = new Date();
    if (currentIncident.timestamp) {
      currentIncident.duration = Date.now() - currentIncident.timestamp.getTime();
    }
  }
  return this.save();
};

monitorSchema.methods.isInMaintenanceWindow = function() {
  const now = new Date();
  return this.maintenanceWindows.some(window => {
    if (!window.active) return false;
    
    const start = new Date(window.startTime);
    const end = new Date(window.endTime);
    
    if (window.recurring === 'none') {
      return now >= start && now <= end;
    }
    
    // Handle recurring maintenance windows
    // This is a simplified implementation
    const nowTime = now.getHours() * 60 + now.getMinutes();
    const startTime = start.getHours() * 60 + start.getMinutes();
    const endTime = end.getHours() * 60 + end.getMinutes();
    
    return nowTime >= startTime && nowTime <= endTime;
  });
};

// Static methods
monitorSchema.statics.getActiveMonitors = function() {
  return this.find({ status: 'active' });
};

monitorSchema.statics.getMonitorsByOwner = function(ownerAddress) {
  return this.find({ ownerAddress }).sort({ createdAt: -1 });
};

monitorSchema.statics.getMonitorStats = async function(ownerId) {
  const stats = await this.aggregate([
    { $match: { owner: ownerId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        up: { $sum: { $cond: ['$isUp', 1, 0] } },
        down: { $sum: { $cond: [{ $eq: ['$isUp', false] }, 1, 0] } },
        avgUptime: { $avg: '$uptime' },
        totalChecks: { $sum: '$totalChecks' },
        successfulChecks: { $sum: '$successfulChecks' }
      }
    }
  ]);

  return stats[0] || {
    total: 0,
    active: 0,
    up: 0,
    down: 0,
    avgUptime: 100,
    totalChecks: 0,
    successfulChecks: 0
  };
};

module.exports = mongoose.model('Monitor', monitorSchema);