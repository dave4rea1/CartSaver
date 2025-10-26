const User = require('./User');
const Store = require('./Store');
const Trolley = require('./Trolley');
const StatusHistory = require('./StatusHistory');
const MaintenanceRecord = require('./MaintenanceRecord');
const Alert = require('./Alert');
const TrolleyLocationHistory = require('./TrolleyLocationHistory');
const XSCard = require('./XSCard');
const CustomerTrolleyAssignment = require('./CustomerTrolleyAssignment');

// Define associations

// User associations
User.hasMany(StatusHistory, { foreignKey: 'updated_by', as: 'statusUpdates' });
User.hasMany(MaintenanceRecord, { foreignKey: 'performed_by', as: 'maintenanceRecords' });
User.hasMany(Alert, { foreignKey: 'resolved_by', as: 'resolvedAlerts' });

// Store associations
Store.hasMany(Trolley, { foreignKey: 'store_id', as: 'trolleys' });
Store.hasMany(Alert, { foreignKey: 'store_id', as: 'alerts' });
Store.hasMany(CustomerTrolleyAssignment, { foreignKey: 'store_id', as: 'trolleyAssignments' });

// Trolley associations
Trolley.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Trolley.hasMany(StatusHistory, { foreignKey: 'trolley_id', as: 'statusHistory' });
Trolley.hasMany(MaintenanceRecord, { foreignKey: 'trolley_id', as: 'maintenanceRecords' });
Trolley.hasMany(Alert, { foreignKey: 'trolley_id', as: 'alerts' });
Trolley.hasMany(TrolleyLocationHistory, { foreignKey: 'trolley_id', as: 'locationHistory' });
Trolley.hasMany(CustomerTrolleyAssignment, { foreignKey: 'trolley_id', as: 'customerAssignments' });

// StatusHistory associations
StatusHistory.belongsTo(Trolley, { foreignKey: 'trolley_id', as: 'trolley' });
StatusHistory.belongsTo(User, { foreignKey: 'updated_by', as: 'user' });

// MaintenanceRecord associations
MaintenanceRecord.belongsTo(Trolley, { foreignKey: 'trolley_id', as: 'trolley' });
MaintenanceRecord.belongsTo(User, { foreignKey: 'performed_by', as: 'user' });

// Alert associations
Alert.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Alert.belongsTo(Trolley, { foreignKey: 'trolley_id', as: 'trolley' });
Alert.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolvedBy' });

// TrolleyLocationHistory associations
TrolleyLocationHistory.belongsTo(Trolley, { foreignKey: 'trolley_id', as: 'trolley' });

// XSCard associations
XSCard.hasMany(CustomerTrolleyAssignment, { foreignKey: 'xs_card_id', as: 'trolleyAssignments' });

// CustomerTrolleyAssignment associations
CustomerTrolleyAssignment.belongsTo(Trolley, { foreignKey: 'trolley_id', as: 'trolley' });
CustomerTrolleyAssignment.belongsTo(XSCard, { foreignKey: 'xs_card_id', as: 'xsCard' });
CustomerTrolleyAssignment.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

module.exports = {
  User,
  Store,
  Trolley,
  StatusHistory,
  MaintenanceRecord,
  Alert,
  TrolleyLocationHistory,
  XSCard,
  CustomerTrolleyAssignment
};
