const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { db } = require('./config/firebase');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

// Logging configuration
if (process.env.NODE_ENV === 'production') {
  // Production logging to file
  const logPath = path.join(__dirname, 'logs');
  
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath);
  }
  
  app.use(morgan('combined', {
    stream: fs.createWriteStream(path.join(logPath, 'access.log'), { flags: 'a' })
  }));
} else {
  // Development logging to console
  app.use(morgan('dev'));
}

// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/payments', require('./routes/payments'));

app.get('/', async (req, res) => {
  res.json({
    message: 'Welcome to Pi-Server'
  });
});

// Health check endpoint
app.get('/on', async (req, res) => {
  try {
    // console.log(process.env.API_KEY, process.env.AUTH_DOMAIN, process.env.PROJECT_ID, process.env.STORAGE_BUCKET, process.env.MSG_SNDR_ID, process.env.APP_ID, process.env.MEASUREMENT_ID)
    // Check Firebase connection
    await db.collection('users').limit(1).get();
    
    res.json({
      status: 'healthy',
      firebase: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Error handling
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Received shutdown signal. Closing connections...');
  
  try {
    
    // Firebase Admin SDK doesn't require explicit cleanup
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS: Allowing requests from ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

module.exports = app;