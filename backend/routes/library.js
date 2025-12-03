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

    // Build query - exclude soft deleted files and only show approved files
    // Admin can see all files, others only see approved files
    const isAdmin = req.user.role === 'admin';
    const query = { isActive: true, deletedAt: null };

    // Non-admin users only see approved files
    if (!isAdmin) {
      query.status = 'approved';
    }

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

// @desc    Get pending files for admin review
// @route   GET /api/library/pending
// @access  Private (Admin only)
router.get('/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sort = '-createdAt'
    } = req.query;

    // Build query for pending files
    const query = { status: 'pending', deletedAt: null };

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
      .populate('uploadedBy', 'firstName lastName email role')
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
    console.error('Error fetching pending files:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching pending files'
    });
  }
});

// @desc    Get my uploads (for owners to see their pending/approved/rejected files)
// @route   GET /api/library/my-uploads
// @access  Private (Owner)
router.get('/my-uploads', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sort = '-createdAt'
    } = req.query;

    // Build query for user's own uploads
    const query = { uploadedBy: req.user._id, deletedAt: null };

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
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
      .populate('reviewedBy', 'firstName lastName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await LibraryFile.countDocuments(query);

    // Get counts by status for the user
    const statusCounts = await LibraryFile.aggregate([
      { $match: { uploadedBy: req.user._id, deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    statusCounts.forEach(s => {
      counts[s._id] = s.count;
    });

    res.json({
      success: true,
      data: files,
      files,
      counts,
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
    console.error('Error fetching my uploads:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching your uploads'
    });
  }
});

// @desc    Approve a pending file
// @route   PUT /api/library/:id/approve
// @access  Private (Admin only)
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const file = await LibraryFile.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    if (file.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending files can be approved'
      });
    }

    // Approve the file
    file.status = 'approved';
    file.reviewedBy = req.user._id;
    file.reviewedAt = new Date();
    file.rejectionReason = undefined;
    await file.save();

    // Populate uploader info for response
    await file.populate('uploadedBy', 'firstName lastName email');
    await file.populate('reviewedBy', 'firstName lastName');

    res.json({
      success: true,
      data: file,
      message: 'File approved successfully'
    });
  } catch (error) {
    console.error('Error approving file:', error);
    res.status(500).json({
      success: false,
      error: 'Server error approving file'
    });
  }
});

// @desc    Reject a pending file
// @route   PUT /api/library/:id/reject
// @access  Private (Admin only)
router.put('/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;

    const file = await LibraryFile.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    if (file.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending files can be rejected'
      });
    }

    // Reject the file
    file.status = 'rejected';
    file.reviewedBy = req.user._id;
    file.reviewedAt = new Date();
    file.rejectionReason = reason || 'No reason provided';
    await file.save();

    // Populate uploader info for response
    await file.populate('uploadedBy', 'firstName lastName email');
    await file.populate('reviewedBy', 'firstName lastName');

    res.json({
      success: true,
      data: file,
      message: 'File rejected'
    });
  } catch (error) {
    console.error('Error rejecting file:', error);
    res.status(500).json({
      success: false,
      error: 'Server error rejecting file'
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
// @access  Private (Admin and Owner - Owner uploads go to pending)
router.post('/', protect, authorize('admin', 'owner'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file'
      });
    }

    const { title, description, category, tags } = req.body;

    // Determine status based on user role
    // Admin uploads are auto-approved, owner uploads go to pending
    const isAdmin = req.user.role === 'admin';
    const status = isAdmin ? 'approved' : 'pending';

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
      uploadedBy: req.user._id,
      status
    };

    const libraryFile = await LibraryFile.create(fileData);

    res.status(201).json({
      success: true,
      data: libraryFile,
      message: isAdmin ? 'File uploaded successfully' : 'File uploaded and pending admin approval'
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
// @access  Private (Admin can update any, Owner can update their own)
router.put('/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { title, description, category, tags, isActive } = req.body;

    const file = await LibraryFile.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check ownership for non-admin users
    const isAdmin = req.user.role === 'admin';
    const isOwner = file.uploadedBy.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit files you uploaded'
      });
    }

    // Update fields
    if (title) file.title = title;
    if (description !== undefined) file.description = description;
    if (category) file.category = category;
    if (tags) file.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    // Only admin can change isActive status
    if (isActive !== undefined && isAdmin) file.isActive = isActive;

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
// @access  Private (Admin can delete any, Owner can delete their own)
router.delete('/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const file = await LibraryFile.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check ownership for non-admin users
    const isAdmin = req.user.role === 'admin';
    const isOwner = file.uploadedBy.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete files you uploaded'
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
