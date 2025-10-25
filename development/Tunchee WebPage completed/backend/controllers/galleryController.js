const fs = require('fs');
const path = require('path');
const { logger } = require('../middleware/errorHandler');
const { GalleryImage } = require('../models');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Upload gallery image
// @route   POST /api/v1/gallery/upload
// @access  Private/Admin
const uploadGalleryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'NO_FILE',
        message: 'No file uploaded'
      });
    }

    const file = req.file;
    const userId = req.user?.id;

    // Check file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      // Delete file if invalid type
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILE_TYPE',
        message: 'Only JPEG, PNG, GIF, and WebP images are allowed'
      });
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: 'FILE_TOO_LARGE',
        message: 'File size should be less than 5MB'
      });
    }

    // Get the next display order
    const maxOrder = await GalleryImage.max('display_order') || 0;
    const nextOrder = maxOrder + 1;

    // Create gallery image record
    const galleryImage = await GalleryImage.create({
      image_url: `/uploads/${file.filename}`,
      image_alt_text: req.body.alt_text || '',
      image_title: req.body.title || '',
      image_description: req.body.description || '',
      display_order: nextOrder,
      is_featured: req.body.is_featured === 'true' || req.body.is_featured === true,
      file_size: file.size,
      file_name: file.filename,
      mime_type: file.mimetype,
      uploaded_by: userId
    });

    res.status(201).json({
      success: true,
      message: 'Gallery image uploaded successfully',
      data: {
        image: galleryImage,
        file_url: `/uploads/${file.filename}`
      }
    });
  } catch (error) {
    logger.error('Gallery image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'UPLOAD_ERROR',
      message: 'Failed to upload gallery image'
    });
  }
};

// @desc    Get all gallery images
// @route   GET /api/v1/gallery
// @access  Public
const getGalleryImages = async (req, res) => {
  try {
    const { featured, limit } = req.query;

    // First, try to get images from database (for admin-uploaded images)
    let dbImages = [];
    try {
      let whereClause = {};
      if (featured === 'true') {
        whereClause.is_featured = true;
      }

      dbImages = await GalleryImage.findAll({
        where: whereClause,
        order: [['display_order', 'ASC'], ['createdAt', 'DESC']],
        limit: limit ? parseInt(limit) : undefined,
        include: [{
          model: require('../models').User,
          as: 'uploader',
          attributes: ['full_name'],
          required: false
        }]
      });
    } catch (dbError) {
      logger.warn('Database query failed, falling back to file system:', dbError.message);
    }

    // Get all image files from uploads directory
    let fileImages = [];
    try {
      const files = fs.readdirSync(uploadsDir);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];

      fileImages = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return imageExtensions.includes(ext) && file !== 'Profile Picture.jpg'; // Exclude profile picture
        })
        .map((file, index) => {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);

          return {
            id: `file_${index}`,
            image_url: `/uploads/${file}`,
            image_title: path.parse(file).name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            image_alt_text: `${path.parse(file).name} - Portfolio Image`,
            image_description: 'Portfolio image automatically loaded from uploads folder',
            display_order: index,
            is_featured: false,
            file_size: stats.size,
            file_name: file,
            mime_type: 'image/' + path.extname(file).slice(1),
            createdAt: stats.birthtime,
            updatedAt: stats.mtime,
            uploader: null
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first
    } catch (fsError) {
      logger.error('File system read error:', fsError);
    }

    // Combine database images and file images, prioritizing database images
    const allImages = [...dbImages, ...fileImages];

    // Apply limit if specified
    const finalImages = limit ? allImages.slice(0, parseInt(limit)) : allImages;

    res.status(200).json({
      success: true,
      data: { images: finalImages }
    });
  } catch (error) {
    logger.error('Get gallery images error:', error);
    res.status(500).json({
      success: false,
      error: 'FETCH_ERROR',
      message: 'Failed to fetch gallery images'
    });
  }
};

// @desc    Update gallery image
// @route   PUT /api/v1/gallery/:id
// @access  Private/Admin
const updateGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_title, image_description, image_alt_text, display_order, is_featured } = req.body;

    const image = await GalleryImage.findByPk(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Gallery image not found'
      });
    }

    await image.update({
      image_title: image_title ?? image.image_title,
      image_description: image_description ?? image.image_description,
      image_alt_text: image_alt_text ?? image.image_alt_text,
      display_order: display_order ?? image.display_order,
      is_featured: is_featured !== undefined ? is_featured : image.is_featured
    });

    res.status(200).json({
      success: true,
      message: 'Gallery image updated successfully',
      data: { image }
    });
  } catch (error) {
    logger.error('Update gallery image error:', error);
    res.status(500).json({
      success: false,
      error: 'UPDATE_ERROR',
      message: 'Failed to update gallery image'
    });
  }
};

// @desc    Delete gallery image
// @route   DELETE /api/v1/gallery/:id
// @access  Private/Admin
const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await GalleryImage.findByPk(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Gallery image not found'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(uploadsDir, path.basename(image.image_url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await image.destroy();

    res.status(200).json({
      success: true,
      message: 'Gallery image deleted successfully'
    });
  } catch (error) {
    logger.error('Delete gallery image error:', error);
    res.status(500).json({
      success: false,
      error: 'DELETE_ERROR',
      message: 'Failed to delete gallery image'
    });
  }
};

// @desc    Update gallery image order
// @route   PUT /api/v1/gallery/reorder
// @access  Private/Admin
const reorderGalleryImages = async (req, res) => {
  try {
    const { imageOrders } = req.body;

    if (!Array.isArray(imageOrders)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'imageOrders must be an array'
      });
    }

    // Update display order for each image
    const updatePromises = imageOrders.map(({ id, display_order }) =>
      GalleryImage.update(
        { display_order },
        { where: { id } }
      )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Gallery images reordered successfully'
    });
  } catch (error) {
    logger.error('Reorder gallery images error:', error);
    res.status(500).json({
      success: false,
      error: 'REORDER_ERROR',
      message: 'Failed to reorder gallery images'
    });
  }
};

module.exports = {
  uploadGalleryImage,
  getGalleryImages,
  updateGalleryImage,
  deleteGalleryImage,
  reorderGalleryImages
};