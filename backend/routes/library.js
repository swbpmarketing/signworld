const express = require('express');
const router = express.Router();
const LibraryFile = require('../models/LibraryFile');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { deleteFromS3 } = require('../utils/s3');

// @desc    Get all library files with pagination, filters, search
// @route   GET /api/library
// @access  Private (all authenticated users)
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      sort = '-createdAt',
      fileType,
      tags
    } = req.query;

    // Build query - exclude soft deleted files
    const query = { isActive: true, deletedAt: null };

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by file type
    if (fileType) {
      query.fileType = { $regex: fileType, $options: 'i' };
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query.tags = { $in: tagArray };
    }

    // Search by title, description, or tags
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const files = await LibraryFile.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await LibraryFile.countDocuments(query);

    res.json({
      success: true,
      data: files,
      files,
      totalFiles: total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching library files:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching library files'
    });
  }
});

// @desc    Get archived library files with pagination, filters, search
// @route   GET /api/library/archived
// @access  Private (Admin only)
router.get('/archived', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sort = '-updatedAt'
    } = req.query;

    // Build query for archived files - exclude soft deleted files
    const query = { isActive: false, deletedAt: null };

    // Search by title, description, or tags
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const files = await LibraryFile.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await LibraryFile.countDocuments(query);

    res.json({
      success: true,
      data: files,
      files,
      totalFiles: total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching archived files:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching archived files'
    });
  }
});

// @desc    Get recently deleted files with pagination, search
// @route   GET /api/library/deleted
// @access  Private (Admin only)
router.get('/deleted', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sort = '-deletedAt'
    } = req.query;

    // Build query for deleted files
    const query = { deletedAt: { $ne: null } };

    // Search by title, description, or tags
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const files = await LibraryFile.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await LibraryFile.countDocuments(query);

    res.json({
      success: true,
      data: files,
      files,
      totalFiles: total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching deleted files:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching deleted files'
    });
  }
});

// @desc    Restore a deleted file
// @route   POST /api/library/:id/restore
// @access  Private (Admin only)
router.post('/:id/restore', protect, authorize('admin'), async (req, res) => {
  try {
    const file = await LibraryFile.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    if (!file.deletedAt) {
      return res.status(400).json({
        success: false,
        error: 'File is not deleted'
      });
    }

    // Restore the file
    file.deletedAt = null;
    await file.save();

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Error restoring file:', error);
    res.status(500).json({
      success: false,
      error: 'Server error restoring file'
    });
  }
});

// @desc    Permanently delete a file
// @route   DELETE /api/library/:id/permanent
// @access  Private (Admin only)
router.delete('/:id/permanent', protect, authorize('admin'), async (req, res) => {
  try {
    const file = await LibraryFile.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Delete from S3 if URL exists
    if (file.fileUrl) {
      try {
        await deleteFromS3(file.fileUrl);
      } catch (s3Error) {
        console.error('Error deleting from S3:', s3Error);
        // Continue with database deletion even if S3 fails
      }
    }

    await LibraryFile.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error permanently deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Server error permanently deleting file'
    });
  }
});

// @desc    Get library statistics
// @route   GET /api/library/stats
// @access  Private (all authenticated users)
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await LibraryFile.aggregate([
      { $match: { isActive: true, deletedAt: null } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
          totalDownloads: { $sum: '$downloadCount' }
        }
      }
    ]);

    // Get count by category
    const categoryStats = await LibraryFile.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get count by file type
    const typeStats = await LibraryFile.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            $cond: [
              { $regexMatch: { input: '$fileType', regex: /image/i } },
              'Images',
              {
                $cond: [
                  { $regexMatch: { input: '$fileType', regex: /pdf/i } },
                  'PDFs',
                  {
                    $cond: [
                      { $regexMatch: { input: '$fileType', regex: /word|document/i } },
                      'Documents',
                      {
                        $cond: [
                          { $regexMatch: { input: '$fileType', regex: /sheet|excel/i } },
                          'Spreadsheets',
                          'Other'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent files
    const recentFiles = await LibraryFile.find({ isActive: true })
      .sort('-createdAt')
      .limit(5)
      .select('title fileName fileType fileSize createdAt');

    res.json({
      success: true,
      data: {
        overview: stats[0] || { totalFiles: 0, totalSize: 0, totalDownloads: 0 },
        byCategory: categoryStats,
        byType: typeStats,
        recentFiles
      }
    });
  } catch (error) {
    console.error('Error fetching library stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching library statistics'
    });
  }
});

// @desc    Get all categories
// @route   GET /api/library/categories
// @access  Private (all authenticated users)
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = await LibraryFile.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Define category metadata
    const categoryMeta = {
      hr: { name: 'HR Documents', icon: 'users', color: 'blue' },
      marketing: { name: 'Marketing Materials', icon: 'megaphone', color: 'purple' },
      training: { name: 'Training Documents', icon: 'academic-cap', color: 'green' },
      operations: { name: 'Operations', icon: 'cog', color: 'gray' },
      forms: { name: 'Forms & Templates', icon: 'document', color: 'yellow' },
      fonts: { name: 'Fonts', icon: 'font', color: 'pink' },
      artwork: { name: 'Artwork & Graphics', icon: 'photo', color: 'indigo' },
      other: { name: 'Other', icon: 'folder', color: 'gray' }
    };

    const result = categories.map(cat => ({
      id: cat._id,
      ...categoryMeta[cat._id] || { name: cat._id, icon: 'folder', color: 'gray' },
      count: cat.count
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching categories'
    });
  }
});

// @desc    Get single file
// @route   GET /api/library/:id
// @access  Private (all authenticated users)
router.get('/:id', protect, async (req, res) => {
  try {
    const file = await LibraryFile.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName email');

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching file'
    });
  }
});

// @desc    Upload new file
// @route   POST /api/library
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file'
      });
    }

    const { title, description, category, tags } = req.body;

    // Create file record
    const fileData = {
      title: title || req.file.originalname,
      description: description || '',
      fileName: req.file.originalname,
      fileUrl: req.file.s3Url || req.file.location,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      category: category || 'other',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      uploadedBy: req.user._id
    };

    const libraryFile = await LibraryFile.create(fileData);

    res.status(201).json({
      success: true,
      data: libraryFile
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Server error uploading file'
    });
  }
});

// @desc    Update file metadata
// @route   PUT /api/library/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, description, category, tags, isActive } = req.body;

    const file = await LibraryFile.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Update fields
    if (title) file.title = title;
    if (description !== undefined) file.description = description;
    if (category) file.category = category;
    if (tags) file.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    if (isActive !== undefined) file.isActive = isActive;

    await file.save();

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating file'
    });
  }
});

// @desc    Soft delete file (move to recently deleted)
// @route   DELETE /api/library/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const file = await LibraryFile.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Soft delete - set deletedAt timestamp
    file.deletedAt = new Date();
    await file.save();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting file'
    });
  }
});

// @desc    Track download and get file URL
// @route   POST /api/library/:id/download
// @access  Private (all authenticated users)
router.post('/:id/download', protect, async (req, res) => {
  try {
    const file = await LibraryFile.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Track download
    file.downloads.push({
      user: req.user._id,
      downloadedAt: new Date()
    });
    await file.save();

    res.json({
      success: true,
      data: {
        fileUrl: file.fileUrl,
        fileName: file.fileName,
        downloadCount: file.downloadCount
      }
    });
  } catch (error) {
    console.error('Error tracking download:', error);
    res.status(500).json({
      success: false,
      error: 'Server error tracking download'
    });
  }
});

// @desc    Proxy download file (bypasses CORS)
// @route   GET /api/library/:id/download-file
// @access  Private (all authenticated users)
router.get('/:id/download-file', protect, async (req, res) => {
  try {
    const file = await LibraryFile.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Track download
    file.downloads.push({
      user: req.user._id,
      downloadedAt: new Date()
    });
    await file.save();

    // Fetch file from S3
    const https = require('https');
    const http = require('http');
    const fileUrl = file.fileUrl;
    const protocol = fileUrl.startsWith('https') ? https : http;

    protocol.get(fileUrl, (fileRes) => {
      if (fileRes.statusCode !== 200) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch file from storage'
        });
      }

      // Set headers to force download
      res.setHeader('Content-Type', file.fileType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
      if (fileRes.headers['content-length']) {
        res.setHeader('Content-Length', fileRes.headers['content-length']);
      }

      // Stream the file to the response
      fileRes.pipe(res);
    }).on('error', (error) => {
      console.error('Error fetching file:', error);
      res.status(500).json({
        success: false,
        error: 'Server error downloading file'
      });
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: 'Server error downloading file'
    });
  }
});

module.exports = router;
