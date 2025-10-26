const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');
const { cacheMiddleware, cacheKeyGenerators, clearCache } = require('../middleware/cacheMiddleware');
const storeController = require('../controllers/storeController');

// All routes require authentication
router.use(authMiddleware);

// GET /api/stores - Cache for 15 minutes (stores don't change often)
router.get('/',
  cacheMiddleware(900, cacheKeyGenerators.storeList),
  storeController.getAllStores
);

// GET /api/stores/:id - Cache for 10 minutes
router.get('/:id',
  cacheMiddleware(600, cacheKeyGenerators.store),
  storeController.getStoreById
);

// POST /api/stores
router.post('/',
  requireAdmin,
  [
    body('name').notEmpty().trim().withMessage('Store name is required'),
    body('location_lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('location_long').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    body('address').optional().trim(),
    body('active_threshold').optional().isInt({ min: 0 }).withMessage('Threshold must be a positive integer'),
    validate
  ],
  storeController.createStore
);

// PUT /api/stores/:id
router.put('/:id',
  requireAdmin,
  [
    body('name').optional().trim(),
    body('location_lat').optional().isFloat({ min: -90, max: 90 }),
    body('location_long').optional().isFloat({ min: -180, max: 180 }),
    body('address').optional().trim(),
    body('active_threshold').optional().isInt({ min: 0 }),
    validate
  ],
  storeController.updateStore
);

// DELETE /api/stores/:id
router.delete('/:id', requireAdmin, storeController.deleteStore);

// GET /api/stores/:id/trolleys
router.get('/:id/trolleys', storeController.getStoreTrolleys);

module.exports = router;
