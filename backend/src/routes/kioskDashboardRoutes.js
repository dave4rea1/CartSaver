const express = require('express');
const router = express.Router();
const kioskDashboardController = require('../controllers/kioskDashboardController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// All routes require admin authentication
router.use(authMiddleware);
router.use(requireAdmin);

// GET /api/kiosk-dashboard/analytics - Get comprehensive kiosk analytics
router.get('/analytics', kioskDashboardController.getKioskAnalytics);

// GET /api/kiosk-dashboard/live - Get real-time activity (for live updates)
router.get('/live', kioskDashboardController.getLiveActivity);

module.exports = router;
