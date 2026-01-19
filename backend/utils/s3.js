const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Name for the file in S3
 * @param {string} mimeType - MIME type of the file
 * @param {string} folder - Folder within bucket (e.g., 'images', 'documents')
 * @returns {Promise<string>} - Public URL of uploaded file
 */
const uploadToS3 = async (fileBuffer, fileName, mimeType, folder = '') => {
  const key = folder ? `${folder}/${fileName}` : fileName;

  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  try {
    console.log('Starting S3 upload:', { bucket: process.env.AWS_S3_BUCKET, key, mimeType });

    const upload = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    await upload.done();

    // Return public URL
    const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log('S3 upload successful:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('S3 upload error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      fullError: error
    });
    throw new Error(`Failed to upload file to S3: ${error.message} (Code: ${error.code})`);
  }
};

/**
 * Delete file from S3
 * @param {string} fileUrl - Full S3 URL of the file
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (fileUrl) => {
  try {
    // Extract key from URL
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    console.log(`Successfully deleted ${key} from S3`);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  s3Client,
};
