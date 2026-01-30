require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const studentRoutes = require('./routes/studentRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const adminRoutes = require('./routes/adminRoutes');
const agentRoutes = require('./routes/agentRoutes');
const marketRoutes = require('./routes/marketRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const ttsRoutes = require('./routes/ttsRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');

const seedDemoData = require('./utils/seedData');
const seedMarketData = require('./utils/seedMarketData');
const { initializeMarketRefreshCron } = require('./jobs/marketDataRefresher');

const app = express();

const isProd = process.env.NODE_ENV === 'production';
const isVercel = Boolean(process.env.VERCEL);
let cachedDb = null;

const connectToDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedDb = db;
    if (!isProd) {
      console.log('✅ Connected to MongoDB Atlas');
    }
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    cachedDb = null;
    throw error;
  }
};

// Connect to database on first request
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectToDatabase();
    }
    next();
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProd ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'EvolvEd API', timestamp: new Date().toISOString() });
});


app.use('/api/students', studentRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/roadmap', roadmapRoutes);

app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const startServer = async () => {
  try {
    await connectToDatabase();

    if (process.env.SEED_DEMO_DATA === 'true') {
      await seedDemoData();
      await seedMarketData();
    }

    // Initialize market data refresh cron job
    initializeMarketRefreshCron();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 EvolvEd backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

if (!isVercel) {
  startServer();
}

module.exports = app;
