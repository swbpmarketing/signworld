const multer = require('multer');
const path = require('path');
const { uploadToS3 } = require('../utils/s3');

// Use memory storage for S3 uploads
const storage = multer.memoryStorage();

// File filter for validation
const fileFilter = (req, file, cb) => {
  // Accept images
  if (file.fieldname === 'images' || file.fieldname === 'gallery' || file.fieldname === 'logo' || file.fieldname === 'featuredImage' || file.fieldname === 'thumbnail' || file.fieldname === 'file') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for images/gallery/logo/thumbnail'), false);
    }
  }
  // Accept videos
  else if (file.fieldname === 'video') {
    const allowedVideoMimes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/mpeg'
    ];

    if (allowedVideoMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4, WebM, OGG, MOV, AVI, WMV, and MPEG video files are allowed'), false);
    }
  }
  // Accept documents (PDF, DOC, DOCX, XLS, XLSX, etc.)
  else if (file.fieldname === 'documents') {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, XLS, XLSX, and TXT files are allowed for documents'), false);
    }
  }
  else {
    cb(null, true);
  }
};

// Configure multer with standard file size limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size for non-video files
  }
});

// Configure multer with larger file size limit for videos
const uploadVideo = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size for videos
  }
});

/**
 * Middleware to upload files to S3 after multer processes them
 * Use this after multer middleware to handle S3 upload
 */
const uploadFilesToS3 = async (req, res, next) => {
  try {
    console.log('uploadFilesToS3 middleware called');
    console.log('req.file:', req.file ? { fieldname: req.file.fieldname, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : 'none');
    console.log('req.files:', req.files ? 'present' : 'none');

    if (!req.files && !req.file) {
      console.log('No files to upload, skipping');
      return next();
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    console.log('Files to upload:', files.length);

    // Upload each file to S3
    const uploadPromises = files.map(async (file) => {
      // Determine folder based on field name
      let folder = 'other';
      if (file.fieldname === 'images' || file.fieldname === 'gallery' || file.fieldname === 'logo' || file.fieldname === 'featuredImage' || file.fieldname === 'thumbnail') {
        folder = 'images';
      } else if (file.fieldname === 'file') {
        folder = 'profile-photos';
      } else if (file.fieldname === 'documents') {
        folder = 'documents';
      } else if (file.fieldname === 'video') {
        folder = 'videos';
      }

      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
      const fileName = `${basename}-${uniqueSuffix}${ext}`;

      console.log('Uploading to S3:', { folder, fileName, mimetype: file.mimetype, bufferLength: file.buffer?.length });

      // Upload to S3
      const s3Url = await uploadToS3(file.buffer, fileName, file.mimetype, folder);

      console.log('S3 upload successful:', s3Url);

      // Add S3 URL to file object
      file.s3Url = s3Url;
      file.location = s3Url; // For compatibility

      return file;
    });

    await Promise.all(uploadPromises);

    console.log('All uploads complete, calling next()');
    next();
  } catch (error) {
    console.error('S3 upload middleware error:', error);
    next(error);
  }
};

// Export upload middleware configurations
module.exports = {
  // Single file upload
  single: (fieldName) => [upload.single(fieldName), uploadFilesToS3],

  // Multiple files upload
  multiple: (fieldName, maxCount = 10) => [upload.array(fieldName, maxCount), uploadFilesToS3],

  // Multiple fields
  fields: (fields) => [upload.fields(fields), uploadFilesToS3],

  // For conventions with images, documents, and gallery
  conventionFiles: [
    upload.fields([
      { name: 'images', maxCount: 10 },
      { name: 'documents', maxCount: 10 },
      { name: 'gallery', maxCount: 20 },
      { name: 'logo', maxCount: 1 }
    ]),
    uploadFilesToS3
  ],

  // For equipment with images and documents
  equipmentFiles: [
    upload.fields([
      { name: 'images', maxCount: 10 },
      { name: 'documents', maxCount: 5 }
    ]),
    uploadFilesToS3
  ],

  // For brags with images
  bragFiles: [
    upload.fields([
      { name: 'featuredImage', maxCount: 1 },
      { name: 'images', maxCount: 5 }
    ]),
    uploadFilesToS3
  ],

  // For forum threads with images
  forumFiles: [
    upload.fields([
      { name: 'images', maxCount: 5 }
    ]),
    uploadFilesToS3
  ],

  // For video uploads with optional thumbnail
  videoFiles: [
    uploadVideo.fields([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 }
    ]),
    uploadFilesToS3
  ],

  // Single video upload
  videoSingle: (fieldName = 'video') => [uploadVideo.single(fieldName), uploadFilesToS3]
};
