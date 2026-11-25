const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { createClient } = require('redis');
const connectDB = require('./config/db.js');

// Force IPv4 first DNS lookup order to prevent ENETUNREACH IPv6 errors on cloud hosts like Render
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();

const redisUrl = process.env.REDIS_URL;
const isProduction = process.env.NODE_ENV === 'production';

if (!redisUrl && isProduction) {
  throw new Error('REDIS_URL must be configured in production for shared rate limiting.');
}

let redisClient;
if (redisUrl) {
  redisClient = createClient({
    url: redisUrl,
    disableOfflineQueue: true,
  });
  redisClient.on('error', (error) => {
    console.error('Redis client error:', error);
  });
} else {
  console.warn('REDIS_URL is not set; using in-memory rate limiting for local development.');
}

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());


const createRateLimitStore = (prefix) => {
  if (!redisClient) return undefined;

  return new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix,
  });
};

function configureRoutes() {
  // Separate prefixes keep the global and authentication counters independent in Redis.
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes ka window
    max: 100, // Har IP se 15 minute me max 100 requests allow hongi
    standardHeaders: true, // `RateLimit-*` headers return karega
    legacyHeaders: false, // `X-RateLimit-*` headers disable karega
    store: createRateLimitStore('universe:rate-limit:global:'),
    message: {
      status: 429,
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per 15 minutes.
    store: createRateLimitStore('universe:rate-limit:auth:'),
    message: { message: 'Too many auth requests from this IP, please try again after 15 minutes' },
  });

  app.use('/api', globalLimiter);
  app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
  app.use('/api/students', require('./routes/studentRoutes'));
  app.use('/api/colleges', require('./routes/collegeRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      app: 'UNIVERSE API',
      timestamp: new Date(),
    });
  });

  app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err.stack);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  });
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (redisClient) {
    await redisClient.connect();
    console.log('Connected to Redis for shared rate limiting.');
  }

  configureRoutes();

  const server = app.listen(PORT, () => {
    console.log(`UNIVERSE Backend Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  const shutdown = () => {
    server.close(async (error) => {
      if (error) {
        console.error('Failed to close the HTTP server cleanly:', error);
        process.exitCode = 1;
      }

      if (redisClient && redisClient.isOpen) {
        try {
          await redisClient.quit();
        } catch (quitError) {
          console.error('Failed to close the Redis connection cleanly:', quitError);
          process.exitCode = 1;
        }
      }
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

startServer().catch((error) => {
  console.error('Failed to start the API server:', error);
  process.exit(1);
});
