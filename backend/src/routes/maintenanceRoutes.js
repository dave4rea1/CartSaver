const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');
const maintenanceController = require('../controllers/maintenanceController');

// All routes require authentication
router.use(authMiddleware);

// GET /api/maintenance
router.get('/', maintenanceController.getAllMaintenance);

// GET /api/maintenance/:id
router.get('/:id', maintenanceController.getMaintenanceById);

// POST /api/maintenance
router.post('/',
  [
    body('trolley_id').isInt().withMessage('Valid trolley ID is required'),
    body('maintenance_date').optional().isISO8601().toDate(),
    body('description').notEmpty().trim().withMessage('Description is required'),
    body('technician').optional().trim(),
    body('status_after').optional().trim(),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    validate
  ],
  maintenanceController.createMaintenanceRecord
);

// GET /api/maintenance/trolley/:trolley_id
router.get('/trolley/:trolley_id', maintenanceController.getTrolleyMaintenance);

// PUT /api/maintenance/:id
router.put('/:id',
  requireAdmin,
  [
    body('maintenance_date').optional().isISO8601().toDate(),
    body('description').optional().trim(),
    body('technician').optional().trim(),
    body('status_after').optional().trim(),
    body('cost').optional().isFloat({ min: 0 }),
    validate
  ],
  maintenanceController.updateMaintenanceRecord
);

// DELETE /api/maintenance/:id
router.delete('/:id', requireAdmin, maintenanceController.deleteMaintenanceRecord);

module.exports = router;
