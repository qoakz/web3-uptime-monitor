const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const monitorRoutes = require('./routes/monitors');
const nodeRoutes = require('./routes/nodes');
const statsRoutes = require('./routes/stats');

// Service imports
const BlockchainService = require('./services/blockchainService');
const MonitoringService = require('./services/monitoringService');
const NotificationService = require('./services/notificationService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Connect to database
connectDB();

// Initialize services
const blockchainService = new BlockchainService();
const monitoringService = new MonitoringService(io);
const notificationService = new NotificationService(io);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Make services available to routes
app.use((req, res, next) => {
  req.blockchainService = blockchainService;
  req.monitoringService = monitoringService;
  req.notificationService = notificationService;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/monitors', monitorRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/stats', statsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-monitor', (monitorId) => {
    socket.join(`monitor-${monitorId}`);
    logger.info(`Client ${socket.id} joined monitor ${monitorId}`);
  });

  socket.on('leave-monitor', (monitorId) => {
    socket.leave(`monitor-${monitorId}`);
    logger.info(`Client ${socket.id} left monitor ${monitorId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Initialize blockchain service (optional for development)
if (process.env.PRIVATE_KEY && process.env.CONTRACT_ADDRESS) {
  blockchainService.initialize().then(() => {
    logger.info('Blockchain service initialized');
  }).catch(error => {
    logger.error('Failed to initialize blockchain service:', error);
  });
} else {
  logger.info('Blockchain service skipped - missing environment variables');
}

// Start monitoring service (optional for development)
try {
  monitoringService.start();
  logger.info('Monitoring service started');
} catch (error) {
  logger.error('Failed to start monitoring service:', error);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = { app, server, io };