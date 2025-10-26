const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * CustomerTrolleyAssignment Model
 * Tracks trolley checkout/return by customers using XS cards or phone numbers
 */
const CustomerTrolleyAssignment = sequelize.define('customer_trolley_assignments', {
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
  xs_card_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'xs_cards',
      key: 'id'
    },
    comment: 'XS Card used (null if customer used phone number)'
  },
  customer_identifier: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'XS card number or phone number used for checkout'
  },
  customer_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Customer name at time of checkout'
  },
  checkout_timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When customer picked up the trolley'
  },
  return_timestamp: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When customer returned the trolley'
  },
  expected_return_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Expected return time (checkout + grace period)'
  },
  checkout_location_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    comment: 'GPS latitude where trolley was checked out'
  },
  checkout_location_long: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    comment: 'GPS longitude where trolley was checked out'
  },
  return_location_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    comment: 'GPS latitude where trolley was returned'
  },
  return_location_long: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    comment: 'GPS longitude where trolley was returned'
  },
  status: {
    type: DataTypes.ENUM('checked_out', 'returned', 'overdue', 'unreturned'),
    allowNull: false,
    defaultValue: 'checked_out',
    comment: 'Current status of this assignment'
  },
  points_awarded: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'XS points awarded for this return'
  },
  bonus_points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Bonus points (e.g., for quick return, streak)'
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total duration trolley was used (in minutes)'
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    },
    comment: 'Store where checkout occurred'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes (e.g., late return reason)'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['trolley_id'] },
    { fields: ['xs_card_id'] },
    { fields: ['customer_identifier'] },
    { fields: ['status'] },
    { fields: ['checkout_timestamp'] },
    { fields: ['expected_return_time'] },
    { fields: ['store_id'] },
    // Composite index for finding active checkouts
    { fields: ['status', 'checkout_timestamp'] }
  ]
});

module.exports = CustomerTrolleyAssignment;
