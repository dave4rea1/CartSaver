/**
 * Test script for GPS API endpoints
 * Tests all GPS tracking functionality
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let authToken = null;

// Test credentials (adjust these to match your test user)
const TEST_USER = {
  email: 'admin@cartsaver.com',
  password: 'admin123'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  try {
    log('\n1. Testing Authentication...', 'blue');
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    authToken = response.data.token;
    log('✓ Authentication successful', 'green');
    return true;
  } catch (error) {
    log(`✗ Authentication failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testUpdateLocation() {
  try {
    log('\n2. Testing Single Location Update...', 'blue');

    // Update location for trolley ID 1
    const locationData = {
      trolley_id: 1,
      latitude: -33.9249,
      longitude: 18.4241,
      battery_level: 85,
      signal_strength: 90
    };

    const response = await axios.post(
      `${API_BASE}/gps/update`,
      locationData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    log('✓ Location updated successfully', 'green');
    log(`  Trolley: ${response.data.trolley.rfid_tag}`, 'yellow');
    log(`  Location: ${locationData.latitude}, ${locationData.longitude}`, 'yellow');
    log(`  Within geofence: ${response.data.geofence_status.is_within_geofence}`, 'yellow');
    log(`  Distance from store: ${Math.round(response.data.geofence_status.distance_from_store)}m`, 'yellow');

    if (response.data.geofence_status.breach_detected) {
      log('  ⚠ Geofence breach detected!', 'red');
    }

    return true;
  } catch (error) {
    log(`✗ Location update failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testBatchUpdate() {
  try {
    log('\n3. Testing Batch Location Update...', 'blue');

    const updates = [
      {
        trolley_id: 1,
        latitude: -33.9250,
        longitude: 18.4242,
        battery_level: 84,
        signal_strength: 88
      },
      {
        trolley_id: 2,
        latitude: -33.9251,
        longitude: 18.4243,
        battery_level: 90,
        signal_strength: 95
      }
    ];

    const response = await axios.post(
      `${API_BASE}/gps/batch-update`,
      { updates },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    log('✓ Batch update successful', 'green');
    log(`  Total: ${response.data.total}`, 'yellow');
    log(`  Successful: ${response.data.successful}`, 'green');
    log(`  Failed: ${response.data.failed}`, response.data.failed > 0 ? 'red' : 'yellow');

    return true;
  } catch (error) {
    log(`✗ Batch update failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testGetAllLocations() {
  try {
    log('\n4. Testing Get All Locations...', 'blue');

    const response = await axios.get(
      `${API_BASE}/gps/locations`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    log('✓ Retrieved all locations', 'green');
    log(`  Total trolleys with GPS: ${response.data.count}`, 'yellow');

    if (response.data.trolleys.length > 0) {
      const sample = response.data.trolleys[0];
      log(`  Sample - ${sample.rfid_tag}:`, 'yellow');
      log(`    Location: ${sample.current_lat}, ${sample.current_long}`, 'yellow');
      log(`    Distance: ${Math.round(sample.distance_from_store)}m`, 'yellow');
      log(`    Within geofence: ${sample.is_within_geofence}`, 'yellow');
    }

    return true;
  } catch (error) {
    log(`✗ Get all locations failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testGetCurrentLocation() {
  try {
    log('\n5. Testing Get Current Location for Specific Trolley...', 'blue');

    const response = await axios.get(
      `${API_BASE}/gps/location/1`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    log('✓ Retrieved current location', 'green');
    log(`  Trolley: ${response.data.trolley.rfid_tag}`, 'yellow');
    log(`  Location: ${response.data.trolley.current_lat}, ${response.data.trolley.current_long}`, 'yellow');
    log(`  Last update: ${new Date(response.data.trolley.last_location_update).toLocaleString()}`, 'yellow');
    log(`  Distance: ${Math.round(response.data.trolley.distance_from_store)}m`, 'yellow');
    log(`  Store: ${response.data.trolley.store.name}`, 'yellow');

    return true;
  } catch (error) {
    log(`✗ Get current location failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testGetLocationHistory() {
  try {
    log('\n6. Testing Get Location History...', 'blue');

    const response = await axios.get(
      `${API_BASE}/gps/history/1?limit=10`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    log('✓ Retrieved location history', 'green');
    log(`  Trolley: ${response.data.rfid_tag}`, 'yellow');
    log(`  Total records: ${response.data.pagination.total}`, 'yellow');
    log(`  Retrieved: ${response.data.history.length}`, 'yellow');

    if (response.data.history.length > 0) {
      const latest = response.data.history[0];
      log(`  Latest record:`, 'yellow');
      log(`    Time: ${new Date(latest.timestamp).toLocaleString()}`, 'yellow');
      log(`    Distance: ${Math.round(latest.distance_from_store)}m`, 'yellow');
      log(`    Speed: ${latest.speed_kmh ? latest.speed_kmh + ' km/h' : 'N/A'}`, 'yellow');
      log(`    Battery: ${latest.battery_level}%`, 'yellow');
    }

    return true;
  } catch (error) {
    log(`✗ Get location history failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testGetOutsideGeofence() {
  try {
    log('\n7. Testing Get Trolleys Outside Geofence...', 'blue');

    const response = await axios.get(
      `${API_BASE}/gps/outside-geofence`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    log('✓ Retrieved trolleys outside geofence', 'green');
    log(`  Count: ${response.data.count}`, response.data.count > 0 ? 'red' : 'yellow');

    if (response.data.trolleys.length > 0) {
      response.data.trolleys.forEach(trolley => {
        log(`  - ${trolley.rfid_tag}: ${Math.round(trolley.current_distance_from_store)}m from store`, 'red');
      });
    }

    return true;
  } catch (error) {
    log(`✗ Get outside geofence failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testGetLocationStats() {
  try {
    log('\n8. Testing Get Location Statistics...', 'blue');

    const response = await axios.get(
      `${API_BASE}/gps/stats/1?days=7`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    log('✓ Retrieved location statistics', 'green');
    log(`  Trolley: ${response.data.rfid_tag}`, 'yellow');
    log(`  Period: ${response.data.stats.period_days} days`, 'yellow');
    log(`  Total updates: ${response.data.stats.total_location_updates}`, 'yellow');
    log(`  Geofence breaches: ${response.data.stats.geofence_breaches}`, 'yellow');
    log(`  Compliance rate: ${response.data.stats.geofence_compliance_rate}%`, 'yellow');
    log(`  Avg distance: ${response.data.stats.average_distance_from_store}m`, 'yellow');
    log(`  Max distance: ${response.data.stats.max_distance_from_store}m`, 'yellow');
    log(`  Avg speed: ${response.data.stats.average_speed_kmh} km/h`, 'yellow');

    return true;
  } catch (error) {
    log(`✗ Get location stats failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('='.repeat(60), 'blue');
  log('GPS API Endpoint Tests', 'blue');
  log('='.repeat(60), 'blue');

  const results = {
    passed: 0,
    failed: 0
  };

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n✗ Cannot proceed without authentication', 'red');
    return;
  }

  // Run all tests
  const tests = [
    testUpdateLocation,
    testBatchUpdate,
    testGetAllLocations,
    testGetCurrentLocation,
    testGetLocationHistory,
    testGetOutsideGeofence,
    testGetLocationStats
  ];

  for (const test of tests) {
    const result = await test();
    if (result) {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('Test Summary', 'blue');
  log('='.repeat(60), 'blue');
  log(`✓ Passed: ${results.passed}`, 'green');
  log(`✗ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Total: ${results.passed + results.failed}`, 'yellow');

  if (results.failed === 0) {
    log('\n🎉 All GPS API tests passed!', 'green');
  } else {
    log('\n⚠ Some tests failed. Check the logs above.', 'red');
  }
}

// Check if server is running
axios.get(`${API_BASE.replace('/api', '')}/health`)
  .then(() => {
    log('✓ Server is running', 'green');
    runAllTests();
  })
  .catch(() => {
    log('✗ Server is not running. Please start the server first.', 'red');
    log('Run: npm start or npm run dev', 'yellow');
  });
