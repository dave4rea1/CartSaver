const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Trolley = sequelize.define('trolleys', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rfid_tag: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  barcode: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'stolen', 'decommissioned', 'recovered'),
    allowNull: false,
    defaultValue: 'active'
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  last_scanned: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_default_barcode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // GPS tracking fields
  current_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90
    },
    comment: 'Current GPS latitude of the trolley'
  },
  current_long: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180
    },
    comment: 'Current GPS longitude of the trolley'
  },
  last_location_update: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp of last GPS location update'
  },
  is_within_geofence: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether trolley is within store geofence radius'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['rfid_tag'] },
    { fields: ['status'] },
    { fields: ['store_id'] },
    { fields: ['last_scanned'] },
    { fields: ['current_lat', 'current_long'] },
    { fields: ['is_within_geofence'] },
    { fields: ['last_location_update'] }
  ]
});

module.exports = Trolley;
