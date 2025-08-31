const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Authentication
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /\S+@\S+\.\S+/.test(v);
      },
      message: 'Invalid email address'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },

  // Profile information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String, // URL to avatar image
    default: null
  },

  // Web3 information
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid Ethereum address'
    }
  },
  nonce: {
    type: String,
    default: () => Math.floor(Math.random() * 1000000).toString()
  },

  // Account status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  // Subscription and usage
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free'
  },
  subscription: {
    active: {
      type: Boolean,
      default: false
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },

  // Usage limits and stats
  limits: {
    monitors: {
      type: Number,
      default: 5 // Free plan limit
    },
    checksPerMonth: {
      type: Number,
      default: 10000 // Free plan limit
    }
  },
  usage: {
    monitorsCreated: {
      type: Number,
      default: 0
    },
    checksThisMonth: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },

  // Preferences and settings
  preferences: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
      default: 'MM/DD/YYYY'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      desktop: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    }
  },

  // API access
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  apiKeyCreatedAt: Date,
  apiUsage: {
    requestsThisMonth: {
      type: Number,
      default: 0
    },
    lastRequest: Date
  },

  // Security
  twoFactorAuth: {
    enabled: {
      type: Boolean,
      default: false
    },
    secret: String,
    backupCodes: [String]
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastLogin: Date,
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      country: String,
      city: String
    }
  }],

  // Email verification and password reset
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.twoFactorAuth.secret;
      delete ret.twoFactorAuth.backupCodes;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ apiKey: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

// Virtuals
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('isFreePlan').get(function() {
  return this.plan === 'free';
});

userSchema.virtual('monitorsUsed').get(function() {
  return this.usage.monitorsCreated;
});

userSchema.virtual('checksUsed').get(function() {
  return this.usage.checksThisMonth;
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Reset usage if new month
  if (this.usage.lastResetDate) {
    const lastReset = new Date(this.usage.lastResetDate);
    const now = new Date();
    
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      this.usage.checksThisMonth = 0;
      this.usage.apiUsage.requestsThisMonth = 0;
      this.usage.lastResetDate = now;
    }
  }

  next();
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.canCreateMonitor = function() {
  return this.usage.monitorsCreated < this.limits.monitors;
};

userSchema.methods.canPerformChecks = function(additionalChecks = 1) {
  return this.usage.checksThisMonth + additionalChecks <= this.limits.checksPerMonth;
};

userSchema.methods.incrementUsage = function(type, amount = 1) {
  switch (type) {
    case 'monitors':
      this.usage.monitorsCreated += amount;
      break;
    case 'checks':
      this.usage.checksThisMonth += amount;
      break;
    case 'api':
      this.apiUsage.requestsThisMonth += amount;
      this.apiUsage.lastRequest = new Date();
      break;
  }
  return this.save();
};

userSchema.methods.addLoginAttempt = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

userSchema.methods.generateApiKey = function() {
  const crypto = require('crypto');
  this.apiKey = crypto.randomBytes(32).toString('hex');
  this.apiKeyCreatedAt = new Date();
  return this.save();
};

userSchema.methods.addLoginHistory = function(ip, userAgent, location) {
  this.loginHistory.unshift({
    ip,
    userAgent,
    location,
    timestamp: new Date()
  });

  // Keep only last 20 login records
  if (this.loginHistory.length > 20) {
    this.loginHistory = this.loginHistory.slice(0, 20);
  }

  this.lastLogin = new Date();
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByWalletAddress = function(address) {
  return this.findOne({ walletAddress: address.toLowerCase() });
};

userSchema.statics.findByApiKey = function(apiKey) {
  return this.findOne({ apiKey, isActive: true });
};

userSchema.statics.generateNonce = function() {
  return Math.floor(Math.random() * 1000000).toString();
};

module.exports = mongoose.model('User', userSchema);