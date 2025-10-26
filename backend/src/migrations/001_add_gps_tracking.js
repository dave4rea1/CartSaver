const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    // Add GPS tracking fields to trolleys table
    await queryInterface.addColumn('trolleys', 'current_lat', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: -90,
        max: 90
      },
      comment: 'Current GPS latitude of the trolley'
    });

    await queryInterface.addColumn('trolleys', 'current_long', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: true,
      validate: {
        min: -180,
        max: 180
      },
      comment: 'Current GPS longitude of the trolley'
    });

    await queryInterface.addColumn('trolleys', 'last_location_update', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of last GPS location update'
    });

    await queryInterface.addColumn('trolleys', 'is_within_geofence', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      comment: 'Whether trolley is within store geofence radius'
    });

    // Add indexes for GPS fields
    await queryInterface.addIndex('trolleys', ['current_lat', 'current_long'], {
      name: 'trolleys_location_idx'
    });

    await queryInterface.addIndex('trolleys', ['is_within_geofence'], {
      name: 'trolleys_geofence_idx'
    });

    await queryInterface.addIndex('trolleys', ['last_location_update'], {
      name: 'trolleys_last_location_update_idx'
    });

    // Create trolley_location_history table
    await queryInterface.createTable('trolley_location_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      trolley_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'trolleys',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false,
        validate: {
          min: -90,
          max: 90
        }
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false,
        validate: {
          min: -180,
          max: 180
        }
      },
      is_within_geofence: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      distance_from_store: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Distance from assigned store in meters'
      },
      speed_kmh: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
        comment: 'Calculated speed in km/h based on previous location'
      },
      battery_level: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'GPS tracker battery percentage (0-100)'
      },
      signal_strength: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'GPS signal strength percentage (0-100)'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for trolley_location_history
    await queryInterface.addIndex('trolley_location_history', ['trolley_id', 'timestamp'], {
      name: 'trolley_location_history_trolley_timestamp_idx'
    });

    await queryInterface.addIndex('trolley_location_history', ['timestamp'], {
      name: 'trolley_location_history_timestamp_idx'
    });

    await queryInterface.addIndex('trolley_location_history', ['latitude', 'longitude'], {
      name: 'trolley_location_history_coordinates_idx'
    });

    // Add partial index for geofence violations
    await queryInterface.sequelize.query(`
      CREATE INDEX trolley_location_history_geofence_violations_idx
      ON trolley_location_history (trolley_id, is_within_geofence)
      WHERE is_within_geofence = false;
    `);

    // Add geofence_radius to stores table if it doesn't exist
    try {
      await queryInterface.addColumn('stores', 'geofence_radius', {
        type: Sequelize.INTEGER,
        defaultValue: 500,
        comment: 'Geofence radius in meters'
      });
    } catch (error) {
      // Column already exists, skip
      if (error.original && error.original.code === '42701') {
        console.log('Column geofence_radius already exists in stores table, skipping...');
      } else {
        throw error;
      }
    }
  },

  async down(queryInterface) {
    // Remove indexes from trolley_location_history
    await queryInterface.removeIndex('trolley_location_history', 'trolley_location_history_geofence_violations_idx');
    await queryInterface.removeIndex('trolley_location_history', 'trolley_location_history_coordinates_idx');
    await queryInterface.removeIndex('trolley_location_history', 'trolley_location_history_timestamp_idx');
    await queryInterface.removeIndex('trolley_location_history', 'trolley_location_history_trolley_timestamp_idx');

    // Drop trolley_location_history table
    await queryInterface.dropTable('trolley_location_history');

    // Remove indexes from trolleys table
    await queryInterface.removeIndex('trolleys', 'trolleys_last_location_update_idx');
    await queryInterface.removeIndex('trolleys', 'trolleys_geofence_idx');
    await queryInterface.removeIndex('trolleys', 'trolleys_location_idx');

    // Remove GPS tracking columns from trolleys table
    await queryInterface.removeColumn('trolleys', 'is_within_geofence');
    await queryInterface.removeColumn('trolleys', 'last_location_update');
    await queryInterface.removeColumn('trolleys', 'current_long');
    await queryInterface.removeColumn('trolleys', 'current_lat');

    // Remove geofence_radius from stores table
    await queryInterface.removeColumn('stores', 'geofence_radius');
  }
};
