/**
 * Migration runner script
 * Usage: node src/scripts/runMigrations.js [up|down]
 */

const { sequelize } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

async function runMigrations(direction = 'up') {
  try {
    console.log(`Running migrations: ${direction}...`);

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(f => f.endsWith('.js'))
      .sort(); // Sort to run in order

    if (direction === 'down') {
      migrationFiles.reverse(); // Run down migrations in reverse order
    }

    console.log(`Found ${migrationFiles.length} migration file(s)`);

    // Run each migration
    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const migration = require(migrationPath);

      console.log(`\nRunning ${file} (${direction})...`);

      try {
        if (direction === 'up') {
          await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
        } else {
          await migration.down(sequelize.getQueryInterface(), sequelize.constructor);
        }
        console.log(`✓ ${file} completed successfully`);
      } catch (error) {
        console.error(`✗ Error running ${file}:`, error.message);
        throw error;
      }
    }

    console.log('\n✓ All migrations completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Get direction from command line args
const direction = process.argv[2] || 'up';

if (!['up', 'down'].includes(direction)) {
  console.error('Invalid direction. Use "up" or "down"');
  process.exit(1);
}

runMigrations(direction);
