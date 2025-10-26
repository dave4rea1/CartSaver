const { Trolley, StatusHistory, Alert } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Check for inactive trolleys and flag them as stolen
 * Runs daily via CRON job
 */
const checkInactiveTrolleys = async () => {
  try {
    const thresholdDays = parseInt(process.env.INACTIVITY_THRESHOLD_DAYS) || 7;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

    // Find trolleys that haven't been scanned for 7+ days
    const inactiveTrolleys = await Trolley.findAll({
      where: {
        status: {
          [Op.notIn]: ['stolen', 'decommissioned']
        },
        [Op.or]: [
          { last_scanned: null },
          {
            last_scanned: {
              [Op.lt]: thresholdDate
            }
          }
        ]
      },
      include: [{
        model: require('../models/Store'),
        as: 'store',
        attributes: ['id', 'name']
      }]
    });

    let flaggedCount = 0;

    for (const trolley of inactiveTrolleys) {
      const previousStatus = trolley.status;
      const defaultBarcode = `STOLEN-${trolley.id}-${Date.now()}`;

      // Update trolley status to stolen
      await trolley.update({
        status: 'stolen',
        barcode: defaultBarcode,
        is_default_barcode: true
      });

      // Create status history entry
      await StatusHistory.create({
        trolley_id: trolley.id,
        previous_status: previousStatus,
        new_status: 'stolen',
        updated_by: null, // System-generated
        notes: `Automatically flagged as stolen due to ${thresholdDays}+ days of inactivity`,
        timestamp: new Date()
      });

      // Create alert
      await Alert.create({
        store_id: trolley.store_id,
        trolley_id: trolley.id,
        type: 'inactivity',
        severity: 'warning',
        message: `Trolley ${trolley.rfid_tag} at ${trolley.store.name} has been flagged as stolen due to inactivity (last seen: ${trolley.last_scanned ? trolley.last_scanned.toLocaleDateString() : 'never'})`,
        resolved: false
      });

      flaggedCount++;
      logger.info(`Flagged trolley ${trolley.rfid_tag} as stolen`);
    }

    logger.info(`Inactivity check complete: ${flaggedCount} trolleys flagged as stolen`);
    return { flaggedCount, trolleys: inactiveTrolleys };
  } catch (error) {
    logger.error('Error in inactivity check:', error);
    throw error;
  }
};

module.exports = { checkInactiveTrolleys };
