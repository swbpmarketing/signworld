const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars - override any existing environment variables
dotenv.config({ path: require('path').join(__dirname, '.env'), override: true });

// Debug AWS configuration
console.log('AWS Configuration:');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);

// Debug: Log environment and email configuration
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Email Configuration Loaded:');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

// Track database connection status
let dbConnected = false;

// Connect to database asynchronously without blocking server startup
connectDB().then(() => {
  dbConnected = true;
  console.log('✅ Database connected successfully');
}).catch((err) => {
  console.error('❌ Database connection failed:', err.message);
  console.warn('⚠️  Server will continue without database');
});

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173', // Allow 127.0.0.1 as well as localhost
      'https://sign-company.onrender.com',
      'https://customadesign.github.io'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // For now, allow all origins in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Explicit OPTIONS handler for all API routes
app.options('*', cors(corsOptions));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint - responds immediately for Render health checks
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    server: 'running',
    database: dbConnected ? 'connected' : 'connecting',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 5000
  });
});

// Test endpoint to verify deployment
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Debug endpoint to check if routes are loaded
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Direct routes
      routes.push({
        path: middleware.route.path,
        method: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const prefix = middleware.regexp.source
            .replace('\\/', '/')
            .replace('/?(?=\\/|$)', '')
            .replace(/\\/g, '/')
            .replace('^', '')
            .replace('$', '');
          routes.push({
            path: prefix + handler.route.path,
            method: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    message: 'Available routes',
    totalRoutes: routes.length,
    routes: routes.filter(r => r.path.includes('/api/')),
    ownersRoutes: routes.filter(r => r.path.includes('/owners'))
  });
});

// Routes - These must come AFTER static file serving but BEFORE catch-all
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/events', require('./routes/events'));
app.use('/api/conventions', require('./routes/conventions'));
app.use('/api/brags', require('./routes/brags'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/library', require('./routes/library'));
app.use('/api/owners', require('./routes/owners'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/faqs', require('./routes/faqs'));
app.use('/api/search', require('./routes/search'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/email', require('./routes/email'));
app.use('/api/chat', require('./routes/chat'));

// Add API route debugging
app.use('/api/*', (req, res, next) => {
  console.log(`API Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error',
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../frontend/dist');
  console.log('Serving static files from:', staticPath);

  // Only serve static files for non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      // Skip static file serving for API routes
      return next();
    }
    express.static(staticPath)(req, res, next);
  });

  // SPA catch-all handler MUST come last
  app.get('*', (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api/')) {
      const indexPath = path.join(__dirname, '../frontend/dist/index.html');
      console.log('Serving index.html from:', indexPath);
      res.sendFile(indexPath);
    } else {
      // If we reach here, it means an API route wasn't found
      res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    }
  });
}

// Use environment PORT (for Render) or default to 5000
const PORT = process.env.PORT || 5000;

// Start server immediately - don't wait for database
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`✅ Server successfully started on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 API available at: http://localhost:${PORT}/api`);
  console.log('='.repeat(50));
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});
