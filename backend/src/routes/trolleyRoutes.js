const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');
const trolleyController = require('../controllers/trolleyController');

// Public routes (for kiosk use - no authentication required)
// GET /api/trolleys - Allow kiosks to fetch available trolleys
router.get('/', trolleyController.getAllTrolleys);

// All other routes require authentication
router.use(authMiddleware);

// GET /api/trolleys/:id
router.get('/:id', trolleyController.getTrolleyById);

// POST /api/trolleys
router.post('/',
  requireAdmin,
  [
    body('rfid_tag').notEmpty().trim().withMessage('RFID tag is required'),
    body('store_id').isInt().withMessage('Valid store ID is required'),
    body('barcode').optional().trim(),
    body('status').optional().isIn(['active', 'maintenance', 'stolen', 'decommissioned', 'recovered']),
    validate
  ],
  trolleyController.createTrolley
);

// PUT /api/trolleys/:id
router.put('/:id',
  requireAdmin,
  [
    body('rfid_tag').optional().trim(),
    body('barcode').optional().trim(),
    body('store_id').optional().isInt(),
    body('status').optional().isIn(['active', 'maintenance', 'stolen', 'decommissioned', 'recovered']),
    validate
  ],
  trolleyController.updateTrolley
);

// POST /api/trolleys/scan
router.post('/scan',
  [
    body('identifier').notEmpty().trim().withMessage('RFID tag or barcode is required'),
    body('new_status').optional().isIn(['active', 'maintenance', 'stolen', 'decommissioned', 'recovered']),
    body('notes').optional().trim(),
    validate
  ],
  trolleyController.scanTrolley
);

// GET /api/trolleys/:id/history
router.get('/:id/history', trolleyController.getTrolleyHistory);

// GET /api/trolleys/:id/qrcode - Generate QR code for trolley
router.get('/:id/qrcode', trolleyController.generateQRCode);

// POST /api/trolleys/qrcodes/bulk - Generate QR codes for multiple trolleys
router.post('/qrcodes/bulk',
  [
    body('trolley_ids').optional().isArray().withMessage('trolley_ids must be an array'),
    body('store_id').optional().isInt().withMessage('store_id must be an integer'),
    body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
    validate
  ],
  trolleyController.generateBulkQRCodes
);

// DELETE /api/trolleys/:id
router.delete('/:id', requireAdmin, trolleyController.deleteTrolley);

module.exports = router;
