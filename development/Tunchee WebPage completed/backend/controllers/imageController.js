const fs = require('fs');
const path = require('path');
const { logger } = require('../middleware/errorHandler');
const { ProjectImage } = require('../models');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Upload image file and convert to base64
// @route   POST /api/v1/images/upload
// @access  Private/Admin
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'NO_FILE',
        message: 'No file uploaded'
      });
    }

    const file = req.file;

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

    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(file.path);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = file.mimetype;
    const base64String = `data:${mimeType};base64,${base64Data}`;

    // Keep the file for reference
    const fileUrl = `/uploads/${file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        image_url: base64String,
        file_url: fileUrl,
        file_name: file.filename,
        file_size: file.size,
        mime_type: file.mimetype
      }
    });
  } catch (error) {
    logger.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'UPLOAD_ERROR',
      message: 'Failed to upload image'
    });
  }
};

// @desc    Add images to project
// @route   POST /api/v1/images/project-images
// @access  Private/Admin
const addProjectImages = async (req, res) => {
  try {
    const { project_id, images } = req.body;

    if (!project_id || !images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Project ID and images array are required'
      });
    }

    // Create project images
    const projectImages = await Promise.all(
      images.map((image, index) =>
        ProjectImage.create({
          project_id,
          image_url: image.image_url || image.url,
          image_alt_text: image.alt_text || '',
          image_title: image.title || '',
          image_description: image.description || '',
          display_order: image.display_order || index + 1,
          is_before_after: image.is_before_after || false,
          file_size: image.file_size || 0
        })
      )
    );

    res.status(201).json({
      success: true,
      message: 'Project images added successfully',
      data: { images: projectImages }
    });
  } catch (error) {
    logger.error('Add project images error:', error);
    res.status(500).json({
      success: false,
      error: 'ADD_IMAGES_ERROR',
      message: 'Failed to add project images'
    });
  }
};

// @desc    Delete project image
// @route   DELETE /api/v1/images/project-images/:id
// @access  Private/Admin
const deleteProjectImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await ProjectImage.findByPk(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Image not found'
      });
    }

    await image.destroy();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    logger.error('Delete project image error:', error);
    res.status(500).json({
      success: false,
      error: 'DELETE_IMAGE_ERROR',
      message: 'Failed to delete image'
    });
  }
};

// @desc    Update project image order
// @route   PUT /api/v1/images/project-images/:id
// @access  Private/Admin
const updateProjectImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_order, image_alt_text, image_title, image_description } = req.body;

    const image = await ProjectImage.findByPk(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Image not found'
      });
    }

    await image.update({
      display_order: display_order ?? image.display_order,
      image_alt_text: image_alt_text ?? image.image_alt_text,
      image_title: image_title ?? image.image_title,
      image_description: image_description ?? image.image_description
    });

    res.status(200).json({
      success: true,
      message: 'Image updated successfully',
      data: { image }
    });
  } catch (error) {
    logger.error('Update project image error:', error);
    res.status(500).json({
      success: false,
      error: 'UPDATE_IMAGE_ERROR',
      message: 'Failed to update image'
    });
  }
};

module.exports = {
  uploadImage,
  addProjectImages,
  deleteProjectImage,
  updateProjectImage
};
