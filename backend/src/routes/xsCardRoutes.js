const express = require('express');
const router = express.Router();
const xsCardController = require('../controllers/xsCardController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public routes (for kiosk use - no authentication required)
router.post('/validate', xsCardController.validateXSCard);
router.post('/checkout', xsCardController.checkoutTrolley);
router.post('/return', xsCardController.returnTrolley);

// Protected routes (require authentication)
router.get('/history/:identifier', authMiddleware, xsCardController.getCustomerHistory);
router.get('/active-checkouts/:store_id', authMiddleware, xsCardController.getActiveCheckouts);

module.exports = router;
