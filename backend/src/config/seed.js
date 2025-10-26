require('dotenv').config();
const { sequelize } = require('./database');
const { User, Store, Trolley, StatusHistory, MaintenanceRecord, Alert } = require('../models');

const seedDatabase = async () => {
  try {
    console.log('Starting database seed...');

    // Sync database (drop and recreate tables)
    await sequelize.sync({ force: true });
    console.log('Database tables created');

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@cartsaver.com',
      password_hash: 'admin123',
      role: 'admin'
    });

    const staff1 = await User.create({
      name: 'John Smith',
      email: 'john@cartsaver.com',
      password_hash: 'staff123',
      role: 'staff'
    });

    const staff2 = await User.create({
      name: 'Sarah Johnson',
      email: 'sarah@cartsaver.com',
      password_hash: 'staff123',
      role: 'staff'
    });

    console.log('✓ Created users');

    // Create stores - Phase 2B: 18+ stores across 4 provinces
    const stores = await Store.bulkCreate([
      // WESTERN CAPE - 5 stores
      {
        name: 'Shoprite Durbanville',
        brand: 'Shoprite',
        address: 'Langeberg Mall, Main Road, Durbanville',
        city: 'Durbanville',
        province: 'Western Cape',
        postal_code: '7550',
        location_lat: -33.8356,
        location_long: 18.6481,
        geofence_radius: 500,
        active_threshold: 80,
        total_capacity: 200,
        operating_hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM'
      },
      {
        name: 'Shoprite Kraaifontein',
        brand: 'Shoprite',
        address: 'Scottsdene Shopping Centre, Kraaifontein',
        city: 'Kraaifontein',
        province: 'Western Cape',
        postal_code: '7570',
        location_lat: -33.8547,
        location_long: 18.7189,
        geofence_radius: 450,
        active_threshold: 70,
        total_capacity: 180,
        operating_hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM'
      },
      {
        name: 'Shoprite Cape Town CBD',
        brand: 'Shoprite',
        address: 'OK Bazaars Building, 52 Plein Street, Cape Town',
        city: 'Cape Town',
        province: 'Western Cape',
        postal_code: '8001',
        location_lat: -33.9249,
        location_long: 18.4241,
        geofence_radius: 300,
        active_threshold: 100,
        total_capacity: 250,
        operating_hours: 'Mon-Sat: 7AM-9PM, Sun: 8AM-7PM'
      },
      {
        name: 'Checkers Durbanville',
        brand: 'Checkers',
        address: 'Durbanville Medi-Clinic Centre, Durbanville',
        city: 'Durbanville',
        province: 'Western Cape',
        postal_code: '7550',
        location_lat: -33.8289,
        location_long: 18.6532,
        geofence_radius: 400,
        active_threshold: 75,
        total_capacity: 190,
        operating_hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM'
      },
      {
        name: 'Checkers Sea Point',
        brand: 'Checkers',
        address: 'Regent Road, Sea Point, Cape Town',
        city: 'Cape Town',
        province: 'Western Cape',
        postal_code: '8005',
        location_lat: -33.9186,
        location_long: 18.3903,
        geofence_radius: 350,
        active_threshold: 60,
        total_capacity: 150,
        operating_hours: 'Mon-Sat: 7AM-9PM, Sun: 8AM-7PM'
      },

      // GAUTENG - 5 stores
      {
        name: 'Shoprite Sandton',
        brand: 'Shoprite',
        address: 'Sandton City Shopping Centre, Sandton',
        city: 'Sandton',
        province: 'Gauteng',
        postal_code: '2196',
        location_lat: -26.1076,
        location_long: 28.0567,
        geofence_radius: 600,
        active_threshold: 120,
        total_capacity: 300,
        operating_hours: 'Mon-Sun: 9AM-9PM'
      },
      {
        name: 'Shoprite Midrand',
        brand: 'Shoprite',
        address: 'Boulders Shopping Centre, Midrand',
        city: 'Midrand',
        province: 'Gauteng',
        postal_code: '1685',
        location_lat: -25.9895,
        location_long: 28.1251,
        geofence_radius: 500,
        active_threshold: 90,
        total_capacity: 220,
        operating_hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-7PM'
      },
      {
        name: 'Shoprite Soweto',
        brand: 'Shoprite',
        address: 'Jabulani Mall, Soweto',
        city: 'Soweto',
        province: 'Gauteng',
        postal_code: '1868',
        location_lat: -26.2431,
        location_long: 27.8736,
        geofence_radius: 550,
        active_threshold: 85,
        total_capacity: 210,
        operating_hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM'
      },
      {
        name: 'Checkers Rosebank',
        brand: 'Checkers',
        address: 'The Zone @ Rosebank, Rosebank',
        city: 'Rosebank',
        province: 'Gauteng',
        postal_code: '2196',
        location_lat: -26.1467,
        location_long: 28.0423,
        geofence_radius: 450,
        active_threshold: 80,
        total_capacity: 200,
        operating_hours: 'Mon-Sun: 8AM-9PM'
      },
      {
        name: 'Checkers Fourways',
        brand: 'Checkers',
        address: 'Fourways Mall, Fourways',
        city: 'Fourways',
        province: 'Gauteng',
        postal_code: '2055',
        location_lat: -26.0167,
        location_long: 28.0089,
        geofence_radius: 600,
        active_threshold: 100,
        total_capacity: 250,
        operating_hours: 'Mon-Sun: 9AM-9PM'
      },

      // NORTH WEST - 3 stores
      {
        name: 'Shoprite Rustenburg',
        brand: 'Shoprite',
        address: 'Waterfall Mall, Rustenburg',
        city: 'Rustenburg',
        province: 'North West',
        postal_code: '0299',
        location_lat: -25.6691,
        location_long: 27.2419,
        geofence_radius: 500,
        active_threshold: 70,
        total_capacity: 180,
        operating_hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM'
      },
      {
        name: 'Shoprite Potchefstroom',
        brand: 'Shoprite',
        address: 'Mooirivier Mall, Potchefstroom',
        city: 'Potchefstroom',
        province: 'North West',
        postal_code: '2531',
        location_lat: -26.7145,
        location_long: 27.0974,
        geofence_radius: 450,
        active_threshold: 65,
        total_capacity: 170,
        operating_hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM'
      },
      {
        name: 'Checkers Rustenburg',
        brand: 'Checkers',
        address: 'Rustenburg Square, Rustenburg',
        city: 'Rustenburg',
        province: 'North West',
        postal_code: '0299',
        location_lat: -25.6623,
        location_long: 27.2347,
        geofence_radius: 400,
        active_threshold: 60,
        total_capacity: 160,
        operating_hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM'
      },

      // KWAZULU-NATAL - 4 stores
      {
        name: 'Shoprite Durban',
        brand: 'Shoprite',
        address: 'Gateway Theatre of Shopping, Umhlanga, Durban',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postal_code: '4319',
        location_lat: -29.7281,
        location_long: 31.0611,
        geofence_radius: 700,
        active_threshold: 150,
        total_capacity: 350,
        operating_hours: 'Mon-Sun: 9AM-9PM'
      },
      {
        name: 'Shoprite Pietermaritzburg',
        brand: 'Shoprite',
        address: 'Liberty Midlands Mall, Pietermaritzburg',
        city: 'Pietermaritzburg',
        province: 'KwaZulu-Natal',
        postal_code: '3201',
        location_lat: -29.6157,
        location_long: 30.3951,
        geofence_radius: 500,
        active_threshold: 75,
        total_capacity: 190,
        operating_hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-7PM'
      },
      {
        name: 'Checkers Durban North',
        brand: 'Checkers',
        address: 'Hyper by the Sea, Durban North',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postal_code: '4051',
        location_lat: -29.7879,
        location_long: 31.0456,
        geofence_radius: 550,
        active_threshold: 95,
        total_capacity: 230,
        operating_hours: 'Mon-Sun: 8AM-9PM'
      },
      {
        name: 'Checkers Ballito',
        brand: 'Checkers',
        address: 'Ballito Junction, Ballito',
        city: 'Ballito',
        province: 'KwaZulu-Natal',
        postal_code: '4420',
        location_lat: -29.5389,
        location_long: 31.2133,
        geofence_radius: 500,
        active_threshold: 70,
        total_capacity: 180,
        operating_hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-7PM'
      }
    ]);

    console.log(`✓ Created ${stores.length} stores across 4 provinces`);

    // Create trolleys - distribute across all stores with varied health scores
    const trolleys = [];

    // Define health score targets for each store
    // Health Score: Good (70-100%), Moderate (40-69%), Bad (0-39%)
    const storeHealthConfig = {
      'Shoprite Kraaifontein': { targetScore: 32, activeRate: 0.35, maintenanceRate: 0.45, stolenRate: 0.10, decommissionedRate: 0.05, recoveredRate: 0.05 }, // Bad
      'Checkers Durbanville': { targetScore: 83, activeRate: 0.90, maintenanceRate: 0.08, stolenRate: 0.01, decommissionedRate: 0.005, recoveredRate: 0.005 }, // Good
      'Shoprite Durbanville': { targetScore: 75, activeRate: 0.82, maintenanceRate: 0.12, stolenRate: 0.02, decommissionedRate: 0.02, recoveredRate: 0.02 }, // Good
      'Shoprite Cape Town CBD': { targetScore: 68, activeRate: 0.72, maintenanceRate: 0.18, stolenRate: 0.04, decommissionedRate: 0.03, recoveredRate: 0.03 }, // Moderate
      'Checkers Sea Point': { targetScore: 55, activeRate: 0.62, maintenanceRate: 0.25, stolenRate: 0.06, decommissionedRate: 0.04, recoveredRate: 0.03 }, // Moderate
      'Shoprite Sandton': { targetScore: 78, activeRate: 0.85, maintenanceRate: 0.10, stolenRate: 0.01, decommissionedRate: 0.02, recoveredRate: 0.02 }, // Good
      'Shoprite Midrand': { targetScore: 45, activeRate: 0.52, maintenanceRate: 0.30, stolenRate: 0.08, decommissionedRate: 0.05, recoveredRate: 0.05 }, // Moderate
      'Shoprite Soweto': { targetScore: 38, activeRate: 0.45, maintenanceRate: 0.35, stolenRate: 0.10, decommissionedRate: 0.06, recoveredRate: 0.04 }, // Bad
      'Checkers Rosebank': { targetScore: 72, activeRate: 0.80, maintenanceRate: 0.14, stolenRate: 0.02, decommissionedRate: 0.02, recoveredRate: 0.02 }, // Good
      'Checkers Fourways': { targetScore: 65, activeRate: 0.70, maintenanceRate: 0.20, stolenRate: 0.03, decommissionedRate: 0.04, recoveredRate: 0.03 }, // Moderate
      'Shoprite Rustenburg': { targetScore: 58, activeRate: 0.65, maintenanceRate: 0.22, stolenRate: 0.05, decommissionedRate: 0.05, recoveredRate: 0.03 }, // Moderate
      'Shoprite Potchefstroom': { targetScore: 35, activeRate: 0.42, maintenanceRate: 0.38, stolenRate: 0.10, decommissionedRate: 0.06, recoveredRate: 0.04 }, // Bad
      'Checkers Rustenburg': { targetScore: 48, activeRate: 0.55, maintenanceRate: 0.28, stolenRate: 0.08, decommissionedRate: 0.05, recoveredRate: 0.04 }, // Moderate
      'Shoprite Durban': { targetScore: 82, activeRate: 0.88, maintenanceRate: 0.08, stolenRate: 0.01, decommissionedRate: 0.015, recoveredRate: 0.015 }, // Good
      'Shoprite Pietermaritzburg': { targetScore: 62, activeRate: 0.68, maintenanceRate: 0.22, stolenRate: 0.04, decommissionedRate: 0.03, recoveredRate: 0.03 }, // Moderate
      'Checkers Durban North': { targetScore: 71, activeRate: 0.78, maintenanceRate: 0.16, stolenRate: 0.02, decommissionedRate: 0.02, recoveredRate: 0.02 }, // Good
      'Checkers Ballito': { targetScore: 52, activeRate: 0.60, maintenanceRate: 0.26, stolenRate: 0.06, decommissionedRate: 0.04, recoveredRate: 0.04 } // Moderate
    };

    // Create trolleys for each store based on their health score configuration
    let trolleyIdCounter = 1;
    for (const store of stores) {
      const trolleyCount = Math.floor(store.total_capacity * 0.75); // 75% of capacity
      const config = storeHealthConfig[store.name] || {
        activeRate: 0.75,
        maintenanceRate: 0.15,
        stolenRate: 0.05,
        decommissionedRate: 0.03,
        recoveredRate: 0.02
      };

      // Calculate trolley counts for each status
      const activeCount = Math.floor(trolleyCount * config.activeRate);
      const maintenanceCount = Math.floor(trolleyCount * config.maintenanceRate);
      const stolenCount = Math.floor(trolleyCount * config.stolenRate);
      const decommissionedCount = Math.floor(trolleyCount * config.decommissionedRate);
      const recoveredCount = Math.max(0, trolleyCount - activeCount - maintenanceCount - stolenCount - decommissionedCount);

      // Create active trolleys
      for (let i = 0; i < activeCount; i++) {
        const daysAgo = Math.floor(Math.random() * 5); // Recently scanned
        const lastScanned = new Date();
        lastScanned.setDate(lastScanned.getDate() - daysAgo);

        trolleys.push({
          rfid_tag: `RFID-${String(trolleyIdCounter).padStart(5, '0')}`,
          barcode: `BC-${String(trolleyIdCounter).padStart(5, '0')}`,
          status: 'active',
          store_id: store.id,
          last_scanned: lastScanned,
          is_default_barcode: false
        });
        trolleyIdCounter++;
      }

      // Create maintenance trolleys
      for (let i = 0; i < maintenanceCount; i++) {
        const daysAgo = Math.floor(Math.random() * 15) + 5;
        const lastScanned = new Date();
        lastScanned.setDate(lastScanned.getDate() - daysAgo);

        trolleys.push({
          rfid_tag: `RFID-${String(trolleyIdCounter).padStart(5, '0')}`,
          barcode: `BC-${String(trolleyIdCounter).padStart(5, '0')}`,
          status: 'maintenance',
          store_id: store.id,
          last_scanned: lastScanned,
          is_default_barcode: false
        });
        trolleyIdCounter++;
      }

      // Create stolen trolleys
      for (let i = 0; i < stolenCount; i++) {
        trolleys.push({
          rfid_tag: `RFID-${String(trolleyIdCounter).padStart(5, '0')}`,
          barcode: `STOLEN-${String(trolleyIdCounter).padStart(5, '0')}`,
          status: 'stolen',
          store_id: store.id,
          last_scanned: null,
          is_default_barcode: true
        });
        trolleyIdCounter++;
      }

      // Create decommissioned trolleys
      for (let i = 0; i < decommissionedCount; i++) {
        const daysAgo = Math.floor(Math.random() * 60) + 30; // Decommissioned 1-3 months ago
        const lastScanned = new Date();
        lastScanned.setDate(lastScanned.getDate() - daysAgo);

        trolleys.push({
          rfid_tag: `RFID-${String(trolleyIdCounter).padStart(5, '0')}`,
          barcode: `DECOM-${String(trolleyIdCounter).padStart(5, '0')}`,
          status: 'decommissioned',
          store_id: store.id,
          last_scanned: lastScanned,
          is_default_barcode: true
        });
        trolleyIdCounter++;
      }

      // Create recovered trolleys
      for (let i = 0; i < recoveredCount; i++) {
        const daysAgo = Math.floor(Math.random() * 10) + 2;
        const lastScanned = new Date();
        lastScanned.setDate(lastScanned.getDate() - daysAgo);

        trolleys.push({
          rfid_tag: `RFID-${String(trolleyIdCounter).padStart(5, '0')}`,
          barcode: `BC-${String(trolleyIdCounter).padStart(5, '0')}`,
          status: 'recovered',
          store_id: store.id,
          last_scanned: lastScanned,
          is_default_barcode: false
        });
        trolleyIdCounter++;
      }
    }

    const createdTrolleys = await Trolley.bulkCreate(trolleys);
    console.log(`✓ Created ${createdTrolleys.length} trolleys distributed across ${stores.length} stores`);

    // Create status history
    const statusHistoryRecords = [];
    for (const trolley of createdTrolleys.slice(0, 30)) {
      statusHistoryRecords.push({
        trolley_id: trolley.id,
        previous_status: null,
        new_status: 'active',
        updated_by: staff1.id,
        notes: 'Initial registration',
        timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      });

      if (trolley.status === 'maintenance') {
        statusHistoryRecords.push({
          trolley_id: trolley.id,
          previous_status: 'active',
          new_status: 'maintenance',
          updated_by: staff2.id,
          notes: 'Wheel damage detected',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        });
      }
    }

    await StatusHistory.bulkCreate(statusHistoryRecords);
    console.log('✓ Created status history');

    // Create maintenance records with diverse types
    const maintenanceRecords = [];
    const maintenanceTrolleys = createdTrolleys.filter(t => t.status === 'maintenance');

    // Define diverse maintenance types
    const maintenanceTypes = [
      { description: 'Replaced damaged wheel and lubricated joints', cost: 150, technician: 'Mike Williams' },
      { description: 'Fixed broken handle grip and safety mechanism', cost: 95, technician: 'Sarah Chen' },
      { description: 'Replaced worn-out wheels (all four)', cost: 220, technician: 'Mike Williams' },
      { description: 'Repaired basket wiring and straightened frame', cost: 180, technician: 'John Martinez' },
      { description: 'Replaced RFID tag and recalibrated sensor', cost: 75, technician: 'Sarah Chen' },
      { description: 'Fixed wheel alignment and axle bearing replacement', cost: 165, technician: 'Mike Williams' },
      { description: 'Repaired child seat lock mechanism', cost: 85, technician: 'John Martinez' },
      { description: 'Replaced entire handle assembly due to rust damage', cost: 195, technician: 'Mike Williams' },
      { description: 'Fixed basket bottom support and welded weak joints', cost: 145, technician: 'Sarah Chen' },
      { description: 'Cleaned and lubricated all moving parts, minor adjustments', cost: 45, technician: 'John Martinez' },
      { description: 'Replaced front wheels and brake mechanism', cost: 175, technician: 'Mike Williams' },
      { description: 'Straightened bent frame and reinforced structure', cost: 210, technician: 'Sarah Chen' },
      { description: 'Fixed loose basket and tightened all bolts', cost: 55, technician: 'John Martinez' },
      { description: 'Replaced damaged barcode label and cleaned trolley', cost: 30, technician: 'Sarah Chen' },
      { description: 'Major overhaul: wheels, handle, basket repair', cost: 285, technician: 'Mike Williams' }
    ];

    // Create maintenance records for all maintenance trolleys
    for (let i = 0; i < maintenanceTrolleys.length; i++) {
      const trolley = maintenanceTrolleys[i];
      const maintenanceDate = new Date();
      maintenanceDate.setDate(maintenanceDate.getDate() - Math.floor(Math.random() * 30));

      // Randomly select a maintenance type
      const maintenanceType = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];

      // Some trolleys get multiple maintenance records (repeat customers)
      const recordCount = Math.random() > 0.7 ? 2 : 1;

      for (let j = 0; j < recordCount; j++) {
        const recordDate = new Date(maintenanceDate);
        recordDate.setDate(recordDate.getDate() - (j * 10)); // Earlier records if multiple

        const selectedType = j === 0 ? maintenanceType : maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];

        maintenanceRecords.push({
          trolley_id: trolley.id,
          maintenance_date: recordDate,
          description: selectedType.description,
          technician: selectedType.technician,
          status_after: j === 0 ? 'maintenance' : 'active',
          cost: selectedType.cost + (Math.random() * 30 - 15), // Add some variance to cost
          performed_by: [staff1.id, staff2.id][Math.floor(Math.random() * 2)]
        });
      }
    }

    await MaintenanceRecord.bulkCreate(maintenanceRecords);
    console.log('✓ Created maintenance records');

    // Create alerts - more for stores with bad health
    const alerts = [];
    const badHealthStores = ['Shoprite Kraaifontein', 'Shoprite Soweto', 'Shoprite Potchefstroom'];

    // Shortage alerts - check all stores
    for (const store of stores) {
      const activeTrolleys = createdTrolleys.filter(
        t => t.store_id === store.id && t.status === 'active'
      ).length;

      if (activeTrolleys < store.active_threshold) {
        alerts.push({
          store_id: store.id,
          trolley_id: null,
          type: 'shortage',
          severity: badHealthStores.includes(store.name) ? 'critical' : 'warning',
          message: `Active trolley count at ${store.name} is below threshold: ${activeTrolleys}/${store.active_threshold}`,
          resolved: false
        });
      }
    }

    // Inactivity alerts for stolen trolleys
    const stolenTrolleys = createdTrolleys.filter(t => t.status === 'stolen');
    for (const trolley of stolenTrolleys) {
      const store = stores.find(s => s.id === trolley.store_id);
      alerts.push({
        store_id: trolley.store_id,
        trolley_id: trolley.id,
        type: 'inactivity',
        severity: badHealthStores.includes(store.name) ? 'critical' : 'warning',
        message: `Trolley ${trolley.rfid_tag} at ${store.name} has been inactive for extended period`,
        resolved: false
      });
    }

    // Add extra maintenance alerts for bad health stores
    for (const store of stores.filter(s => badHealthStores.includes(s.name))) {
      const maintenanceTrolleyCount = createdTrolleys.filter(
        t => t.store_id === store.id && t.status === 'maintenance'
      ).length;

      if (maintenanceTrolleyCount > 0) {
        alerts.push({
          store_id: store.id,
          trolley_id: null,
          type: 'maintenance_due',
          severity: 'critical',
          message: `${store.name} has ${maintenanceTrolleyCount} trolleys requiring maintenance - immediate action needed`,
          resolved: false
        });
      }
    }

    await Alert.bulkCreate(alerts);
    console.log('✓ Created alerts');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nSample credentials:');
    console.log('Admin: admin@cartsaver.com / admin123');
    console.log('Staff: john@cartsaver.com / staff123');
    console.log('Staff: sarah@cartsaver.com / staff123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
