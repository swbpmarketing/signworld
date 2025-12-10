const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Platform Settings
  platformName: {
    type: String,
    default: 'Sign Company Dashboard',
    trim: true,
  },
  supportEmail: {
    type: String,
    default: 'support@signcompany.com',
    lowercase: true,
  },

  // Security Settings
  requireStrongPasswords: {
    type: Boolean,
    default: true,
  },
  autoApproveOwners: {
    type: Boolean,
    default: false,
  },
  requireLibraryApproval: {
    type: Boolean,
    default: true,
  },

  // Content Settings
  maxFileUploadSize: {
    type: Number,
    default: 50, // MB
    min: 1,
    max: 500,
  },
  itemsPerPage: {
    type: Number,
    default: 20,
    min: 5,
    max: 100,
  },

  // Feature Flags
  enableChat: {
    type: Boolean,
    default: true,
  },
  enableForum: {
    type: Boolean,
    default: true,
  },
  enableEquipmentMarketplace: {
    type: Boolean,
    default: true,
  },
  enableLibrary: {
    type: Boolean,
    default: true,
  },

  // Role Permissions - What each user type can access
  rolePermissions: {
    owner: {
      canAccessDashboard: { type: Boolean, default: true },
      canAccessLibrary: { type: Boolean, default: true },
      canUploadToLibrary: { type: Boolean, default: true },
      canAccessForum: { type: Boolean, default: true },
      canPostInForum: { type: Boolean, default: true },
      canAccessChat: { type: Boolean, default: true },
      canAccessEvents: { type: Boolean, default: true },
      canAccessEquipment: { type: Boolean, default: true },
      canListEquipment: { type: Boolean, default: true },
      canAccessBrags: { type: Boolean, default: true },
      canPostBrags: { type: Boolean, default: true },
      canAccessVideos: { type: Boolean, default: true },
      canAccessDirectory: { type: Boolean, default: true },
      canAccessPartners: { type: Boolean, default: true },
    },
    vendor: {
      canAccessDashboard: { type: Boolean, default: true },
      canAccessLibrary: { type: Boolean, default: true },
      canUploadToLibrary: { type: Boolean, default: false },
      canAccessForum: { type: Boolean, default: true },
      canPostInForum: { type: Boolean, default: true },
      canAccessChat: { type: Boolean, default: true },
      canAccessEvents: { type: Boolean, default: true },
      canAccessEquipment: { type: Boolean, default: true },
      canListEquipment: { type: Boolean, default: true },
      canAccessBrags: { type: Boolean, default: true },
      canPostBrags: { type: Boolean, default: false },
      canAccessVideos: { type: Boolean, default: true },
      canAccessDirectory: { type: Boolean, default: true },
      canAccessPartners: { type: Boolean, default: false },
    },
  },

  // Maintenance Mode
  maintenanceMode: {
    type: Boolean,
    default: false,
  },
  maintenanceMessage: {
    type: String,
    default: 'The system is currently under maintenance. Please check back later.',
  },

  // Last updated tracking
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Ensure only one settings document exists (singleton pattern)
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

systemSettingsSchema.statics.updateSettings = async function(updates, userId) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({ ...updates, updatedBy: userId });
  } else {
    Object.assign(settings, updates, { updatedBy: userId });
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
