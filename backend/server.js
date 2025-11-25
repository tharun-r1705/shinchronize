require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const studentRoutes = require('./routes/studentRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const adminRoutes = require('./routes/adminRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const seedDemoData = require('./utils/seedData');

const app = express();

const isProd = process.env.NODE_ENV === 'production';
const isVercel = Boolean(process.env.VERCEL);
let dbConnectionPromise = null;

const connectToDatabase = () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  if (mongoose.connection.readyState >= 1) {
    return Promise.resolve();
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true,
    }).then(() => {
      if (!isProd) {
        console.log('✅ Connected to MongoDB Atlas');
      }
    }).catch((error) => {
      dbConnectionPromise = null;
      console.error('❌ MongoDB connection error:', error.message);
      throw error;
    });
  }

  return dbConnectionPromise;
};

// Ensure we connect to the database before handling any request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
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
app.use('/api/interviews', interviewRoutes);

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
