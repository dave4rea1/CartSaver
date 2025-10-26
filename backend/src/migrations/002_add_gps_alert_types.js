const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    // Add new alert types for GPS tracking
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_alerts_type ADD VALUE IF NOT EXISTS 'geofence_breach';
      ALTER TYPE enum_alerts_type ADD VALUE IF NOT EXISTS 'low_battery';
    `);

    // Add new severity levels for GPS alerts
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_alerts_severity ADD VALUE IF NOT EXISTS 'high';
      ALTER TYPE enum_alerts_severity ADD VALUE IF NOT EXISTS 'medium';
    `);
  },

  async down(queryInterface) {
    // Note: PostgreSQL doesn't support removing enum values directly
    // You would need to recreate the enum type and update all references
    // For simplicity, we'll leave the enum values in place
    console.log('Warning: Cannot remove enum values in PostgreSQL. Manual intervention required if rollback is needed.');
  }
};
