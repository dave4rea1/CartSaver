const { Store, Trolley, Alert } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Check for trolley shortages at each store
 * Runs hourly via CRON job
 */
const checkTrolleyShortages = async () => {
  try {
    const stores = await Store.findAll({
      include: [{
        model: Trolley,
        as: 'trolleys',
        where: { status: 'active' },
        required: false
      }]
    });

    let alertsCreated = 0;

    for (const store of stores) {
      const activeTrolleyCount = store.trolleys.length;

      // Check if count is below threshold
      if (activeTrolleyCount < store.active_threshold) {
        // Check if there's already an active shortage alert for this store
        const existingAlert = await Alert.findOne({
          where: {
            store_id: store.id,
            type: 'shortage',
            resolved: false,
            created_at: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        });

        if (!existingAlert) {
          await Alert.create({
            store_id: store.id,
            trolley_id: null,
            type: 'shortage',
            severity: activeTrolleyCount < store.active_threshold * 0.5 ? 'critical' : 'warning',
            message: `Active trolley count at ${store.name} is below threshold: ${activeTrolleyCount}/${store.active_threshold}`,
            resolved: false
          });

          alertsCreated++;
          logger.info(`Created shortage alert for ${store.name}`);
        }
      }
    }

    logger.info(`Shortage check complete: ${alertsCreated} alerts created`);
    return { alertsCreated };
  } catch (error) {
    logger.error('Error in shortage check:', error);
    throw error;
  }
};

module.exports = { checkTrolleyShortages };
