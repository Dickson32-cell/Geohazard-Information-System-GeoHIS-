require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import database
const { sequelize } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const serviceRoutes = require('./routes/services');
const contactRoutes = require('./routes/contact');
const settingsRoutes = require('./routes/settings');
const imageRoutes = require('./routes/images');
const galleryRoutes = require('./routes/gallery');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5002;

// Basic CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5178'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/gallery', galleryRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    console.log('Attempting database connection...');

    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully.');

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Gallery API: http://localhost:${PORT}/api/v1/gallery`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await sequelize.close();
          console.log('Database connection closed.');
        } catch (err) {
          console.error('Error closing database:', err);
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Unable to start server:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

startServer();