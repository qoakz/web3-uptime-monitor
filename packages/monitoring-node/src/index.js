const MonitoringNode = require('./services/MonitoringNode');
const logger = require('./utils/logger');
const config = require('./config/config');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
let node = null;

const shutdown = async () => {
  logger.info('Shutting down monitoring node...');
  
  if (node) {
    await node.stop();
  }
  
  logger.info('Monitoring node stopped');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Main function
async function main() {
  try {
    logger.info('Starting Web3 Uptime Monitoring Node');
    logger.info(`Node Address: ${config.NODE_ADDRESS}`);
    logger.info(`Environment: ${config.NODE_ENV}`);
    
    // Create and start monitoring node
    node = new MonitoringNode(config);
    await node.start();
    
    logger.info('Monitoring node started successfully');
    
  } catch (error) {
    logger.error('Failed to start monitoring node:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main();
}

module.exports = { main };