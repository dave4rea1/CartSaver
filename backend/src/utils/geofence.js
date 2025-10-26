/**
 * Geofence utility functions for GPS tracking
 * Uses the Haversine formula to calculate distances between GPS coordinates
 */

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the distance between two GPS coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Earth's radius in meters
  const EARTH_RADIUS = 6371000;

  // Convert coordinates to radians
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);

  // Haversine formula
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if a point is within a geofence radius
 * @param {number} pointLat - Latitude of the point to check
 * @param {number} pointLon - Longitude of the point to check
 * @param {number} centerLat - Latitude of the geofence center
 * @param {number} centerLon - Longitude of the geofence center
 * @param {number} radius - Geofence radius in meters
 * @returns {boolean} True if point is within geofence, false otherwise
 */
function isWithinGeofence(pointLat, pointLon, centerLat, centerLon, radius) {
  const distance = calculateDistance(pointLat, pointLon, centerLat, centerLon);
  return distance <= radius;
}

/**
 * Calculate speed between two GPS points
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @param {Date|number} time1 - Timestamp of first point (Date object or milliseconds)
 * @param {Date|number} time2 - Timestamp of second point (Date object or milliseconds)
 * @returns {number} Speed in km/h, rounded to 2 decimal places
 */
function calculateSpeed(lat1, lon1, lat2, lon2, time1, time2) {
  // Convert dates to milliseconds if needed
  const t1 = time1 instanceof Date ? time1.getTime() : time1;
  const t2 = time2 instanceof Date ? time2.getTime() : time2;

  // Calculate time difference in hours
  const timeDiffHours = Math.abs(t2 - t1) / (1000 * 60 * 60);

  // Avoid division by zero
  if (timeDiffHours === 0) {
    return 0;
  }

  // Calculate distance in meters
  const distanceMeters = calculateDistance(lat1, lon1, lat2, lon2);

  // Convert to km/h
  const speedKmh = (distanceMeters / 1000) / timeDiffHours;

  return Math.round(speedKmh * 100) / 100; // Round to 2 decimal places
}

/**
 * Validate GPS coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} True if coordinates are valid
 */
function isValidCoordinates(lat, lon) {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180 &&
    !isNaN(lat) &&
    !isNaN(lon)
  );
}

/**
 * Get geofence status object for a trolley location
 * @param {Object} trolley - Trolley object with current_lat, current_long
 * @param {Object} store - Store object with location_lat, location_long, geofence_radius
 * @returns {Object} Object with isWithinGeofence and distance properties
 */
function getGeofenceStatus(trolley, store) {
  if (!trolley.current_lat || !trolley.current_long) {
    return {
      isWithinGeofence: null,
      distance: null,
      error: 'Trolley location not available'
    };
  }

  if (!store.location_lat || !store.location_long) {
    return {
      isWithinGeofence: null,
      distance: null,
      error: 'Store location not available'
    };
  }

  if (!isValidCoordinates(trolley.current_lat, trolley.current_long)) {
    return {
      isWithinGeofence: null,
      distance: null,
      error: 'Invalid trolley coordinates'
    };
  }

  if (!isValidCoordinates(store.location_lat, store.location_long)) {
    return {
      isWithinGeofence: null,
      distance: null,
      error: 'Invalid store coordinates'
    };
  }

  const distance = calculateDistance(
    trolley.current_lat,
    trolley.current_long,
    store.location_lat,
    store.location_long
  );

  const radius = store.geofence_radius || 500; // Default 500 meters

  return {
    isWithinGeofence: distance <= radius,
    distance: distance,
    radius: radius
  };
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(2)}km`;
  }
}

module.exports = {
  calculateDistance,
  isWithinGeofence,
  calculateSpeed,
  isValidCoordinates,
  getGeofenceStatus,
  formatDistance
};
