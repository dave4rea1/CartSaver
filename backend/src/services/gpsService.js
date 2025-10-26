/**
 * GPS Location Service
 * Handles GPS tracking operations, location updates, and geofence monitoring
 */

const { Trolley, Store, TrolleyLocationHistory, Alert } = require('../models');
const {
  calculateDistance,
  isWithinGeofence,
  calculateSpeed,
  isValidCoordinates,
  getGeofenceStatus
} = require('../utils/geofence');
const { Op } = require('sequelize');

/**
 * Update trolley GPS location
 * @param {number} trolleyId - Trolley ID
 * @param {object} locationData - GPS data {latitude, longitude, battery_level, signal_strength}
 * @returns {object} Updated trolley with geofence status
 */
async function updateTrolleyLocation(trolleyId, locationData) {
  const { latitude, longitude, battery_level, signal_strength } = locationData;

  // Validate coordinates
  if (!isValidCoordinates(latitude, longitude)) {
    throw new Error('Invalid GPS coordinates');
  }

  // Get trolley with store info
  const trolley = await Trolley.findByPk(trolleyId, {
    include: [{
      model: Store,
      as: 'store',
      attributes: ['id', 'name', 'location_lat', 'location_long', 'geofence_radius']
    }]
  });

  if (!trolley) {
    throw new Error('Trolley not found');
  }

  if (!trolley.store) {
    throw new Error('Trolley has no assigned store');
  }

  // Calculate distance from store
  const distanceFromStore = calculateDistance(
    latitude,
    longitude,
    parseFloat(trolley.store.location_lat),
    parseFloat(trolley.store.location_long)
  );

  // Check geofence status
  const geofenceRadius = trolley.store.geofence_radius || 500;
  const isWithinFence = distanceFromStore <= geofenceRadius;
  const wasWithinFence = trolley.is_within_geofence;

  // Calculate speed if there's a previous location
  let speed = null;
  if (trolley.current_lat && trolley.current_long && trolley.last_location_update) {
    speed = calculateSpeed(
      parseFloat(trolley.current_lat),
      parseFloat(trolley.current_long),
      latitude,
      longitude,
      trolley.last_location_update,
      new Date()
    );
  }

  // Update trolley current location
  await trolley.update({
    current_lat: latitude,
    current_long: longitude,
    last_location_update: new Date(),
    is_within_geofence: isWithinFence
  });

  // Create location history record
  const historyRecord = await TrolleyLocationHistory.create({
    trolley_id: trolleyId,
    latitude,
    longitude,
    is_within_geofence: isWithinFence,
    distance_from_store: distanceFromStore,
    speed_kmh: speed,
    battery_level,
    signal_strength,
    timestamp: new Date()
  });

  // Detect geofence breach (trolley left the geofence)
  if (wasWithinFence && !isWithinFence) {
    await handleGeofenceBreach(trolley, distanceFromStore);
  }

  // Detect geofence re-entry (trolley returned to geofence)
  if (!wasWithinFence && isWithinFence) {
    await handleGeofenceReentry(trolley);
  }

  // Check for low battery alert
  if (battery_level && battery_level <= 20) {
    await handleLowBattery(trolley, battery_level);
  }

  return {
    trolley: await Trolley.findByPk(trolleyId, {
      include: [{
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'location_lat', 'location_long', 'geofence_radius']
      }]
    }),
    location_history: historyRecord,
    geofence_status: {
      is_within_geofence: isWithinFence,
      distance_from_store: distanceFromStore,
      geofence_radius: geofenceRadius,
      breach_detected: wasWithinFence && !isWithinFence,
      reentry_detected: !wasWithinFence && isWithinFence
    },
    speed_kmh: speed
  };
}

/**
 * Batch update multiple trolley locations
 * @param {array} updates - Array of {trolley_id, latitude, longitude, battery_level, signal_strength}
 * @returns {object} Results with success and failed updates
 */
async function batchUpdateLocations(updates) {
  const results = {
    successful: [],
    failed: []
  };

  for (const update of updates) {
    try {
      const result = await updateTrolleyLocation(update.trolley_id, {
        latitude: update.latitude,
        longitude: update.longitude,
        battery_level: update.battery_level,
        signal_strength: update.signal_strength
      });
      results.successful.push({
        trolley_id: update.trolley_id,
        ...result
      });
    } catch (error) {
      results.failed.push({
        trolley_id: update.trolley_id,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Get trolley location history
 * @param {number} trolleyId - Trolley ID
 * @param {object} options - Query options {limit, offset, startDate, endDate, geofenceViolationsOnly}
 * @returns {object} Location history with pagination
 */
async function getTrolleyLocationHistory(trolleyId, options = {}) {
  const {
    limit = 100,
    offset = 0,
    startDate,
    endDate,
    geofenceViolationsOnly = false
  } = options;

  const where = { trolley_id: trolleyId };

  // Filter by date range
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp[Op.gte] = new Date(startDate);
    if (endDate) where.timestamp[Op.lte] = new Date(endDate);
  }

  // Filter for geofence violations only
  if (geofenceViolationsOnly) {
    where.is_within_geofence = false;
  }

  const { count, rows: history } = await TrolleyLocationHistory.findAndCountAll({
    where,
    order: [['timestamp', 'DESC']],
    limit: Math.min(parseInt(limit), 1000),
    offset: parseInt(offset)
  });

  return {
    history,
    pagination: {
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: count > (parseInt(offset) + history.length)
    }
  };
}

/**
 * Get all trolleys currently outside geofence
 * @param {number} storeId - Optional store ID to filter by
 * @returns {array} Trolleys outside geofence with location info
 */
async function getTrolleysOutsideGeofence(storeId = null) {
  const where = { is_within_geofence: false };
  if (storeId) where.store_id = storeId;

  const trolleys = await Trolley.findAll({
    where,
    include: [{
      model: Store,
      as: 'store',
      attributes: ['id', 'name', 'location_lat', 'location_long', 'geofence_radius']
    }],
    order: [['last_location_update', 'DESC']]
  });

  // Calculate current distances
  return trolleys.map(trolley => {
    let distance = null;
    if (trolley.current_lat && trolley.current_long && trolley.store) {
      distance = calculateDistance(
        parseFloat(trolley.current_lat),
        parseFloat(trolley.current_long),
        parseFloat(trolley.store.location_lat),
        parseFloat(trolley.store.location_long)
      );
    }

    return {
      ...trolley.toJSON(),
      current_distance_from_store: distance
    };
  });
}

/**
 * Get real-time location data for all trolleys
 * @param {number} storeId - Optional store ID to filter by
 * @returns {array} Trolleys with current GPS locations
 */
async function getAllTrolleyLocations(storeId = null) {
  const where = {};
  if (storeId) where.store_id = storeId;

  // Only get trolleys that have GPS data
  where.current_lat = { [Op.not]: null };
  where.current_long = { [Op.not]: null };

  const trolleys = await Trolley.findAll({
    where,
    include: [{
      model: Store,
      as: 'store',
      attributes: ['id', 'name', 'location_lat', 'location_long', 'geofence_radius']
    }],
    attributes: [
      'id', 'rfid_tag', 'barcode', 'status', 'store_id',
      'current_lat', 'current_long', 'last_location_update', 'is_within_geofence'
    ],
    order: [['last_location_update', 'DESC']]
  });

  return trolleys.map(trolley => {
    let distance = null;
    if (trolley.store) {
      distance = calculateDistance(
        parseFloat(trolley.current_lat),
        parseFloat(trolley.current_long),
        parseFloat(trolley.store.location_lat),
        parseFloat(trolley.store.location_long)
      );
    }

    return {
      ...trolley.toJSON(),
      distance_from_store: distance
    };
  });
}

/**
 * Handle geofence breach - create alert
 */
async function handleGeofenceBreach(trolley, distance) {
  // Check if there's already an unresolved geofence breach alert
  const existingAlert = await Alert.findOne({
    where: {
      trolley_id: trolley.id,
      type: 'geofence_breach',
      resolved: false
    }
  });

  if (!existingAlert) {
    await Alert.create({
      store_id: trolley.store_id,
      trolley_id: trolley.id,
      type: 'geofence_breach',
      severity: 'high',
      message: `Trolley ${trolley.rfid_tag} has left the geofence area (${Math.round(distance)}m from store)`,
      resolved: false
    });
  }
}

/**
 * Handle geofence re-entry - resolve alert
 */
async function handleGeofenceReentry(trolley) {
  // Resolve any open geofence breach alerts
  await Alert.update(
    {
      resolved: true,
      resolved_at: new Date()
    },
    {
      where: {
        trolley_id: trolley.id,
        type: 'geofence_breach',
        resolved: false
      }
    }
  );
}

/**
 * Handle low battery alert
 */
async function handleLowBattery(trolley, batteryLevel) {
  // Check if there's already an unresolved low battery alert
  const existingAlert = await Alert.findOne({
    where: {
      trolley_id: trolley.id,
      type: 'low_battery',
      resolved: false
    }
  });

  if (!existingAlert) {
    await Alert.create({
      store_id: trolley.store_id,
      trolley_id: trolley.id,
      type: 'low_battery',
      severity: 'medium',
      message: `GPS tracker for trolley ${trolley.rfid_tag} has low battery (${batteryLevel}%)`,
      resolved: false
    });
  }
}

/**
 * Get location statistics for a trolley
 */
async function getLocationStats(trolleyId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await TrolleyLocationHistory.findAll({
    where: {
      trolley_id: trolleyId,
      timestamp: { [Op.gte]: startDate }
    },
    attributes: [
      'is_within_geofence',
      'distance_from_store',
      'speed_kmh',
      'timestamp'
    ],
    order: [['timestamp', 'ASC']]
  });

  const geofenceBreaches = stats.filter(s => !s.is_within_geofence).length;
  const totalRecords = stats.length;
  const avgDistance = stats.reduce((sum, s) => sum + parseFloat(s.distance_from_store || 0), 0) / totalRecords;
  const maxDistance = Math.max(...stats.map(s => parseFloat(s.distance_from_store || 0)));
  const avgSpeed = stats.filter(s => s.speed_kmh).reduce((sum, s) => sum + parseFloat(s.speed_kmh), 0) /
                   stats.filter(s => s.speed_kmh).length || 0;

  return {
    period_days: days,
    total_location_updates: totalRecords,
    geofence_breaches: geofenceBreaches,
    geofence_compliance_rate: ((totalRecords - geofenceBreaches) / totalRecords * 100).toFixed(2),
    average_distance_from_store: Math.round(avgDistance),
    max_distance_from_store: Math.round(maxDistance),
    average_speed_kmh: Math.round(avgSpeed * 100) / 100
  };
}

module.exports = {
  updateTrolleyLocation,
  batchUpdateLocations,
  getTrolleyLocationHistory,
  getTrolleysOutsideGeofence,
  getAllTrolleyLocations,
  getLocationStats
};
