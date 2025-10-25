const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getProjects,
  getProject,
  getCategories,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

const router = express.Router();

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: errors.array()[0].msg,
      details: errors.array()
    });
  }
  next();
};

// Validation rules
const createProjectValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('category_id')
    .isInt()
    .withMessage('Valid category is required'),
  body('completion_date')
    .isISO8601()
    .withMessage('Valid completion date is required'),
  body('featured_image_url')
    .optional()
    .custom((value) => {
      // Allow empty string or valid URL/base64
      if (!value) return true;
      if (value.startsWith('data:')) return true; // Allow base64
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('Invalid featured image URL or format');
      }
    }),
  body('seo_title')
    .optional()
    .isLength({ max: 255 })
    .withMessage('SEO title must be less than 255 characters'),
  body('seo_description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('SEO description must be less than 500 characters')
];

const updateProjectValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('category_id')
    .optional()
    .isInt()
    .withMessage('Valid category is required'),
  body('completion_date')
    .optional()
    .isISO8601()
    .withMessage('Valid completion date is required'),
  body('featured_image_url')
    .optional()
    .custom((value) => {
      // Allow empty string or valid URL/base64
      if (!value) return true;
      if (value.startsWith('data:')) return true; // Allow base64
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('Invalid featured image URL or format');
      }
    }),
  body('seo_title')
    .optional()
    .isLength({ max: 255 })
    .withMessage('SEO title must be less than 255 characters'),
  body('seo_description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('SEO description must be less than 500 characters')
];

// Public routes
router.get('/', getProjects);
router.get('/categories', getCategories);
router.get('/:slug', getProject);

module.exports = router;