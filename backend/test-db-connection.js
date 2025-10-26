require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');

  console.log('Database Configuration:');
  console.log('  Host:', process.env.DB_HOST);
  console.log('  Port:', process.env.DB_PORT);
  console.log('  Database:', process.env.DB_NAME);
  console.log('  User:', process.env.DB_USER);
  console.log('  Password:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
  console.log('\n');

  try {
    // Test connection
    console.log('⏳ Attempting to connect to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully!\n');

    // Get database version
    const [results] = await sequelize.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', results[0].version);
    console.log('\n');

    // List all tables
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📋 Available Tables:');
    if (tables.length === 0) {
      console.log('  ⚠️  No tables found. You may need to run migrations.');
    } else {
      tables.forEach(table => {
        console.log('  ✓', table.table_name);
      });
    }
    console.log('\n');

    // Count records in each table
    for (const table of tables) {
      const [count] = await sequelize.query(
        `SELECT COUNT(*) as count FROM ${table.table_name}`
      );
      console.log(`  ${table.table_name}: ${count[0].count} records`);
    }

    console.log('\n✅ Database connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('\nError Details:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code || 'N/A');

    if (error.parent) {
      console.error('  Parent Error:', error.parent.message);
    }

    console.log('\n🔧 Troubleshooting Tips:');
    console.log('  1. Ensure PostgreSQL is running: netstat -ano | findstr :5432');
    console.log('  2. Verify credentials in .env file');
    console.log('  3. Check if database exists: psql -U postgres -l');
    console.log('  4. Test connection: psql -U postgres -d cartsaver_db');
    console.log('  5. Check firewall settings');

    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testDatabaseConnection();
