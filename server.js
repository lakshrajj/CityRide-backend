const app = require('./app');
const mongoose = require('mongoose');
const config = require('./config/db');
const logger = require('./utils/logger');

// Set up MongoDB connection
mongoose.connect(config.mongoURI)
  .then(() => {
    logger.info('MongoDB connected successfully');
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = server;
