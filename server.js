// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// ============================================================
// CORS Configuration (UPDATED - FIX FOR CORS ERRORS)
// ============================================================
const corsOptions = {
  origin: function (origin, callback) {
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',              // Vite dev server
      'http://localhost:3000',              // React dev server
      'http://localhost:5174',              // Alternative Vite port
      'http://localhost:4173',              // Vite preview
      'https://citylawcollege.onrender.com', // Production frontend (update with your actual domain)
      'https://www.citylawcollege.com',     // Production domain (if different)
    ];

    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight requests for 10 minutes
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// ============================================================
// Body Parser Middleware
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// Serve Static Files (Uploaded Photos & Signatures)
// ============================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d', // Cache for 1 day
  setHeaders: (res, filePath) => {
    // Set proper MIME types
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    }
    // Allow cross-origin access to images
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// ============================================================
// Request Logging Middleware (Development)
// ============================================================
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================
// MongoDB Connection
// ============================================================
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
  console.log(`📊 Database: ${mongoose.connection.name}`);
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1); // Exit if database connection fails
});

// MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Error:', err);
});

// ============================================================
// Import Routes
// ============================================================
const studentRoutes = require('./routes/students');
const contactRoutes = require('./routes/contact');
const courseRoutes = require('./routes/courses');

// ============================================================
// API Routes
// ============================================================
app.use('/api/students', studentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/courses', courseRoutes);

// ============================================================
// Root Route
// ============================================================
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'City College of Management API',
    version: '2.0',
    endpoints: {
      students: '/api/students',
      registration: '/api/students/register',
      contact: '/api/contact',
      courses: '/api/courses'
    },
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// 404 Handler - Route Not Found
// ============================================================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// ============================================================
// Error Handling Middleware
// ============================================================
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }

  // Default error response
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack
    } : {}
  });
});

// ============================================================
// Graceful Shutdown
// ============================================================
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

// ============================================================
// Start Server
// ============================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 City College of Management API Server');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`📁 Static files served from: ${path.join(__dirname, 'uploads')}`);
  console.log('='.repeat(50));
  console.log('Available routes:');
  console.log(`  GET  /                    - API info`);
  console.log(`  GET  /health              - Health check`);
  console.log(`  POST /api/students/register - Student registration`);
  console.log(`  GET  /api/students/:id    - Get student details`);
  console.log(`  POST /api/contact         - Contact form`);
  console.log(`  GET  /api/courses         - Get courses`);
  console.log('='.repeat(50));
});

module.exports = app;