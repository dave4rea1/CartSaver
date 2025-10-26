/**
 * GPS Tracking Simulation Service
 * Simulates realistic GPS movements and geofence breaches for demo purposes
 */

const { Trolley, Store } = require('../models');
const gpsService = require('./gpsService');
const { Op } = require('sequelize');

/**
 * Simulate realistic GPS movement for a trolley
 * @param {object} trolley - Trolley instance
 * @param {object} store - Store instance
 * @param {number} distanceMeters - How far to move (in meters)
 * @param {boolean} moveOutside - Whether to move outside geofence
 * @returns {object} New coordinates {latitude, longitude}
 */
function simulateMovement(trolley, store, distanceMeters = 50, moveOutside = false) {
  const storeLat = parseFloat(store.location_lat);
  const storeLong = parseFloat(store.location_long);
  const geofenceRadius = store.geofence_radius || 500;

  // Starting position - use current position or store position
  let currentLat = trolley.current_lat ? parseFloat(trolley.current_lat) : storeLat;
  let currentLong = trolley.current_long ? parseFloat(trolley.current_long) : storeLong;

  // Calculate movement
  // 1 degree latitude ≈ 111km, so for meters we divide by 111000
  const latChange = (distanceMeters / 111000) * (Math.random() - 0.5) * 2;
  // Longitude varies by latitude, but we'll use an approximation
  const longChange = (distanceMeters / (111000 * Math.cos(currentLat * Math.PI / 180))) * (Math.random() - 0.5) * 2;

  let newLat, newLong;

  if (moveOutside) {
    // Move outside the geofence
    // Calculate direction from store to current position
    const dirLat = currentLat - storeLat;
    const dirLong = currentLong - storeLong;
    const magnitude = Math.sqrt(dirLat * dirLat + dirLong * dirLong);

    if (magnitude > 0) {
      // Normalize and scale to move outside geofence
      const targetDistance = (geofenceRadius * 1.5) / 111000; // 150% of geofence radius
      newLat = storeLat + (dirLat / magnitude) * targetDistance;
      newLong = storeLong + (dirLong / magnitude) * targetDistance;
    } else {
      // If at store center, move in random direction outside geofence
      const angle = Math.random() * 2 * Math.PI;
      const distance = (geofenceRadius * 1.5) / 111000;
      newLat = storeLat + distance * Math.cos(angle);
      newLong = storeLong + distance * Math.sin(angle) / Math.cos(storeLat * Math.PI / 180);
    }
  } else {
    // Normal random movement within vicinity
    newLat = currentLat + latChange;
    newLong = currentLong + longChange;
  }

  return {
    latitude: newLat,
    longitude: newLong
  };
}

/**
 * Simulate GPS tracking for a single trolley
 * @param {number} trolleyId - Trolley ID
 * @param {object} options - Simulation options
 * @returns {object} Updated location data
 */
async function simulateSingleTrolley(trolleyId, options = {}) {
  const {
    distanceMeters = 50,
    moveOutsideGeofence = false,
    batteryLevel = Math.floor(Math.random() * 50) + 50, // 50-100%
    signalStrength = Math.floor(Math.random() * 30) + 70 // 70-100%
  } = options;

  const trolley = await Trolley.findByPk(trolleyId, {
    include: [{
      model: Store,
      as: 'store',
      attributes: ['id', 'name', 'location_lat', 'location_long', 'geofence_radius']
    }]
  });

  if (!trolley || !trolley.store) {
    throw new Error('Trolley or store not found');
  }

  // Only simulate active or recovered trolleys
  if (!['active', 'recovered'].includes(trolley.status)) {
    throw new Error('Can only simulate GPS for active or recovered trolleys');
  }

  // Generate new position
  const newPosition = simulateMovement(trolley, trolley.store, distanceMeters, moveOutsideGeofence);

  // Update location via GPS service
  const result = await gpsService.updateTrolleyLocation(trolleyId, {
    latitude: newPosition.latitude,
    longitude: newPosition.longitude,
    battery_level: batteryLevel,
    signal_strength: signalStrength
  });

  return result;
}

/**
 * Simulate GPS tracking for multiple trolleys
 * @param {object} options - Simulation options
 * @returns {object} Simulation results
 */
async function simulateMultipleTrolleys(options = {}) {
  const {
    count = 10, // Number of trolleys to simulate
    storeId = null, // Filter by store
    breachPercentage = 20 // Percentage of trolleys to move outside geofence
  } = options;

  // Get active trolleys
  const where = {
    status: {
      [Op.in]: ['active', 'recovered']
    }
  };

  if (storeId) {
    where.store_id = storeId;
  }

  const trolleys = await Trolley.findAll({
    where,
    include: [{
      model: Store,
      as: 'store'
    }],
    limit: count,
    order: [['id', 'ASC']]
  });

  const results = {
    total: trolleys.length,
    updated: 0,
    breaches: 0,
    errors: 0,
    details: []
  };

  for (const trolley of trolleys) {
    try {
      // Determine if this trolley should breach geofence
      const shouldBreach = Math.random() * 100 < breachPercentage;

      const result = await simulateSingleTrolley(trolley.id, {
        distanceMeters: Math.floor(Math.random() * 100) + 20, // 20-120m movement
        moveOutsideGeofence: shouldBreach,
        batteryLevel: Math.floor(Math.random() * 50) + 50,
        signalStrength: Math.floor(Math.random() * 30) + 70
      });

      results.updated++;
      if (result.geofence_status.breach_detected) {
        results.breaches++;
      }

      results.details.push({
        trolley_id: trolley.id,
        rfid_tag: trolley.rfid_tag,
        success: true,
        geofence_breach: result.geofence_status.breach_detected,
        distance_from_store: result.geofence_status.distance_from_store
      });
    } catch (error) {
      results.errors++;
      results.details.push({
        trolley_id: trolley.id,
        rfid_tag: trolley.rfid_tag,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Start continuous GPS simulation (for testing)
 * Updates trolley locations every N seconds
 * @param {object} options - Simulation options
 * @returns {object} Interval ID (use clearInterval to stop)
 */
function startContinuousSimulation(options = {}) {
  const {
    count = 5,
    intervalSeconds = 30,
    breachPercentage = 15,
    storeId = null
  } = options;

  console.log(`Starting GPS simulation for ${count} trolleys every ${intervalSeconds}s`);

  const intervalId = setInterval(async () => {
    try {
      const results = await simulateMultipleTrolleys({
        count,
        storeId,
        breachPercentage
      });

      console.log(`GPS Simulation: Updated ${results.updated}/${results.total} trolleys, ${results.breaches} breaches, ${results.errors} errors`);
    } catch (error) {
      console.error('GPS Simulation error:', error.message);
    }
  }, intervalSeconds * 1000);

  return intervalId;
}

/**
 * Simulate a specific geofence breach scenario
 * @param {number} trolleyId - Trolley ID
 * @param {boolean} forceInside - Force trolley back inside geofence
 * @returns {object} Updated location data
 */
async function simulateGeofenceBreach(trolleyId, forceInside = false) {
  const trolley = await Trolley.findByPk(trolleyId, {
    include: [{
      model: Store,
      as: 'store'
    }]
  });

  if (!trolley || !trolley.store) {
    throw new Error('Trolley or store not found');
  }

  if (forceInside) {
    // Move trolley back inside geofence (near store center)
    const storeLat = parseFloat(trolley.store.location_lat);
    const storeLong = parseFloat(trolley.store.location_long);

    // Add small random offset (within 50m of store)
    const offset = (50 / 111000);
    const latitude = storeLat + (Math.random() - 0.5) * offset;
    const longitude = storeLong + (Math.random() - 0.5) * offset / Math.cos(storeLat * Math.PI / 180);

    return await gpsService.updateTrolleyLocation(trolleyId, {
      latitude,
      longitude,
      battery_level: Math.floor(Math.random() * 30) + 70,
      signal_strength: Math.floor(Math.random() * 20) + 80
    });
  } else {
    // Move trolley outside geofence
    return await simulateSingleTrolley(trolleyId, {
      distanceMeters: 200,
      moveOutsideGeofence: true,
      batteryLevel: Math.floor(Math.random() * 30) + 40,
      signalStrength: Math.floor(Math.random() * 30) + 50
    });
  }
}

module.exports = {
  simulateSingleTrolley,
  simulateMultipleTrolleys,
  startContinuousSimulation,
  simulateGeofenceBreach
};
