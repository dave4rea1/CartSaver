const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TrolleyLocationHistory = sequelize.define('trolley_location_history', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  trolley_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'trolleys',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: -90,
      max: 90
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      min: -180,
      max: 180
    }
  },
  is_within_geofence: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  distance_from_store: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Distance from assigned store in meters',
    validate: {
      min: 0
    }
  },
  speed_kmh: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    comment: 'Calculated speed in km/h based on previous location',
    validate: {
      min: 0
    }
  },
  battery_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'GPS tracker battery percentage (0-100)',
    validate: {
      min: 0,
      max: 100
    }
  },
  signal_strength: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'GPS signal strength percentage (0-100)',
    validate: {
      min: 0,
      max: 100
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // History records don't need updated_at
  indexes: [
    { fields: ['trolley_id', 'timestamp'] },
    { fields: ['timestamp'] },
    {
      fields: ['trolley_id', 'is_within_geofence'],
      where: { is_within_geofence: false }
    },
    { fields: ['latitude', 'longitude'] }
  ]
});

module.exports = TrolleyLocationHistory;
