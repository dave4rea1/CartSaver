/**
 * GPS Tracking Controller
 * Handles HTTP requests for GPS tracking operations
 */

const gpsService = require('../services/gpsService');
const gpsSimulation = require('../services/gpsSimulation');
const { Trolley } = require('../models');

/**
 * Update single trolley location
 * POST /api/gps/update
 * Body: { trolley_id, latitude, longitude, battery_level, signal_strength }
 */
exports.updateLocation = async (req, res) => {
  try {
    const { trolley_id, latitude, longitude, battery_level, signal_strength } = req.body;

    // Validation
    if (!trolley_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: trolley_id, latitude, longitude'
      });
    }

    const result = await gpsService.updateTrolleyLocation(trolley_id, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      battery_level: battery_level ? parseInt(battery_level) : null,
      signal_strength: signal_strength ? parseInt(signal_strength) : null
    });

    res.json({
      message: 'Location updated successfully',
      ...result
    });
  } catch (error) {
    if (error.message === 'Trolley not found' || error.message === 'Trolley has no assigned store') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Invalid GPS coordinates') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * Batch update multiple trolley locations
 * POST /api/gps/batch-update
 * Body: { updates: [{ trolley_id, latitude, longitude, battery_level, signal_strength }, ...] }
 */
exports.batchUpdateLocations = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        error: 'Updates array is required and must not be empty'
      });
    }

    // Validate each update has required fields
    const invalid = updates.filter(u => !u.trolley_id || u.latitude === undefined || u.longitude === undefined);
    if (invalid.length > 0) {
      return res.status(400).json({
        error: 'Each update must have trolley_id, latitude, and longitude',
        invalid_count: invalid.length
      });
    }

    const results = await gpsService.batchUpdateLocations(updates);

    res.json({
      message: 'Batch update completed',
      total: updates.length,
      successful: results.successful.length,
      failed: results.failed.length,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get trolley location history
 * GET /api/gps/history/:trolleyId
 * Query params: limit, offset, startDate, endDate, geofenceViolationsOnly
 */
exports.getLocationHistory = async (req, res) => {
  try {
    const { trolleyId } = req.params;
    const { limit, offset, startDate, endDate, geofenceViolationsOnly } = req.query;

    // Check if trolley exists
    const trolley = await Trolley.findByPk(trolleyId);
    if (!trolley) {
      return res.status(404).json({ error: 'Trolley not found' });
    }

    const result = await gpsService.getTrolleyLocationHistory(trolleyId, {
      limit,
      offset,
      startDate,
      endDate,
      geofenceViolationsOnly: geofenceViolationsOnly === 'true'
    });

    res.json({
      trolley_id: trolleyId,
      rfid_tag: trolley.rfid_tag,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all trolleys with current GPS locations
 * GET /api/gps/locations
 * Query params: store_id (optional)
 */
exports.getAllLocations = async (req, res) => {
  try {
    const { store_id } = req.query;

    const trolleys = await gpsService.getAllTrolleyLocations(
      store_id ? parseInt(store_id) : null
    );

    res.json({
      count: trolleys.length,
      trolleys
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get trolleys currently outside geofence
 * GET /api/gps/outside-geofence
 * Query params: store_id (optional)
 */
exports.getTrolleysOutsideGeofence = async (req, res) => {
  try {
    const { store_id } = req.query;

    const trolleys = await gpsService.getTrolleysOutsideGeofence(
      store_id ? parseInt(store_id) : null
    );

    res.json({
      count: trolleys.length,
      trolleys
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get location statistics for a trolley
 * GET /api/gps/stats/:trolleyId
 * Query params: days (default: 7)
 */
exports.getLocationStats = async (req, res) => {
  try {
    const { trolleyId } = req.params;
    const { days = 7 } = req.query;

    // Check if trolley exists
    const trolley = await Trolley.findByPk(trolleyId);
    if (!trolley) {
      return res.status(404).json({ error: 'Trolley not found' });
    }

    const stats = await gpsService.getLocationStats(trolleyId, parseInt(days));

    res.json({
      trolley_id: trolleyId,
      rfid_tag: trolley.rfid_tag,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get current location for a specific trolley
 * GET /api/gps/location/:trolleyId
 */
exports.getCurrentLocation = async (req, res) => {
  try {
    const { trolleyId } = req.params;

    const trolley = await Trolley.findByPk(trolleyId, {
      include: [{
        model: require('../models/Store'),
        as: 'store',
        attributes: ['id', 'name', 'location_lat', 'location_long', 'geofence_radius']
      }]
    });

    if (!trolley) {
      return res.status(404).json({ error: 'Trolley not found' });
    }

    if (!trolley.current_lat || !trolley.current_long) {
      return res.status(404).json({
        error: 'No GPS location available for this trolley',
        trolley_id: trolleyId,
        rfid_tag: trolley.rfid_tag
      });
    }

    // Calculate distance from store
    let distanceFromStore = null;
    if (trolley.store) {
      const { calculateDistance } = require('../utils/geofence');
      distanceFromStore = calculateDistance(
        parseFloat(trolley.current_lat),
        parseFloat(trolley.current_long),
        parseFloat(trolley.store.location_lat),
        parseFloat(trolley.store.location_long)
      );
    }

    res.json({
      trolley: {
        id: trolley.id,
        rfid_tag: trolley.rfid_tag,
        barcode: trolley.barcode,
        status: trolley.status,
        current_lat: trolley.current_lat,
        current_long: trolley.current_long,
        last_location_update: trolley.last_location_update,
        is_within_geofence: trolley.is_within_geofence,
        distance_from_store: distanceFromStore,
        store: trolley.store
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * SIMULATION ENDPOINTS - FOR DEMO/TESTING ONLY
 */

/**
 * Simulate GPS tracking for a single trolley
 * POST /api/gps/simulate/single
 * Body: { trolley_id, distance_meters, move_outside_geofence, battery_level, signal_strength }
 */
exports.simulateSingle = async (req, res) => {
  try {
    const { trolley_id, distance_meters, move_outside_geofence, battery_level, signal_strength } = req.body;

    if (!trolley_id) {
      return res.status(400).json({ error: 'trolley_id is required' });
    }

    const result = await gpsSimulation.simulateSingleTrolley(trolley_id, {
      distanceMeters: distance_meters,
      moveOutsideGeofence: move_outside_geofence,
      batteryLevel: battery_level,
      signalStrength: signal_strength
    });

    res.json({
      message: 'GPS location simulated successfully',
      ...result
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Can only simulate')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * Simulate GPS tracking for multiple trolleys
 * POST /api/gps/simulate/multiple
 * Body: { count, store_id, breach_percentage }
 */
exports.simulateMultiple = async (req, res) => {
  try {
    const { count, store_id, breach_percentage } = req.body;

    const results = await gpsSimulation.simulateMultipleTrolleys({
      count: count || 10,
      storeId: store_id,
      breachPercentage: breach_percentage || 20
    });

    res.json({
      message: 'GPS simulation completed',
      ...results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Simulate geofence breach for a specific trolley
 * POST /api/gps/simulate/breach
 * Body: { trolley_id, force_inside }
 */
exports.simulateBreach = async (req, res) => {
  try {
    const { trolley_id, force_inside } = req.body;

    if (!trolley_id) {
      return res.status(400).json({ error: 'trolley_id is required' });
    }

    const result = await gpsSimulation.simulateGeofenceBreach(trolley_id, force_inside);

    res.json({
      message: force_inside ? 'Trolley moved back inside geofence' : 'Geofence breach simulated',
      ...result
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};
