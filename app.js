const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
const fs = require('fs');
const path = require('path');
const { db, auth } = require('./config/firebase');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

// Initialize Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  legacyMode: false
});

// Redis error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Redis connection handling
redisClient.on('connect', () => {
  console.log('Connected to Redis successfully');
});

// Connect to Redis
(async () => {
  await redisClient.connect().catch(console.error);
})();

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

// Session configuration with Redis
app.use(session({
  store: new RedisStore({ 
    client: redisClient,
    prefix: 'session:',
    ttl: 86400 // 24 hours in seconds
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/payments', require('./routes/payments'));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Firebase connection
    await db.collection('users').limit(1).get();
    
    // Check Redis connection
    const isRedisConnected = redisClient.isOpen;
    
    res.json({
      status: 'healthy',
      firebase: 'connected',
      redis: isRedisConnected ? 'connected' : 'disconnected'
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
    // Close Redis connection
    await redisClient.quit();
    console.log('Redis connection closed');
    
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