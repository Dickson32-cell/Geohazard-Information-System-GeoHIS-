const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All dashboard routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard statistics
router.get('/stats', getDashboardStats);

module.exports = router;