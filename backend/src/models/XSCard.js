const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * XSCard Model - Mock Shoprite/Checkers Xtra Savings Card Database
 * In production, this would be replaced with actual XS API integration
 */
const XSCard = sequelize.define('xs_cards', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  card_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'XS Card number (e.g., XS123456789)'
  },
  customer_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone_number: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      is: /^[0-9+\-() ]+$/
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  points_balance: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Current XS loyalty points balance'
  },
  tier: {
    type: DataTypes.ENUM('bronze', 'silver', 'gold', 'diamond'),
    defaultValue: 'bronze',
    allowNull: false,
    comment: 'Customer loyalty tier'
  },
  total_trolley_returns: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total number of trolleys returned by this customer'
  },
  consecutive_returns: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Current streak of consecutive returns'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the card is active and can be used'
  },
  blocked_reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Reason if card is blocked (e.g., multiple unreturned trolleys)'
  },
  last_activity: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time card was used for any transaction'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['card_number'], unique: true },
    { fields: ['phone_number'] },
    { fields: ['tier'] },
    { fields: ['is_active'] }
  ]
});

module.exports = XSCard;
