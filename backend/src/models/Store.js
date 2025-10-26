const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Store = sequelize.define('stores', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  brand: {
    type: DataTypes.ENUM('Shoprite', 'Checkers'),
    allowNull: false,
    defaultValue: 'Shoprite'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  province: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  location_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: -90,
      max: 90
    }
  },
  location_long: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      min: -180,
      max: 180
    }
  },
  geofence_radius: {
    type: DataTypes.INTEGER,
    defaultValue: 500,
    comment: 'Geofence radius in meters',
    validate: {
      min: 50,
      max: 5000
    }
  },
  active_threshold: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    comment: 'Minimum active trolleys before alert',
    validate: {
      min: 0
    }
  },
  total_capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 150,
    comment: 'Total trolley capacity',
    validate: {
      min: 0
    }
  },
  manager_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  contact_number: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  operating_hours: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'e.g., "Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM"'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['location_lat', 'location_long'] },
    { fields: ['province'] },
    { fields: ['brand'] },
    { fields: ['city'] }
  ]
});

module.exports = Store;
