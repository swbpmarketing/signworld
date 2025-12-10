const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching settings',
    });
  }
});

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const allowedFields = [
      'platformName',
      'supportEmail',
      'requireStrongPasswords',
      'autoApproveOwners',
      'requireLibraryApproval',
      'maxFileUploadSize',
      'itemsPerPage',
      'enableChat',
      'enableForum',
      'enableEquipmentMarketplace',
      'enableLibrary',
      'maintenanceMode',
      'maintenanceMessage',
    ];

    // Filter to only allowed fields
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const settings = await SystemSettings.updateSettings(updates, req.user._id);

    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating settings',
    });
  }
});

// @desc    Get user notification preferences
// @route   GET /api/settings/notifications
// @access  Private
router.get('/notifications', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences');

    // Return defaults if not set
    const defaults = {
      emailNotifications: true,
      pushNotifications: true,
      newMessages: true,
      forumReplies: true,
      systemAnnouncements: true,
      marketplaceUpdates: true,
      weeklyDigest: false,
    };

    res.json({
      success: true,
      data: user?.notificationPreferences || defaults,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching notification preferences',
    });
  }
});

// @desc    Update user notification preferences
// @route   PUT /api/settings/notifications
// @access  Private
router.put('/notifications', protect, async (req, res) => {
  try {
    const allowedFields = [
      'emailNotifications',
      'pushNotifications',
      'newMessages',
      'forumReplies',
      'systemAnnouncements',
      'marketplaceUpdates',
      'weeklyDigest',
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[`notificationPreferences.${field}`] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('notificationPreferences');

    res.json({
      success: true,
      data: user.notificationPreferences,
      message: 'Notification preferences updated',
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating notification preferences',
    });
  }
});

// @desc    Get public settings (non-admin)
// @route   GET /api/settings/public
// @access  Private
router.get('/public', protect, async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    // Only return public-facing settings
    res.json({
      success: true,
      data: {
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        maxFileUploadSize: settings.maxFileUploadSize,
        itemsPerPage: settings.itemsPerPage,
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
      },
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching settings',
    });
  }
});

// @desc    Get role permissions
// @route   GET /api/settings/role-permissions
// @access  Private/Admin
router.get('/role-permissions', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    // Return default permissions if not set
    const defaultPermissions = {
      owner: {
        canAccessDashboard: true,
        canAccessLibrary: true,
        canUploadToLibrary: true,
        canAccessForum: true,
        canPostInForum: true,
        canAccessChat: true,
        canAccessEvents: true,
        canAccessEquipment: true,
        canListEquipment: true,
        canAccessBrags: true,
        canPostBrags: true,
        canAccessVideos: true,
        canAccessDirectory: true,
        canAccessPartners: true,
      },
      vendor: {
        canAccessDashboard: true,
        canAccessLibrary: true,
        canUploadToLibrary: false,
        canAccessForum: true,
        canPostInForum: true,
        canAccessChat: true,
        canAccessEvents: true,
        canAccessEquipment: true,
        canListEquipment: true,
        canAccessBrags: true,
        canPostBrags: false,
        canAccessVideos: true,
        canAccessDirectory: true,
        canAccessPartners: false,
      },
    };

    res.json({
      success: true,
      data: settings.rolePermissions || defaultPermissions,
    });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching role permissions',
    });
  }
});

// @desc    Update role permissions
// @route   PUT /api/settings/role-permissions
// @access  Private/Admin
router.put('/role-permissions', protect, authorize('admin'), async (req, res) => {
  try {
    const { owner, vendor } = req.body;

    const settings = await SystemSettings.getSettings();

    // Initialize rolePermissions if it doesn't exist
    if (!settings.rolePermissions) {
      settings.rolePermissions = { owner: {}, vendor: {} };
    }
    if (!settings.rolePermissions.owner) {
      settings.rolePermissions.owner = {};
    }
    if (!settings.rolePermissions.vendor) {
      settings.rolePermissions.vendor = {};
    }

    // Update owner permissions if provided
    if (owner) {
      Object.keys(owner).forEach(key => {
        settings.rolePermissions.owner[key] = owner[key];
      });
    }

    // Update vendor permissions if provided
    if (vendor) {
      Object.keys(vendor).forEach(key => {
        settings.rolePermissions.vendor[key] = vendor[key];
      });
    }

    settings.updatedBy = req.user._id;
    settings.markModified('rolePermissions'); // Ensure Mongoose detects nested changes
    await settings.save();

    res.json({
      success: true,
      data: settings.rolePermissions,
      message: 'Role permissions updated successfully',
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating role permissions',
    });
  }
});

// @desc    Get current user's permissions based on their role
// @route   GET /api/settings/my-permissions
// @access  Private
router.get('/my-permissions', protect, async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    const userRole = req.user.role;

    // Admin has all permissions
    if (userRole === 'admin') {
      res.json({
        success: true,
        data: {
          canAccessDashboard: true,
          canAccessLibrary: true,
          canUploadToLibrary: true,
          canAccessForum: true,
          canPostInForum: true,
          canAccessChat: true,
          canAccessEvents: true,
          canAccessEquipment: true,
          canListEquipment: true,
          canAccessBrags: true,
          canPostBrags: true,
          canAccessVideos: true,
          canAccessDirectory: true,
          canAccessPartners: true,
          canManageUsers: true,
          canManageSettings: true,
          canApprovePending: true,
        },
      });
      return;
    }

    // Return role-specific permissions
    const rolePermissions = settings.rolePermissions?.[userRole] || {};

    res.json({
      success: true,
      data: {
        ...rolePermissions,
        canManageUsers: false,
        canManageSettings: false,
        canApprovePending: false,
      },
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching permissions',
    });
  }
});

module.exports = router;
