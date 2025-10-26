const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Alert = sequelize.define('alerts', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  trolley_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'trolleys',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('shortage', 'inactivity', 'maintenance_due', 'recovered', 'geofence_breach', 'low_battery'),
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('info', 'warning', 'critical', 'high', 'medium'),
    allowNull: false,
    defaultValue: 'info'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  resolved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['store_id'] },
    { fields: ['resolved', 'created_at'] },
    { fields: ['type'] }
  ]
});

module.exports = Alert;
