const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MaintenanceRecord = sequelize.define('maintenance_records', {
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
    }
  },
  maintenance_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  technician: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status_after: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  performed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['trolley_id'] },
    { fields: ['maintenance_date'] }
  ]
});

module.exports = MaintenanceRecord;
