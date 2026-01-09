const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    // WHO performed the action
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // WHO was being previewed (the impersonated user)
    previewedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // WHAT action was performed
    action: {
      type: String,
      required: true,
      enum: [
        'preview_started',      // Initial preview mode entry
        'view_data',           // General data viewing
        'view_dashboard',      // Dashboard access
        'view_profile',        // Profile viewing
        'view_equipment',      // Equipment data access
        'view_chat',          // Chat/messages access
        'view_forum',         // Forum threads access
        'view_brags',         // Brags/success stories access
        'view_stats',         // Statistics viewing
        'blocked_write',      // Attempted write operation (blocked)
      ],
      index: true,
    },

    // WHERE in the application
    resourceType: {
      type: String,
      enum: ['dashboard', 'equipment', 'chat', 'forum', 'brags', 'profile', 'stats', 'auth', 'settings', 'other'],
      required: true,
    },

    // WHAT resource was accessed
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    // Request details
    endpoint: {
      type: String,  // e.g., "GET /api/dashboard/stats"
      required: true,
    },

    httpMethod: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      required: true,
    },

    // Additional context
    metadata: {
      ipAddress: String,
      userAgent: String,
      requestBody: mongoose.Schema.Types.Mixed,  // Store for blocked writes
      errorMessage: String,  // If action was blocked
    },

    // WHEN
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,  // Using custom timestamp field
  }
);

// Compound indexes for efficient queries
auditLogSchema.index({ adminUserId: 1, timestamp: -1 });
auditLogSchema.index({ previewedUserId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index - auto-delete logs older than 2 years (compliance requirement)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
