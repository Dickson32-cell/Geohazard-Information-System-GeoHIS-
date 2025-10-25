const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

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
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
];

const changePasswordValidation = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

// Public routes
router.post('/login', authLimiter, loginValidation, handleValidationErrors, login);
router.post('/refresh', refreshToken);

// Protected routes
router.use(authenticateToken); // All routes below require authentication

router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', updateProfileValidation, handleValidationErrors, updateProfile);
router.post('/change-password', changePasswordValidation, handleValidationErrors, changePassword);

module.exports = router;