const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StatusHistory = sequelize.define('status_history', {
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
  previous_status: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  new_status: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  indexes: [
    { fields: ['trolley_id'] },
    { fields: ['timestamp'] }
  ]
});

module.exports = StatusHistory;
