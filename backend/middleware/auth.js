const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }
};

// Optional protect - sets req.user if token present, but doesn't block unauthenticated requests
exports.optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // No token, continue without user
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    next();
  } catch (err) {
    // Invalid token, continue without user
    next();
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

/**
 * Handle preview mode validation and setup
 * Must be used AFTER protect middleware
 * Usage: router.get('/path', protect, handlePreviewMode, handler)
 */
exports.handlePreviewMode = async (req, res, next) => {
  const previewUserId = req.headers['x-preview-user-id'];

  // No preview header = normal operation
  if (!previewUserId) {
    req.previewMode = {
      active: false,
      adminUser: null,
      previewUser: null,
    };
    return next();
  }

  // Preview header present - require authenticated user
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required for preview mode',
    });
  }

  // Validate admin status
  if (req.user.role !== 'admin') {
    console.warn(`Non-admin user ${req.user.id} attempted preview mode access`);
    return res.status(403).json({
      success: false,
      error: 'Preview mode is only available to administrators',
    });
  }

  try {
    // Validate preview user exists
    const previewUser = await User.findById(previewUserId);

    if (!previewUser) {
      return res.status(404).json({
        success: false,
        error: 'Preview user not found',
      });
    }

    // Prevent admin-to-admin preview (security risk)
    if (previewUser.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot preview other admin accounts',
      });
    }

    // Prevent previewing inactive users
    if (!previewUser.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Cannot preview inactive user accounts',
      });
    }

    // Set preview context on request object
    req.previewMode = {
      active: true,
      adminUser: req.user,        // Original admin user
      previewUser: previewUser,    // User being previewed
    };

    // Determine resource type from URL path
    const resourceTypeMap = {
      '/api/dashboard': 'dashboard',
      '/api/equipment': 'equipment',
      '/api/chat': 'chat',
      '/api/forum': 'forum',
      '/api/brags': 'brags',
      '/api/auth': 'auth',
      '/api/settings': 'settings',
      '/api/equipment-stats': 'stats',
    };

    let resourceType = 'other';
    for (const [path, type] of Object.entries(resourceTypeMap)) {
      if (req.path.startsWith(path)) {
        resourceType = type;
        break;
      }
    }

    // Log preview mode action (async, non-blocking)
    const { logPreviewAction } = require('../services/auditLogService');
    logPreviewAction({
      adminUserId: req.user._id,
      previewedUserId: previewUser._id,
      action: determineAction(req.method, req.path),
      resourceType: resourceType,
      endpoint: `${req.method} ${req.path}`,
      httpMethod: req.method,
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    }).catch(err => {
      console.error('Audit logging failed:', err);
      // Continue execution even if logging fails
    });

    next();
  } catch (error) {
    console.error('Preview mode validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate preview mode',
    });
  }
};

/**
 * Helper function to determine audit action from request
 */
function determineAction(method, path) {
  // Write operations should be blocked elsewhere
  if (method !== 'GET') {
    return 'blocked_write';
  }

  // Map paths to specific actions
  if (path.includes('/dashboard')) return 'view_dashboard';
  if (path.includes('/profile') || path.includes('/auth/me')) return 'view_profile';
  if (path.includes('/equipment')) return 'view_equipment';
  if (path.includes('/chat')) return 'view_chat';
  if (path.includes('/forum')) return 'view_forum';
  if (path.includes('/brags')) return 'view_brags';
  if (path.includes('/stats')) return 'view_stats';

  return 'view_data';
}

/**
 * Block write operations in preview mode
 * Must be used AFTER handlePreviewMode
 * Usage: router.put('/path', protect, handlePreviewMode, blockPreviewWrites, handler)
 */
exports.blockPreviewWrites = (req, res, next) => {
  if (req.previewMode && req.previewMode.active) {
    // Log the blocked write attempt
    const { logPreviewAction } = require('../services/auditLogService');
    logPreviewAction({
      adminUserId: req.previewMode.adminUser._id,
      previewedUserId: req.previewMode.previewUser._id,
      action: 'blocked_write',
      resourceType: 'other',
      endpoint: `${req.method} ${req.path}`,
      httpMethod: req.method,
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        requestBody: req.body,
        errorMessage: 'Write operation blocked in preview mode',
      },
    }).catch(err => console.error('Audit logging failed:', err));

    return res.status(403).json({
      success: false,
      error: 'Write operations are not allowed in preview mode',
    });
  }
  next();
};