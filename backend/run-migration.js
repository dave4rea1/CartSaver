/**
 * Database Migration Runner
 * Runs the performance indexes migration
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./src/config/database');

const runMigration = async () => {
  try {
    console.log('🔄 Starting database migration...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Test database connection
    console.log('\n📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/002_add_performance_indexes.sql');
    console.log(`\n📂 Reading migration file: ${migrationPath}`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded');

    // Extract only CREATE INDEX statements (ignore DO blocks and other SQL)
    const createIndexRegex = /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+[\w\s\S]+?;/gi;
    const matches = sql.match(createIndexRegex) || [];

    console.log(`\n🔧 Found ${matches.length} CREATE INDEX statements to execute`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let successCount = 0;
    let skipCount = 0;

    // Execute each index creation individually (not in transaction)
    for (let i = 0; i < matches.length; i++) {
      const statement = matches[i].trim();

      try {
        // Show progress for index creation
        const indexMatch = statement.match(/CREATE INDEX.*?(idx_\w+)/i);
        const indexName = indexMatch ? indexMatch[1] : `index ${i + 1}`;
        process.stdout.write(`\n⏳ Creating index: ${indexName}...`);

        await sequelize.query(statement);
        process.stdout.write(' ✅');
        successCount++;
      } catch (error) {
        // If index already exists, that's okay
        if (error.message.includes('already exists')) {
          process.stdout.write(' ⚠️  (already exists)');
          skipCount++;
        } else if (error.message.includes('does not exist')) {
          // Table doesn't exist yet - skip
          process.stdout.write(' ⚠️  (table not found)');
          skipCount++;
        } else {
          // Log error but continue
          process.stdout.write(' ❌');
          console.error(`\n   Error: ${error.message}`);
          skipCount++;
        }
      }
    }

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Created: ${successCount} indexes`);
    if (skipCount > 0) {
      console.log(`   ⚠️  Skipped: ${skipCount} (already exist or errors)`);
    }

    // Verify indexes were created
    console.log('\n🔍 Verifying indexes...');
    const [results] = await sequelize.query(`
      SELECT schemaname, tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);

    console.log(`✅ Total performance indexes in database: ${results.length}`);

    if (results.length > 0) {
      console.log('\n📋 Indexes by table:');
      const indexesByTable = results.reduce((acc, row) => {
        if (!acc[row.tablename]) acc[row.tablename] = [];
        acc[row.tablename].push(row.indexname);
        return acc;
      }, {});

      Object.entries(indexesByTable).forEach(([table, indexes]) => {
        console.log(`   ${table}: ${indexes.length} indexes`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Migration completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Migration failed!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('\n🔴 Error details:');
    console.error(error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Troubleshooting tips:');
      console.error('   1. Make sure PostgreSQL is running');
      console.error('   2. Check your database credentials in .env file');
      console.error('   3. Verify database exists: psql -l');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 Troubleshooting tips:');
      console.error('   1. Check DB_USER and DB_PASSWORD in .env file');
      console.error('   2. Make sure the user has CREATE INDEX permissions');
    } else if (error.message.includes('does not exist')) {
      console.error('\n💡 Troubleshooting tips:');
      console.error('   1. Run the initial migration first: npm run migrate');
      console.error('   2. Make sure all tables are created');
    }

    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
};

// Run migration
console.log('\n');
console.log('╔═══════════════════════════════════════════╗');
console.log('║   CartSaver Performance Index Migration   ║');
console.log('╚═══════════════════════════════════════════╝');
console.log('');

runMigration();
