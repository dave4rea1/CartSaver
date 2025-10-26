// Quick test script to check dashboard API response
const { Trolley, Store, Alert, MaintenanceRecord } = require('./src/models');
const { Op, fn, col } = require('sequelize');

async function testDashboardCalculation() {
  try {
    console.log('\n=== Testing Dashboard Health Score Calculation ===\n');

    // Get all stores
    const stores = await Store.findAll({
      attributes: ['id', 'name', 'active_threshold', 'total_capacity'],
      include: [{
        model: Trolley,
        as: 'trolleys',
        attributes: ['status', 'id']
      }]
    });

    console.log(`Found ${stores.length} stores\n`);

    if (stores.length === 0) {
      console.log('❌ No stores found! Run: npm run seed');
      process.exit(1);
    }

    // Get unresolved alerts per store
    const storeAlerts = await Alert.findAll({
      where: { resolved: false },
      attributes: ['store_id', [fn('COUNT', col('id')), 'alert_count']],
      group: ['store_id']
    });

    const alertsByStore = storeAlerts.reduce((acc, item) => {
      acc[item.store_id] = parseInt(item.get('alert_count'));
      return acc;
    }, {});

    // Test calculation for first 3 stores
    const testStores = stores.slice(0, 3);

    testStores.forEach(store => {
      const activeCount = store.trolleys.filter(t => t.status === 'active').length;
      const maintenanceCount = store.trolleys.filter(t => t.status === 'maintenance').length;
      const stolenCount = store.trolleys.filter(t => t.status === 'stolen').length;
      const totalCount = store.trolleys.length;
      const alertCount = alertsByStore[store.id] || 0;

      console.log(`\n📊 ${store.name}`);
      console.log(`   Trolleys: ${activeCount} active / ${totalCount} total`);
      console.log(`   Maintenance: ${maintenanceCount}, Stolen: ${stolenCount}`);
      console.log(`   Alerts: ${alertCount}`);

      if (totalCount === 0) {
        console.log('   ❌ NO TROLLEYS - Health score will be 0');
        return;
      }

      // Calculate health metrics
      const activePercentage = Math.round((activeCount / totalCount) * 100);
      const maintenancePercentage = Math.round((maintenanceCount / totalCount) * 100);
      const stolenPercentage = Math.round((stolenCount / totalCount) * 100);
      const belowThreshold = activeCount < store.active_threshold;

      console.log(`   Active %: ${activePercentage}%`);
      console.log(`   Maintenance %: ${maintenancePercentage}%`);
      console.log(`   Stolen %: ${stolenPercentage}%`);
      console.log(`   Below Threshold: ${belowThreshold}`);

      // Calculate health score
      let healthScore = activePercentage;
      console.log(`   Base Score: ${healthScore}`);

      if (belowThreshold) {
        healthScore -= 15;
        console.log(`   - Penalty (below threshold): -15 → ${healthScore}`);
      }

      if (alertCount > 0) {
        const penalty = Math.min(alertCount * 3, 20);
        healthScore -= penalty;
        console.log(`   - Penalty (alerts): -${penalty} → ${healthScore}`);
      }

      if (maintenancePercentage > 30) {
        healthScore -= 10;
        console.log(`   - Penalty (high maintenance): -10 → ${healthScore}`);
      } else if (maintenancePercentage > 20) {
        healthScore -= 5;
        console.log(`   - Penalty (moderate maintenance): -5 → ${healthScore}`);
      }

      if (stolenPercentage > 10) {
        healthScore -= 10;
        console.log(`   - Penalty (high theft): -10 → ${healthScore}`);
      } else if (stolenPercentage > 5) {
        healthScore -= 5;
        console.log(`   - Penalty (moderate theft): -5 → ${healthScore}`);
      }

      healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

      let healthStatus;
      if (healthScore >= 70) {
        healthStatus = 'good';
      } else if (healthScore >= 40) {
        healthStatus = 'moderate';
      } else {
        healthStatus = 'bad';
      }

      console.log(`   ✅ Final Health Score: ${healthScore}% (${healthStatus.toUpperCase()})`);
      console.log(`   Type check: typeof healthScore = ${typeof healthScore}`);
      console.log(`   Is NaN: ${isNaN(healthScore)}`);
      console.log(`   Is undefined: ${healthScore === undefined}`);
    });

    console.log('\n=== Test Complete ===\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testDashboardCalculation();
