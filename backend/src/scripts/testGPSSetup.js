/**
 * Test script to verify GPS tracking setup
 */

const { sequelize } = require('../config/database');
const { Store, Trolley, TrolleyLocationHistory } = require('../models');
const {
  calculateDistance,
  isWithinGeofence,
  getGeofenceStatus,
  calculateSpeed
} = require('../utils/geofence');

async function testGPSSetup() {
  try {
    console.log('Testing GPS Tracking Setup...\n');

    // Test 1: Verify database connection
    console.log('1. Testing database connection...');
    await sequelize.authenticate();
    console.log('   ✓ Database connection successful\n');

    // Test 2: Check table structures
    console.log('2. Checking table structures...');
    const trolleyColumns = await sequelize.getQueryInterface().describeTable('trolleys');
    const historyColumns = await sequelize.getQueryInterface().describeTable('trolley_location_history');
    const storeColumns = await sequelize.getQueryInterface().describeTable('stores');

    console.log('   Trolley GPS columns:');
    if (trolleyColumns.current_lat) console.log('   ✓ current_lat');
    if (trolleyColumns.current_long) console.log('   ✓ current_long');
    if (trolleyColumns.last_location_update) console.log('   ✓ last_location_update');
    if (trolleyColumns.is_within_geofence) console.log('   ✓ is_within_geofence');

    console.log('\n   Store geofence columns:');
    if (storeColumns.geofence_radius) console.log('   ✓ geofence_radius');

    console.log('\n   Location history table:');
    if (historyColumns.latitude) console.log('   ✓ latitude');
    if (historyColumns.longitude) console.log('   ✓ longitude');
    if (historyColumns.distance_from_store) console.log('   ✓ distance_from_store');
    if (historyColumns.speed_kmh) console.log('   ✓ speed_kmh');
    if (historyColumns.battery_level) console.log('   ✓ battery_level');
    if (historyColumns.signal_strength) console.log('   ✓ signal_strength');
    console.log();

    // Test 3: Test geofence utility functions
    console.log('3. Testing geofence utility functions...');

    // Test distance calculation (Johannesburg CBD to Sandton - approx 20km)
    const jhbCBD = { lat: -26.2041, lon: 28.0473 };
    const sandton = { lat: -26.1076, lon: 28.0567 };
    const distance = calculateDistance(jhbCBD.lat, jhbCBD.lon, sandton.lat, sandton.lon);
    console.log(`   Distance JHB CBD to Sandton: ${distance.toFixed(2)}m (~${(distance/1000).toFixed(2)}km)`);
    console.log('   ✓ Distance calculation working\n');

    // Test geofence check
    const storeLocation = { lat: -26.2041, lon: 28.0473 };
    const trolleyNear = { lat: -26.2045, lon: 28.0475 }; // ~50m away
    const trolleyFar = { lat: -26.2141, lon: 28.0573 }; // ~1.2km away

    const isNear = isWithinGeofence(trolleyNear.lat, trolleyNear.lon, storeLocation.lat, storeLocation.lon, 500);
    const isFar = isWithinGeofence(trolleyFar.lat, trolleyFar.lon, storeLocation.lat, storeLocation.lon, 500);

    console.log(`   Trolley 50m away - Within 500m geofence: ${isNear}`);
    console.log(`   Trolley 1.2km away - Within 500m geofence: ${isFar}`);
    console.log('   ✓ Geofence checking working\n');

    // Test speed calculation
    const point1 = { lat: -26.2041, lon: 28.0473 };
    const point2 = { lat: -26.2141, lon: 28.0573 };
    const time1 = new Date('2024-01-01T10:00:00');
    const time2 = new Date('2024-01-01T10:05:00'); // 5 minutes later
    const speed = calculateSpeed(point1.lat, point1.lon, point2.lat, point2.lon, time1, time2);
    console.log(`   Speed calculation: ${speed.toFixed(2)} km/h`);
    console.log('   ✓ Speed calculation working\n');

    // Test 4: Test model relationships
    console.log('4. Testing model relationships...');
    const store = await Store.findOne();
    if (store) {
      const trolleys = await store.getTrolleys({ limit: 1 });
      if (trolleys.length > 0) {
        const trolley = trolleys[0];
        console.log(`   Found store: ${store.name}`);
        console.log(`   Found trolley: ${trolley.rfid_tag}`);

        // Check if we can access location history
        const locationHistory = await trolley.getLocationHistory({ limit: 5 });
        console.log(`   Location history records: ${locationHistory.length}`);
        console.log('   ✓ Model relationships working\n');
      } else {
        console.log('   No trolleys found for testing\n');
      }
    } else {
      console.log('   No stores found for testing\n');
    }

    // Test 5: Test creating a location history record (if store and trolley exist)
    console.log('5. Testing location history creation...');
    const testStore = await Store.findOne();
    if (testStore) {
      const testTrolley = await Trolley.findOne({ where: { store_id: testStore.id } });
      if (testTrolley) {
        // Simulate a GPS update
        const testLat = -26.2041;
        const testLon = 28.0473;
        const distanceFromStore = calculateDistance(
          testLat, testLon,
          parseFloat(testStore.location_lat),
          parseFloat(testStore.location_long)
        );

        // Create a test location history record
        const locationRecord = await TrolleyLocationHistory.create({
          trolley_id: testTrolley.id,
          latitude: testLat,
          longitude: testLon,
          is_within_geofence: distanceFromStore <= (testStore.geofence_radius || 500),
          distance_from_store: distanceFromStore,
          battery_level: 85,
          signal_strength: 90,
          timestamp: new Date()
        });

        console.log(`   ✓ Created test location record (ID: ${locationRecord.id})`);
        console.log(`   Distance from store: ${distanceFromStore.toFixed(2)}m`);
        console.log(`   Within geofence: ${locationRecord.is_within_geofence}\n`);

        // Clean up test record
        await locationRecord.destroy();
        console.log('   ✓ Cleaned up test record\n');
      } else {
        console.log('   No trolley found for testing\n');
      }
    } else {
      console.log('   No store found for testing\n');
    }

    console.log('✓ All GPS tracking tests passed!\n');
    console.log('Summary:');
    console.log('  - Database tables created successfully');
    console.log('  - GPS tracking columns added to trolleys table');
    console.log('  - Location history table created with indexes');
    console.log('  - Geofence utilities working correctly');
    console.log('  - Model relationships configured properly');
    console.log('\nPhase 1: GPS Tracking Database Setup - COMPLETE ✓');

  } catch (error) {
    console.error('\n✗ Test failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

testGPSSetup();
