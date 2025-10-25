const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  uploadImage,
  addProjectImages,
  deleteProjectImage,
  updateProjectImage
} = require('../controllers/imageController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Upload image file - with authentication and authorization
router.post('/upload', authenticateToken, requireAdmin, upload.single('image'), uploadImage);

// Add project images - with authentication and authorization
router.post('/project-images', authenticateToken, requireAdmin, addProjectImages);

// Update project image - with authentication and authorization
router.put('/project-images/:id', authenticateToken, requireAdmin, updateProjectImage);

// Delete project image - with authentication and authorization
router.delete('/project-images/:id', authenticateToken, requireAdmin, deleteProjectImage);

module.exports = router;
