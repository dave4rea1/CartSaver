// Test actual API endpoint response
const http = require('http');

async function testAPIEndpoint() {
  return new Promise((resolve, reject) => {
    console.log('\n=== Testing Dashboard API Endpoint ===\n');

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/dashboard/stats',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          const { stores } = response;

          if (!stores || stores.length === 0) {
            console.log('❌ No stores in API response');
            resolve();
            return;
          }

          console.log(`Found ${stores.length} stores in API response\n`);

          // Test first 3 stores
          stores.slice(0, 3).forEach((store, index) => {
            console.log(`\n${index + 1}. ${store.name}`);
            console.log(`   Health Score: ${store.healthScore}`);
            console.log(`   Type: ${typeof store.healthScore}`);
            console.log(`   Is undefined: ${store.healthScore === undefined}`);
            console.log(`   Is null: ${store.healthScore === null}`);
            console.log(`   Is NaN: ${isNaN(store.healthScore)}`);
            console.log(`   Display value: ${store.healthScore}%`);
            console.log(`   Health Status: ${store.healthStatus}`);
            console.log(`   Active %: ${store.activePercentage}%`);
            console.log(`   Trolleys: ${store.active}/${store.total}`);
          });

          // Summary
          const goodStores = stores.filter(s => s.healthStatus === 'good').length;
          const moderateStores = stores.filter(s => s.healthStatus === 'moderate').length;
          const badStores = stores.filter(s => s.healthStatus === 'bad').length;
          const undefinedScores = stores.filter(s => s.healthScore === undefined || s.healthScore === null).length;

          console.log('\n=== Summary ===');
          console.log(`   ✅ Good: ${goodStores} stores`);
          console.log(`   ⚠️  Moderate: ${moderateStores} stores`);
          console.log(`   ❌ Bad: ${badStores} stores`);
          console.log(`   🔍 Undefined/Null: ${undefinedScores} stores`);

          if (undefinedScores === 0) {
            console.log('\n✅ ALL HEALTH SCORES ARE VALID NUMBERS\n');
          } else {
            console.log(`\n❌ FOUND ${undefinedScores} STORES WITH UNDEFINED/NULL HEALTH SCORES\n`);
          }

          resolve();
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Backend server is not running!');
        console.log('   Please start the backend server first:');
        console.log('   cd backend && npm run dev\n');
      } else {
        console.error('❌ Error:', error.message);
      }
      resolve();
    });

    req.end();
  });
}

testAPIEndpoint();
