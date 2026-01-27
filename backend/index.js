const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { initConventionReminderJob } = require('./jobs/conventionReminders');
const presenceService = require('./utils/presenceService');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Load env vars - override any existing environment variables
dotenv.config({ path: require('path').join(__dirname, '.env'), override: true });

// Track database connection status
let dbConnected = false;

// Auto-cleanup function for deleted files older than 30 days
const cleanupDeletedFiles = async () => {
  try {
    const LibraryFile = require('./models/LibraryFile');
    const { deleteFromS3 } = require('./utils/s3');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find files deleted more than 30 days ago
    const expiredFiles = await LibraryFile.find({
      deletedAt: { $ne: null, $lt: thirtyDaysAgo }
    });

    if (expiredFiles.length > 0) {
      console.log(`🗑️  Found ${expiredFiles.length} files to permanently delete (older than 30 days)`);

      for (const file of expiredFiles) {
        try {
          // Delete from S3 if URL exists
          if (file.fileUrl) {
            await deleteFromS3(file.fileUrl);
          }
          // Delete from database
          await LibraryFile.findByIdAndDelete(file._id);
          console.log(`   ✓ Permanently deleted: ${file.title}`);
        } catch (err) {
          console.error(`   ✗ Failed to delete ${file.title}:`, err.message);
        }
      }

      console.log('🗑️  Cleanup completed');
    }
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  }
};

// Connect to database asynchronously without blocking server startup
connectDB().then(() => {
  dbConnected = true;
  console.log('✅ Database connected successfully');

  // Run cleanup on startup
  cleanupDeletedFiles();

  // Schedule cleanup to run every 24 hours
  setInterval(cleanupDeletedFiles, 24 * 60 * 60 * 1000);
  console.log('🕐 Scheduled auto-cleanup for deleted files (runs every 24 hours)');

  // Initialize convention reminder job
  initConventionReminderJob();
}).catch((err) => {
  console.error('❌ Database connection failed:', err.message);
  console.warn('⚠️  Server will continue without database');
});

const app = express();

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178',
      'http://localhost:5179',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:5176',
      'http://127.0.0.1:5177',
      'http://127.0.0.1:5178',
      'http://127.0.0.1:5179',
      'https://sign-company.onrender.com',
      'https://customadesign.github.io'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket.io connection handling with presence tracking
io.on('connection', async (socket) => {
  let userId = null;

  // Try to authenticate immediately if token is in handshake
  const authenticateUser = async (token) => {
    try {
      if (!token) {
        return false;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name email role');
      
      if (!user) {
        return false;
      }

      userId = user._id.toString();
      socket.userId = userId;

      // Set user as online
      presenceService.setOnline(userId, socket.id);

      // Join user's personal room
      socket.join(`user:${userId}`);
      socket.join(`chat:${userId}`);

      // Broadcast presence update to all connected clients
      io.emit('presence:update', {
        userId,
        status: 'online',
      });

      return true;
    } catch (error) {
      return false;
    }
  };

  // Try to authenticate from handshake auth token
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token) {
    await authenticateUser(token);
  }

  // Also allow manual authentication
  socket.on('authenticate', async (token) => {
    const success = await authenticateUser(token);
    if (success) {
      socket.emit('auth:success', { userId });
    } else {
      socket.emit('auth:error', { message: 'Authentication failed' });
    }
  });

  // Handle user activity (heartbeat)
  socket.on('presence:activity', () => {
    if (userId) {
      const update = presenceService.updateActivity(userId);
      if (update && update.wasIdle) {
        // User became active again (was idle) - broadcast update
        io.emit('presence:update', {
          userId,
          status: 'online',
        });
      }
    }
  });

  // Join brags room for real-time updates
  socket.on('join:brags', () => {
    socket.join('brags');
  });

  // Leave brags room
  socket.on('leave:brags', () => {
    socket.leave('brags');
  });

  // Join forum room for real-time updates
  socket.on('join:forum', () => {
    socket.join('forum');
  });

  // Leave forum room
  socket.on('leave:forum', () => {
    socket.leave('forum');
  });

  // Join specific forum thread room
  socket.on('join:thread', (threadId) => {
    socket.join(`thread:${threadId}`);
  });

  // Leave specific forum thread room
  socket.on('leave:thread', (threadId) => {
    socket.leave(`thread:${threadId}`);
  });

  // Join chat room for real-time messages (user-specific room)
  socket.on('join:chat', (userId) => {
    socket.join(`chat:${userId}`);
  });

  // Leave chat room
  socket.on('leave:chat', (userId) => {
    socket.leave(`chat:${userId}`);
  });

  // Join specific conversation room
  socket.on('join:conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  // Leave specific conversation room
  socket.on('leave:conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // Join user-specific room for notifications
  socket.on('join:user', (userId) => {
    socket.join(`user:${userId}`);
  });

  // Leave user-specific room
  socket.on('leave:user', (userId) => {
    socket.leave(`user:${userId}`);
  });

  // Join equipment room for real-time updates
  socket.on('join:equipment', () => {
    socket.join('equipment');
  });

  // Leave equipment room
  socket.on('leave:equipment', () => {
    socket.leave('equipment');
  });

  // Join videos room for real-time updates
  socket.on('join:videos', () => {
    socket.join('videos');
  });

  // Leave videos room
  socket.on('leave:videos', () => {
    socket.leave('videos');
  });

  // Join events room for real-time updates
  socket.on('join:events', () => {
    socket.join('events');
  });

  // Leave events room
  socket.on('leave:events', () => {
    socket.leave('events');
  });

  socket.on('disconnect', () => {
    // Find user by socket ID if userId wasn't set (in case of connection issues)
    if (!userId) {
      userId = presenceService.getUserBySocketId(socket.id);
    }

    // Mark user as offline if they were authenticated
    if (userId) {
      presenceService.setOffline(userId);

      // Broadcast presence update to all connected clients
      io.emit('presence:update', {
        userId,
        status: 'offline',
      });
    }
  });
});

// Set up idle check that broadcasts status changes
setInterval(() => {
  presenceService.checkIdleUsers((update) => {
    io.emit('presence:update', update);
  });
}, 60 * 1000); // Check every minute

// Body parser middleware with increased limits for file uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Enable CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178',
      'http://localhost:5179',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:5176',
      'http://127.0.0.1:5177',
      'http://127.0.0.1:5178',
      'http://127.0.0.1:5179',
      'https://sign-company.onrender.com',
      'https://customadesign.github.io'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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
app.use('/api/folders', require('./routes/folders'));
app.use('/api/owners', require('./routes/owners'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/faqs', require('./routes/faqs'));
app.use('/api/search', require('./routes/search'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/email', require('./routes/email'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/equipment-stats', require('./routes/equipmentStats'));
app.use('/api/bug-reports', require('./routes/bugReports'));
app.use('/api/activity', require('./routes/activity'));

// Handle API 404s
app.use('/api/*', (req, res, next) => {
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
server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`✅ Server successfully started on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 API available at: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.io ready for real-time connections`);
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
