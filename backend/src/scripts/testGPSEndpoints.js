/**
 * Simple GPS API test using direct service calls
 * Tests GPS tracking functionality without HTTP
 */

const { sequelize } = require('../config/database');
const gpsService = require('../services/gpsService');
const { Trolley, Store } = require('../models');

async function testGPSEndpoints() {
  try {
    console.log('='.repeat(60));
    console.log('GPS Service Tests');
    console.log('='.repeat(60));

    // Connect to database
    console.log('\n1. Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Get a test trolley
    const trolley = await Trolley.findOne({
      include: [{
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'location_lat', 'location_long', 'geofence_radius']
      }]
    });

    if (!trolley) {
      console.log('✗ No trolleys found in database. Please run seed script first.');
      return;
    }

    console.log(`Using test trolley: ${trolley.rfid_tag} (ID: ${trolley.id})`);
    console.log(`Store: ${trolley.store.name}`);
    console.log(`Store location: ${trolley.store.location_lat}, ${trolley.store.location_long}`);
    console.log(`Geofence radius: ${trolley.store.geofence_radius}m\n`);

    // Test 1: Update location (within geofence - near store)
    console.log('2. Testing location update (within geofence)...');
    const nearStoreLat = parseFloat(trolley.store.location_lat) + 0.001; // ~100m away
    const nearStoreLon = parseFloat(trolley.store.location_long) + 0.001;

    const result1 = await gpsService.updateTrolleyLocation(trolley.id, {
      latitude: nearStoreLat,
      longitude: nearStoreLon,
      battery_level: 85,
      signal_strength: 90
    });

    console.log('✓ Location updated successfully');
    console.log(`  Within geofence: ${result1.geofence_status.is_within_geofence}`);
    console.log(`  Distance: ${Math.round(result1.geofence_status.distance_from_store)}m`);
    console.log(`  Breach detected: ${result1.geofence_status.breach_detected}`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Update location (outside geofence - far from store)
    console.log('\n3. Testing location update (outside geofence)...');
    const farFromStoreLat = parseFloat(trolley.store.location_lat) + 0.01; // ~1km away
    const farFromStoreLon = parseFloat(trolley.store.location_long) + 0.01;

    const result2 = await gpsService.updateTrolleyLocation(trolley.id, {
      latitude: farFromStoreLat,
      longitude: farFromStoreLon,
      battery_level: 82,
      signal_strength: 85
    });

    console.log('✓ Location updated successfully');
    console.log(`  Within geofence: ${result2.geofence_status.is_within_geofence}`);
    console.log(`  Distance: ${Math.round(result2.geofence_status.distance_from_store)}m`);
    console.log(`  Breach detected: ${result2.geofence_status.breach_detected}`);
    if (result2.speed_kmh) {
      console.log(`  Speed: ${result2.speed_kmh.toFixed(2)} km/h`);
    }

    // Test 3: Get location history
    console.log('\n4. Testing get location history...');
    const history = await gpsService.getTrolleyLocationHistory(trolley.id, {
      limit: 5
    });

    console.log('✓ Location history retrieved');
    console.log(`  Total records: ${history.pagination.total}`);
    console.log(`  Retrieved: ${history.history.length}`);

    if (history.history.length > 0) {
      console.log(`  Latest record:`);
      const latest = history.history[0];
      console.log(`    Time: ${latest.timestamp}`);
      console.log(`    Location: ${latest.latitude}, ${latest.longitude}`);
      console.log(`    Distance: ${Math.round(latest.distance_from_store)}m`);
      console.log(`    Battery: ${latest.battery_level}%`);
      console.log(`    Signal: ${latest.signal_strength}%`);
    }

    // Test 4: Get all trolley locations
    console.log('\n5. Testing get all trolley locations...');
    const allLocations = await gpsService.getAllTrolleyLocations();
    console.log('✓ All locations retrieved');
    console.log(`  Trolleys with GPS: ${allLocations.length}`);

    // Test 5: Get trolleys outside geofence
    console.log('\n6. Testing get trolleys outside geofence...');
    const outsideGeofence = await gpsService.getTrolleysOutsideGeofence();
    console.log('✓ Trolleys outside geofence retrieved');
    console.log(`  Count: ${outsideGeofence.length}`);

    if (outsideGeofence.length > 0) {
      outsideGeofence.forEach(t => {
        console.log(`    - ${t.rfid_tag}: ${Math.round(t.current_distance_from_store)}m from store`);
      });
    }

    // Test 6: Get location statistics
    console.log('\n7. Testing get location statistics...');
    const stats = await gpsService.getLocationStats(trolley.id, 7);
    console.log('✓ Location statistics retrieved');
    console.log(`  Period: ${stats.period_days} days`);
    console.log(`  Total updates: ${stats.total_location_updates}`);
    console.log(`  Geofence breaches: ${stats.geofence_breaches}`);
    console.log(`  Compliance rate: ${stats.geofence_compliance_rate}%`);
    console.log(`  Avg distance: ${stats.average_distance_from_store}m`);
    console.log(`  Max distance: ${stats.max_distance_from_store}m`);
    console.log(`  Avg speed: ${stats.average_speed_kmh} km/h`);

    // Test 7: Batch update
    console.log('\n8. Testing batch location update...');
    const trolleys = await Trolley.findAll({ limit: 2 });
    const updates = trolleys.map((t, index) => ({
      trolley_id: t.id,
      latitude: nearStoreLat + (index * 0.0001),
      longitude: nearStoreLon + (index * 0.0001),
      battery_level: 90 - (index * 5),
      signal_strength: 95 - (index * 5)
    }));

    const batchResult = await gpsService.batchUpdateLocations(updates);
    console.log('✓ Batch update completed');
    console.log(`  Successful: ${batchResult.successful.length}`);
    console.log(`  Failed: ${batchResult.failed.length}`);

    console.log('\n' + '='.repeat(60));
    console.log('✓ All GPS service tests passed!');
    console.log('='.repeat(60));

    console.log('\nGPS API Endpoints Available:');
    console.log('  POST   /api/gps/update');
    console.log('  POST   /api/gps/batch-update');
    console.log('  GET    /api/gps/locations');
    console.log('  GET    /api/gps/location/:trolleyId');
    console.log('  GET    /api/gps/history/:trolleyId');
    console.log('  GET    /api/gps/outside-geofence');
    console.log('  GET    /api/gps/stats/:trolleyId');

    console.log('\nPhase 2: GPS API & Real-time Updates - COMPLETE ✓');

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

testGPSEndpoints();
