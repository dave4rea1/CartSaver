const { CustomerTrolleyAssignment, XSCard, Alert, Store } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const xsIntegrationService = require('../services/xsIntegrationService');
const rewardsService = require('../services/rewardsService');

/**
 * Check for overdue trolley checkouts and apply penalties
 * Runs hourly
 */
const checkOverdueTrolleys = async () => {
  try {
    const now = new Date();
    logger.info('[Overdue Check] Starting overdue trolley check');

    // Find all checked-out trolleys that are past their expected return time
    const overdueAssignments = await CustomerTrolleyAssignment.findAll({
      where: {
        status: 'checked_out',
        expected_return_time: {
          [Op.lt]: now
        }
      },
      include: [
        { model: XSCard, as: 'xsCard' },
        { model: Store, as: 'store' }
      ]
    });

    if (overdueAssignments.length === 0) {
      logger.info('[Overdue Check] No overdue trolleys found');
      return {
        checked: 0,
        overdue: 0
      };
    }

    logger.info(`[Overdue Check] Found ${overdueAssignments.length} overdue trolleys`);

    let penaltiesApplied = 0;
    let alertsCreated = 0;
    let cardsBlocked = 0;

    for (const assignment of overdueAssignments) {
      try {
        // Update assignment status to overdue
        assignment.status = 'overdue';
        await assignment.save();

        // Calculate hours overdue
        const overdueMs = now - assignment.expected_return_time;
        const hoursOverdue = Math.floor(overdueMs / (1000 * 60 * 60));

        // If XS card is linked, apply penalties
        if (assignment.xsCard) {
          const card = assignment.xsCard;

          // Calculate penalty
          const penalty = rewardsService.calculatePenalty({
            hoursOverdue,
            tier: card.tier
          });

          // Deduct points
          await xsIntegrationService.deductPoints(
            card.card_number,
            penalty.total_penalty,
            `Trolley overdue by ${hoursOverdue} hours`
          );

          penaltiesApplied++;

          // Reset consecutive returns streak
          await xsIntegrationService.updateCustomerStats(card.card_number, {
            consecutiveReturns: 0
          });

          // Check if customer has multiple unreturned trolleys
          const customerOverdue = await CustomerTrolleyAssignment.count({
            where: {
              customer_identifier: assignment.customer_identifier,
              status: { [Op.in]: ['overdue', 'unreturned'] }
            }
          });

          // Block card if customer has 3+ unreturned trolleys
          if (customerOverdue >= 3) {
            await xsIntegrationService.blockCard(
              card.card_number,
              `${customerOverdue} unreturned trolleys. Return all trolleys to reactivate.`
            );
            cardsBlocked++;
            logger.warn(`[Overdue Check] Blocked card ${card.card_number} - ${customerOverdue} unreturned trolleys`);
          }

          logger.info(`[Overdue Check] Applied ${penalty.total_penalty} point penalty to ${card.card_number}`);
        }

        // Create alert for store
        await Alert.create({
          store_id: assignment.store_id,
          trolley_id: assignment.trolley_id,
          type: 'inactivity',
          severity: hoursOverdue > 48 ? 'critical' : 'warning',
          message: `Trolley #${assignment.trolley_id} is ${hoursOverdue} hours overdue. Customer: ${assignment.customer_name} (${assignment.customer_identifier})`,
          resolved: false
        });

        alertsCreated++;

        // TODO: In production, send SMS/email reminder to customer
        // await sendSMSReminder(assignment.customer_identifier, assignment.trolley_id);

      } catch (error) {
        logger.error(`[Overdue Check] Error processing assignment ${assignment.id}:`, error);
      }
    }

    // Mark trolleys unreturned after 7 days
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const veryOverdue = await CustomerTrolleyAssignment.findAll({
      where: {
        status: 'overdue',
        expected_return_time: {
          [Op.lt]: sevenDaysAgo
        }
      }
    });

    for (const assignment of veryOverdue) {
      assignment.status = 'unreturned';
      await assignment.save();
      logger.warn(`[Overdue Check] Marked trolley ${assignment.trolley_id} as unreturned (overdue >7 days)`);
    }

    logger.info(`[Overdue Check] Complete - Overdue: ${overdueAssignments.length}, Penalties: ${penaltiesApplied}, Alerts: ${alertsCreated}, Blocked: ${cardsBlocked}`);

    return {
      checked: overdueAssignments.length,
      overdue: overdueAssignments.length,
      penalties_applied: penaltiesApplied,
      alerts_created: alertsCreated,
      cards_blocked: cardsBlocked,
      marked_unreturned: veryOverdue.length
    };

  } catch (error) {
    logger.error('[Overdue Check] Job failed:', error);
    throw error;
  }
};

module.exports = { checkOverdueTrolleys };
