require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cron = require('node-cron');

const { sequelize } = require('./src/config/database');
const logger = require('./src/utils/logger');
const { checkInactiveTrolleys } = require('./src/jobs/inactivityCheck');
const { checkTrolleyShortages } = require('./src/jobs/shortageCheck');
const { checkOverdueTrolleys } = require('./src/jobs/overdueCheck');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const trolleyRoutes = require('./src/routes/trolleyRoutes');
const storeRoutes = require('./src/routes/storeRoutes');
const maintenanceRoutes = require('./src/routes/maintenanceRoutes');
const alertRoutes = require('./src/routes/alertRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const gpsRoutes = require('./src/routes/gpsRoutes');
const xsCardRoutes = require('./src/routes/xsCardRoutes');
const kioskDashboardRoutes = require('./src/routes/kioskDashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// Compression middleware - Compress all responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9, 6 is default)
  threshold: 1024 // Only compress responses larger than 1kb
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - More lenient in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // 1000 requests in dev, 100 in prod
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trolleys', trolleyRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/xs-card', xsCardRoutes);
app.use('/api/kiosk-dashboard', kioskDashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// CRON Jobs
if (process.env.NODE_ENV !== 'test') {
  // Check for inactive trolleys daily at midnight
  const cronSchedule = process.env.CRON_SCHEDULE || '0 0 * * *';
  cron.schedule(cronSchedule, async () => {
    logger.info('Running inactivity check job');
    try {
      await checkInactiveTrolleys();
      logger.info('Inactivity check completed');
    } catch (error) {
      logger.error('Inactivity check failed:', error);
    }
  });

  // Check for trolley shortages every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running shortage check job');
    try {
      await checkTrolleyShortages();
      logger.info('Shortage check completed');
    } catch (error) {
      logger.error('Shortage check failed:', error);
    }
  });

  // Check for overdue trolley checkouts every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running overdue trolley check job');
    try {
      await checkOverdueTrolleys();
      logger.info('Overdue check completed');
    } catch (error) {
      logger.error('Overdue check failed:', error);
    }
  });

  logger.info('CRON jobs initialized (inactivity, shortage, overdue)');
}

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync database (in development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('Database synchronized');
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`CartSaver API server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server gracefully');
  await sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;
