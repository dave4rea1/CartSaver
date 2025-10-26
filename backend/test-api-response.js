// Test actual dashboard API response
const express = require('express');
const { getDashboardStats } = require('./src/controllers/dashboardController');

async function testAPIResponse() {
  try {
    console.log('\n=== Testing Dashboard API Response ===\n');

    // Mock request and response objects
    const req = { query: {} };
    const res = {
      json: (data) => {
        console.log('API Response received\n');

        if (!data.stores || data.stores.length === 0) {
          console.log('❌ No stores in response!');
          process.exit(1);
        }

        console.log(`Total stores: ${data.stores.length}\n`);

        // Check first 5 stores
        const storesToCheck = data.stores.slice(0, 5);

        storesToCheck.forEach((store, index) => {
          console.log(`${index + 1}. ${store.name}`);
          console.log(`   Health Score: ${store.healthScore}`);
          console.log(`   Type: ${typeof store.healthScore}`);
          console.log(`   Is undefined: ${store.healthScore === undefined}`);
          console.log(`   Is NaN: ${isNaN(store.healthScore)}`);
          console.log(`   Health Status: ${store.healthStatus}`);
          console.log(`   Active %: ${store.activePercentage}%`);
          console.log(`   Display value: ${store.healthScore}%`);
          console.log('');
        });

        // Count by status
        const good = data.stores.filter(s => s.healthStatus === 'good').length;
        const moderate = data.stores.filter(s => s.healthStatus === 'moderate').length;
        const bad = data.stores.filter(s => s.healthStatus === 'bad').length;

        console.log('Summary:');
        console.log(`   ✅ Good: ${good} stores`);
        console.log(`   ⚠️  Moderate: ${moderate} stores`);
        console.log(`   ❌ Bad: ${bad} stores`);
        console.log('');

        // Check for undefined values
        const hasUndefinedScore = data.stores.some(s => s.healthScore === undefined);
        const hasNaNScore = data.stores.some(s => isNaN(s.healthScore));

        if (hasUndefinedScore) {
          console.log('❌ FOUND UNDEFINED HEALTH SCORES!');
          const undefinedStores = data.stores.filter(s => s.healthScore === undefined);
          console.log('Stores with undefined:', undefinedStores.map(s => s.name));
        } else if (hasNaNScore) {
          console.log('❌ FOUND NaN HEALTH SCORES!');
          const nanStores = data.stores.filter(s => isNaN(s.healthScore));
          console.log('Stores with NaN:', nanStores.map(s => s.name));
        } else {
          console.log('✅ ALL HEALTH SCORES ARE VALID NUMBERS');
        }

        process.exit(0);
      },
      status: (code) => ({
        json: (error) => {
          console.error(`❌ API Error (${code}):`, error);
          process.exit(1);
        }
      })
    };

    await getDashboardStats(req, res);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testAPIResponse();
