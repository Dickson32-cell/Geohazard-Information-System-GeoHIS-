const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/', contactLimiter, contactController.submitContactForm);

// Admin routes (require authentication)
router.get('/submissions', authenticateToken, requireAdmin, contactController.getContactSubmissions);
router.put('/submissions/:id/status', authenticateToken, requireAdmin, contactController.updateContactSubmissionStatus);
router.delete('/submissions/:id', authenticateToken, requireAdmin, contactController.deleteContactSubmission);

module.exports = router;