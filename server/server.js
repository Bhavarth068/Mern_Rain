/**
 * Rain Forecasting System — Express Server
 * =========================================
 * Entry point for the Node.js backend.
 * Connects to MongoDB Atlas, mounts all routes,
 * and starts the HTTP server.
 */

require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const cron       = require('node-cron');
const winston    = require('winston');

// ─── Routes ─────────────────────────────────────────────────────────────────
const weatherRoutes    = require('./routes/weather.routes');
const predictRoutes    = require('./routes/predict.routes');
const historyRoutes    = require('./routes/history.routes');
const authRoutes       = require('./routes/auth.routes');
const alertRoutes      = require('./routes/alert.routes');

// ─── Services ───────────────────────────────────────────────────────────────
const weatherFetchJob  = require('./services/weatherFetch.service');

// ─── Logger ─────────────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) =>
      `${timestamp} [${level}]: ${message}`
    )
  ),
  transports: [new winston.transports.Console()]
});

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ─────────────────────────────────────────────────────
app.set('trust proxy', 1); 
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ─── General Middleware ──────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/weather',  weatherRoutes);
app.use('/api/predict',  predictRoutes);
app.use('/api/history',  historyRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/alerts',   alertRoutes);

// ─── Root & Health ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message:   '🌧️ Rain Forecasting System API',
    version:   '1.0.0',
    status:    'running',
    endpoints: ['/api/weather', '/api/predict', '/api/history', '/api/auth', '/api/alerts']
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status:    'healthy',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
    db:        mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(err.status || 500).json({
    error:   err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── Database Connection & Server Start ──────────────────────────────────────
async function startServer() {
  try {
    // Force Mongoose to connect to the provided URI
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    
    logger.info('✅ MongoDB Atlas connected successfully');

    // Start scheduled weather data fetch (every 30 minutes)
    cron.schedule('*/30 * * * *', () => {
      logger.info('⏰ Running scheduled weather fetch...');
      weatherFetchJob.fetchAndStore();
    });

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error(`❌ DATABASE CONNECTION ERROR: ${err.message}`);
    logger.error('The server will not start without a valid database connection.');
    process.exit(1);
  }
}

// ─── Global Unhandled Error Listeners ──────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
});

startServer();
module.exports = app;
