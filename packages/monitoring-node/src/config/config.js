require('dotenv').config();

const config = {
  // Node configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  NODE_ADDRESS: process.env.NODE_ADDRESS || 'auto-generate',
  NODE_NAME: process.env.NODE_NAME || `node-${Math.random().toString(36).substr(2, 9)}`,
  NODE_LOCATION: process.env.NODE_LOCATION || 'Unknown',
  
  // Blockchain configuration
  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  REWARD_TOKEN_ADDRESS: process.env.REWARD_TOKEN_ADDRESS,
  
  // Backend API configuration
  BACKEND_API_URL: process.env.BACKEND_API_URL || 'http://localhost:3001',
  API_KEY: process.env.API_KEY,
  
  // Monitoring configuration
  MAX_CONCURRENT_CHECKS: parseInt(process.env.MAX_CONCURRENT_CHECKS) || 10,
  DEFAULT_TIMEOUT: parseInt(process.env.DEFAULT_TIMEOUT) || 10000,
  RETRY_ATTEMPTS: parseInt(process.env.RETRY_ATTEMPTS) || 3,
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY) || 1000,
  
  // Performance configuration
  CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL) || 30000, // 30 seconds
  BLOCKCHAIN_SYNC_INTERVAL: parseInt(process.env.BLOCKCHAIN_SYNC_INTERVAL) || 60000, // 1 minute
  HEARTBEAT_INTERVAL: parseInt(process.env.HEARTBEAT_INTERVAL) || 30000, // 30 seconds
  
  // Staking configuration
  MINIMUM_STAKE: process.env.MINIMUM_STAKE || '1000', // 1000 tokens
  AUTO_STAKE: process.env.AUTO_STAKE === 'true',
  
  // Logging configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'monitoring-node.log',
  
  // Network configuration
  USER_AGENT: 'Web3-Uptime-Monitor-Node/1.0',
  MAX_REDIRECTS: parseInt(process.env.MAX_REDIRECTS) || 5,
  
  // Health check configuration
  HEALTH_CHECK_PORT: parseInt(process.env.HEALTH_CHECK_PORT) || 3002,
  ENABLE_HEALTH_SERVER: process.env.ENABLE_HEALTH_SERVER !== 'false',
  
  // Error handling
  MAX_ERROR_RATE: parseFloat(process.env.MAX_ERROR_RATE) || 0.1, // 10%
  ERROR_THRESHOLD_WINDOW: parseInt(process.env.ERROR_THRESHOLD_WINDOW) || 3600000, // 1 hour
};

// Validation
if (!config.PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

if (!config.CONTRACT_ADDRESS) {
  throw new Error('CONTRACT_ADDRESS environment variable is required');
}

if (!config.REWARD_TOKEN_ADDRESS) {
  throw new Error('REWARD_TOKEN_ADDRESS environment variable is required');
}

module.exports = config;