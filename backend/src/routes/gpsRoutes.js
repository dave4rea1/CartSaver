/**
 * GPS Tracking Routes
 */

const express = require('express');
const router = express.Router();
const gpsController = require('../controllers/gpsController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/gps/update
 * @desc    Update single trolley GPS location
 * @access  Private
 * @body    { trolley_id, latitude, longitude, battery_level, signal_strength }
 */
router.post('/update', gpsController.updateLocation);

/**
 * @route   POST /api/gps/batch-update
 * @desc    Batch update multiple trolley locations
 * @access  Private
 * @body    { updates: [{ trolley_id, latitude, longitude, battery_level, signal_strength }] }
 */
router.post('/batch-update', gpsController.batchUpdateLocations);

/**
 * @route   GET /api/gps/locations
 * @desc    Get all trolleys with current GPS locations
 * @access  Private
 * @query   store_id (optional)
 */
router.get('/locations', gpsController.getAllLocations);

/**
 * @route   GET /api/gps/location/:trolleyId
 * @desc    Get current location for specific trolley
 * @access  Private
 */
router.get('/location/:trolleyId', gpsController.getCurrentLocation);

/**
 * @route   GET /api/gps/history/:trolleyId
 * @desc    Get location history for a trolley
 * @access  Private
 * @query   limit, offset, startDate, endDate, geofenceViolationsOnly
 */
router.get('/history/:trolleyId', gpsController.getLocationHistory);

/**
 * @route   GET /api/gps/outside-geofence
 * @desc    Get all trolleys currently outside geofence
 * @access  Private
 * @query   store_id (optional)
 */
router.get('/outside-geofence', gpsController.getTrolleysOutsideGeofence);

/**
 * @route   GET /api/gps/stats/:trolleyId
 * @desc    Get location statistics for a trolley
 * @access  Private
 * @query   days (default: 7)
 */
router.get('/stats/:trolleyId', gpsController.getLocationStats);

/**
 * SIMULATION ROUTES - FOR DEMO/TESTING ONLY
 */

/**
 * @route   POST /api/gps/simulate/single
 * @desc    Simulate GPS tracking for a single trolley
 * @access  Private
 * @body    { trolley_id, distance_meters, move_outside_geofence, battery_level, signal_strength }
 */
router.post('/simulate/single', gpsController.simulateSingle);

/**
 * @route   POST /api/gps/simulate/multiple
 * @desc    Simulate GPS tracking for multiple trolleys
 * @access  Private
 * @body    { count, store_id, breach_percentage }
 */
router.post('/simulate/multiple', gpsController.simulateMultiple);

/**
 * @route   POST /api/gps/simulate/breach
 * @desc    Simulate geofence breach for a specific trolley
 * @access  Private
 * @body    { trolley_id, force_inside }
 */
router.post('/simulate/breach', gpsController.simulateBreach);

module.exports = router;
