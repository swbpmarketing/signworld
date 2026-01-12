const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const LibraryFile = require('../models/LibraryFile');
const { protect, authorize } = require('../middleware/auth');

// @desc    Create a new folder in a category
// @route   POST /api/folders
// @access  Private (Admin and Owner)
router.post('/', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { name, category, parentFolderId } = req.body;

    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        error: 'Please provide folder name and category'
      });
    }

    // If parentFolderId is provided, verify it exists and belongs to same category
    if (parentFolderId) {
      const parentFolder = await Folder.findById(parentFolderId);
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          error: 'Parent folder not found'
        });
      }
      if (parentFolder.category !== category) {
        return res.status(400).json({
          success: false,
          error: 'Parent folder must be in the same category'
        });
      }
    }

    const folderData = {
      name: name.trim(),
      category,
      parentFolder: parentFolderId || null,
      createdBy: req.user._id,
    };

    const folder = await Folder.create(folderData);

    res.status(201).json({
      success: true,
      data: folder
    });
  } catch (error) {
    console.error('Error creating folder:', error);

    // Handle duplicate folder name in same parent
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Folder with this name already exists in this location'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error creating folder'
    });
  }
});

// @desc    Get all folders in a category
// @route   GET /api/folders?category=hr
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { category, parentId } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category is required'
      });
    }

    const query = {
      category,
      isActive: true,
      deletedAt: null
    };

    // If parentId is provided, get folders in that parent; otherwise get top-level folders
    if (parentId) {
      query.parentFolder = parentId;
    } else {
      query.parentFolder = null;
    }

    const folders = await Folder.find(query)
      .sort({ name: 1 })
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      data: folders
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching folders'
    });
  }
});

// @desc    Get folder hierarchy for a category
// @route   GET /api/folders/hierarchy/:category
// @access  Private
router.get('/hierarchy/:category', protect, async (req, res) => {
  try {
    const { category } = req.params;

    // Get all active folders in this category
    const folders = await Folder.find({
      category,
      isActive: true,
      deletedAt: null
    }).sort({ name: 1 });

    // Build hierarchical structure
    const buildTree = (parentId = null) => {
      return folders
        .filter(f => (f.parentFolder === null ? parentId === null : f.parentFolder.toString() === parentId?.toString()))
        .map(folder => ({
          _id: folder._id,
          name: folder.name,
          parentFolder: folder.parentFolder,
          children: buildTree(folder._id)
        }));
    };

    const hierarchy = buildTree();

    res.json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    console.error('Error fetching folder hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching folder hierarchy'
    });
  }
});

// @desc    Update folder (rename or move)
// @route   PUT /api/folders/:id
// @access  Private (Admin and Owner)
router.put('/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { name, parentFolderId } = req.body;
    const { id } = req.params;

    const folder = await Folder.findById(id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    // Update name if provided
    if (name) {
      folder.name = name.trim();
    }

    // Update parent folder if provided
    if (parentFolderId !== undefined) {
      if (parentFolderId) {
        // Verify parent folder exists and is in same category
        const parentFolder = await Folder.findById(parentFolderId);
        if (!parentFolder) {
          return res.status(404).json({
            success: false,
            error: 'Parent folder not found'
          });
        }
        if (parentFolder.category !== folder.category) {
          return res.status(400).json({
            success: false,
            error: 'Parent folder must be in the same category'
          });
        }

        // Prevent circular references
        if (parentFolderId === id) {
          return res.status(400).json({
            success: false,
            error: 'A folder cannot be its own parent'
          });
        }

        folder.parentFolder = parentFolderId;
      } else {
        folder.parentFolder = null;
      }
    }

    await folder.save();

    res.json({
      success: true,
      data: folder
    });
  } catch (error) {
    console.error('Error updating folder:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Folder with this name already exists in this location'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error updating folder'
    });
  }
});

// @desc    Delete folder (soft delete)
// @route   DELETE /api/folders/:id
// @access  Private (Admin and Owner)
router.delete('/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await Folder.findById(id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    // Check if folder has any files
    const fileCount = await LibraryFile.countDocuments({
      folder: id,
      deletedAt: null
    });

    if (fileCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete folder with ${fileCount} file(s). Please delete or move files first.`
      });
    }

    // Check if folder has subfolders
    const subfolderCount = await Folder.countDocuments({
      parentFolder: id,
      deletedAt: null
    });

    if (subfolderCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete folder with ${subfolderCount} subfolder(s). Please delete subfolders first.`
      });
    }

    // Soft delete
    folder.deletedAt = new Date();
    folder.isActive = false;
    await folder.save();

    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting folder'
    });
  }
});

// @desc    Get folder with file count
// @route   GET /api/folders/:id/info
// @access  Private
router.get('/:id/info', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await Folder.findById(id).populate('createdBy', 'firstName lastName email');
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
    }

    // Get file and subfolder counts
    const fileCount = await LibraryFile.countDocuments({
      folder: id,
      deletedAt: null
    });

    const subfolderCount = await Folder.countDocuments({
      parentFolder: id,
      deletedAt: null
    });

    res.json({
      success: true,
      data: {
        ...folder.toObject(),
        fileCount,
        subfolderCount
      }
    });
  } catch (error) {
    console.error('Error fetching folder info:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching folder info'
    });
  }
});

module.exports = router;
