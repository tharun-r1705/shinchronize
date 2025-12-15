const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('http');

const studentRoutes = require('./routes/studentRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const adminRoutes = require('./routes/adminRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const githubRoutes = require('./routes/githubRoutes');
const googleRoutes = require('./routes/googleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const seedDemoData = require('./utils/seedData');
const { initializeWebSocket } = require('./utils/websocket');

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

// Middleware setup
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(isProd ? 'combined' : 'dev'));

// Health check endpoint (no DB required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'EvolvEd API', timestamp: new Date().toISOString() });
});

// OAuth routes (no DB required for initial OAuth flow)
app.use('/api/github', githubRoutes);
app.use('/api/google', googleRoutes);

// Connect to database before other routes
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

// Other routes (require DB)
app.use('/api/students', studentRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/gamification', gamificationRoutes);

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
    }

    const PORT = process.env.PORT || 5000;
    const server = http.createServer(app);
    
    // Initialize WebSocket
    const io = initializeWebSocket(server);
    app.set('io', io);
    
    server.listen(PORT, () => {
      console.log(`🚀 EvolvEd backend running on port ${PORT}`);
      console.log(`🔌 WebSocket server ready`);
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
