const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Create S3 instance
const s3 = new AWS.S3();

// S3 bucket configuration
const s3Config = {
  bucketName: process.env.AWS_S3_BUCKET_NAME || 'asj-portfolio-bucket',
  region: process.env.AWS_REGION || 'us-east-1',
  acl: 'public-read', // or 'private' depending on requirements
  maxSize: 10 * 1024 * 1024, // 10MB max file size
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

// Upload file to S3
const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
  const params = {
    Bucket: s3Config.bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: s3Config.acl
  };

  try {
    const result = await s3.upload(params).promise();
    return {
      success: true,
      url: result.Location,
      key: result.Key
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete file from S3
const deleteFromS3 = async (fileKey) => {
  const params = {
    Bucket: s3Config.bucketName,
    Key: fileKey
  };

  try {
    await s3.deleteObject(params).promise();
    return { success: true };
  } catch (error) {
    console.error('S3 delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get signed URL for private files
const getSignedUrl = (fileKey, expiresIn = 3600) => {
  const params = {
    Bucket: s3Config.bucketName,
    Key: fileKey,
    Expires: expiresIn
  };

  try {
    const url = s3.getSignedUrl('getObject', params);
    return url;
  } catch (error) {
    console.error('S3 signed URL error:', error);
    return null;
  }
};

module.exports = {
  s3,
  s3Config,
  uploadToS3,
  deleteFromS3,
  getSignedUrl
};