require('dotenv').config();
const { sequelize } = require('./database');
const models = require('../models');

const runMigration = async () => {
  try {
    console.log('Starting database migration...');

    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✓ Database schema synchronized');

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
};

runMigration();
