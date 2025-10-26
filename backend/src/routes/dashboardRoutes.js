const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { cacheMiddleware, cacheKeyGenerators } = require('../middleware/cacheMiddleware');
const dashboardController = require('../controllers/dashboardController');

// All routes require authentication
router.use(authMiddleware);

// GET /api/dashboard/stats - Cache for 5 minutes
router.get('/stats',
  cacheMiddleware(300, cacheKeyGenerators.dashboardStats),
  dashboardController.getDashboardStats
);

// GET /api/dashboard/map - Cache for 10 minutes
router.get('/map',
  cacheMiddleware(600),
  dashboardController.getMapData
);

// GET /api/dashboard/analytics - Cache for 15 minutes
router.get('/analytics',
  cacheMiddleware(900),
  dashboardController.getAnalytics
);

module.exports = router;
