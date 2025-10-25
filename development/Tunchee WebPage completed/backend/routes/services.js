const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/', serviceController.getServices);
router.get('/:slug', serviceController.getService);

// Admin routes (require authentication)
router.post('/', authenticateToken, requireAdmin, serviceController.createService);
router.put('/:id', authenticateToken, requireAdmin, serviceController.updateService);
router.delete('/:id', authenticateToken, requireAdmin, serviceController.deleteService);

// Service package routes (Admin only)
router.get('/:serviceId/packages', authenticateToken, requireAdmin, serviceController.getServicePackages);
router.post('/:serviceId/packages', authenticateToken, requireAdmin, serviceController.createServicePackage);
router.put('/packages/:packageId', authenticateToken, requireAdmin, serviceController.updateServicePackage);
router.delete('/packages/:packageId', authenticateToken, requireAdmin, serviceController.deleteServicePackage);

module.exports = router;