const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');
const alertController = require('../controllers/alertController');

// All routes require authentication
router.use(authMiddleware);

// GET /api/alerts
router.get('/', alertController.getAllAlerts);

// GET /api/alerts/count
router.get('/count', alertController.getUnresolvedCount);

// GET /api/alerts/:id
router.get('/:id', alertController.getAlertById);

// PUT /api/alerts/:id/resolve
router.put('/:id/resolve', alertController.resolveAlert);

// DELETE /api/alerts/:id
router.delete('/:id', requireAdmin, alertController.deleteAlert);

module.exports = router;
