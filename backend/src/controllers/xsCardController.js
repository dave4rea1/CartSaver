const { Trolley, Store, XSCard, CustomerTrolleyAssignment } = require('../models');
const { Op } = require('sequelize');
const xsIntegrationService = require('../services/xsIntegrationService');
const rewardsService = require('../services/rewardsService');
const logger = require('../utils/logger');

/**
 * Checkout trolley with XS card or phone number
 */
exports.checkoutTrolley = async (req, res) => {
  try {
    const { trolley_id, rfid_tag, identifier, identifier_type, store_id } = req.body;

    // Validate required fields
    if ((!trolley_id && !rfid_tag) || !identifier || !store_id) {
      return res.status(400).json({
        error: 'Missing required fields: (trolley_id or rfid_tag), identifier, store_id'
      });
    }

    // Find trolley by ID or RFID tag
    let trolley;
    if (trolley_id) {
      trolley = await Trolley.findByPk(trolley_id, {
        include: [{ model: Store, as: 'store' }]
      });
    } else {
      trolley = await Trolley.findOne({
        where: { rfid_tag },
        include: [{ model: Store, as: 'store' }]
      });
    }

    if (!trolley) {
      return res.status(404).json({ error: 'Trolley not found' });
    }

    // Use the actual trolley ID for the assignment
    const actualTrolleyId = trolley.id;

    // Check if trolley is already checked out
    const existingCheckout = await CustomerTrolleyAssignment.findOne({
      where: {
        trolley_id: actualTrolleyId,
        status: { [Op.in]: ['checked_out', 'overdue'] }
      }
    });

    if (existingCheckout) {
      return res.status(400).json({
        error: 'Trolley is already checked out',
        checked_out_to: existingCheckout.customer_identifier,
        checked_out_at: existingCheckout.checkout_timestamp
      });
    }

    let xsCard = null;
    let customerName = 'Walk-in Customer';

    // If XS card, validate it
    if (identifier_type === 'xs_card') {
      const validation = await xsIntegrationService.validateCard(identifier);

      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      xsCard = await XSCard.findOne({ where: { card_number: identifier } });
      customerName = validation.card.customer_name;
    }

    // Calculate expected return time (default: 4 hours grace period)
    const checkoutTime = new Date();
    const expectedReturnTime = new Date(checkoutTime.getTime() + (4 * 60 * 60 * 1000));

    // Create assignment
    const assignment = await CustomerTrolleyAssignment.create({
      trolley_id: actualTrolleyId,
      xs_card_id: xsCard ? xsCard.id : null,
      customer_identifier: identifier,
      customer_name: customerName,
      checkout_timestamp: checkoutTime,
      expected_return_time: expectedReturnTime,
      checkout_location_lat: trolley.current_lat,
      checkout_location_long: trolley.current_long,
      status: 'checked_out',
      store_id
    });

    // Update trolley status to indicate it's in use
    await trolley.update({
      status: 'active',
      last_scanned: checkoutTime
    });

    logger.info(`[XS Checkout] Trolley ${trolley_id} checked out to ${identifier}`);

    res.json({
      success: true,
      message: 'Trolley checked out successfully!',
      assignment: {
        id: assignment.id,
        trolley_id: assignment.trolley_id,
        customer_name: customerName,
        checkout_time: assignment.checkout_timestamp,
        expected_return_time: assignment.expected_return_time
      },
      trolley: {
        id: trolley.id,
        rfid_tag: trolley.rfid_tag
      }
    });
  } catch (error) {
    logger.error('[XS Checkout] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Return trolley and award points
 */
exports.returnTrolley = async (req, res) => {
  try {
    const { trolley_id, rfid_tag, identifier, return_location_lat, return_location_long } = req.body;

    if ((!trolley_id && !rfid_tag) || !identifier) {
      return res.status(400).json({ error: 'Missing (trolley_id or rfid_tag) and identifier' });
    }

    // Find the trolley first if using RFID
    let actualTrolleyId = trolley_id;
    if (!actualTrolleyId && rfid_tag) {
      const trolley = await Trolley.findOne({ where: { rfid_tag } });
      if (!trolley) {
        return res.status(404).json({ error: 'Trolley not found' });
      }
      actualTrolleyId = trolley.id;
    }

    // Find active checkout for this trolley and customer
    const assignment = await CustomerTrolleyAssignment.findOne({
      where: {
        trolley_id: actualTrolleyId,
        customer_identifier: identifier,
        status: { [Op.in]: ['checked_out', 'overdue'] }
      },
      include: [
        { model: XSCard, as: 'xsCard' },
        { model: Trolley, as: 'trolley' }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        error: 'No active checkout found for this trolley and customer'
      });
    }

    const returnTime = new Date();
    const durationMs = returnTime - assignment.checkout_timestamp;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const isOnTime = returnTime <= assignment.expected_return_time;

    // Update assignment
    assignment.return_timestamp = returnTime;
    assignment.return_location_lat = return_location_lat || null;
    assignment.return_location_long = return_location_long || null;
    assignment.duration_minutes = durationMinutes;
    assignment.status = 'returned';

    let pointsAwarded = 0;
    let bonusPoints = 0;
    let rewardBreakdown = null;
    let tierUpgrade = null;

    // Calculate and award points if using XS card
    if (assignment.xsCard) {
      const card = assignment.xsCard;

      // Calculate points
      rewardBreakdown = rewardsService.calculatePoints({
        durationMinutes,
        tier: card.tier,
        consecutiveReturns: card.consecutive_returns,
        isOnTime
      });

      pointsAwarded = rewardBreakdown.total;
      bonusPoints = rewardBreakdown.bonuses.reduce((sum, b) => sum + b.points, 0);

      // Award points via XS integration
      await xsIntegrationService.allocatePoints(
        card.card_number,
        pointsAwarded,
        'Trolley return reward'
      );

      // Update customer stats
      const newConsecutiveReturns = isOnTime ? card.consecutive_returns + 1 : 0;
      const statsUpdate = await xsIntegrationService.updateCustomerStats(card.card_number, {
        incrementTotalReturns: true,
        consecutiveReturns: newConsecutiveReturns
      });

      // Check for tier upgrade
      if (statsUpdate.tier !== card.tier) {
        tierUpgrade = {
          from: card.tier,
          to: statsUpdate.tier
        };
      }

      // Get next tier info
      const nextTierInfo = rewardsService.getNextTierInfo(
        statsUpdate.tier,
        statsUpdate.total_trolley_returns
      );

      assignment.points_awarded = pointsAwarded;
      assignment.bonus_points = bonusPoints;
    }

    await assignment.save();

    // Update trolley status
    await assignment.trolley.update({
      last_scanned: returnTime,
      status: 'active'
    });

    logger.info(`[XS Return] Trolley ${trolley_id} returned by ${identifier} - Points: ${pointsAwarded}`);

    const response = {
      success: true,
      message: 'Trolley returned successfully!',
      return_details: {
        duration_minutes: durationMinutes,
        on_time: isOnTime,
        checkout_time: assignment.checkout_timestamp,
        return_time: returnTime
      }
    };

    if (assignment.xsCard) {
      response.rewards = {
        points_awarded: pointsAwarded,
        bonus_points: bonusPoints,
        breakdown: rewardBreakdown,
        message: rewardsService.generateRewardMessage(rewardBreakdown)
      };

      if (tierUpgrade) {
        response.tier_upgrade = tierUpgrade;
        response.rewards.message += ` 🎊 Congratulations! You've been upgraded to ${tierUpgrade.to.toUpperCase()} tier!`;
      }
    } else {
      response.message += ' Sign up for an XS card to earn points on future returns!';
    }

    res.json(response);
  } catch (error) {
    logger.error('[XS Return] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get customer's trolley history
 */
exports.getCustomerHistory = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { count, rows: assignments } = await CustomerTrolleyAssignment.findAndCountAll({
      where: { customer_identifier: identifier },
      include: [
        { model: Trolley, as: 'trolley', attributes: ['id', 'rfid_tag', 'barcode'] },
        { model: Store, as: 'store', attributes: ['id', 'name'] }
      ],
      order: [['checkout_timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate statistics
    const stats = {
      total_returns: assignments.filter(a => a.status === 'returned').length,
      active_checkouts: assignments.filter(a => a.status === 'checked_out').length,
      overdue: assignments.filter(a => a.status === 'overdue').length,
      unreturned: assignments.filter(a => a.status === 'unreturned').length,
      total_points_earned: assignments.reduce((sum, a) => sum + (a.points_awarded || 0), 0),
      average_duration: Math.round(
        assignments
          .filter(a => a.duration_minutes)
          .reduce((sum, a) => sum + a.duration_minutes, 0) /
        (assignments.filter(a => a.duration_minutes).length || 1)
      )
    };

    res.json({
      assignments,
      stats,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('[XS History] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get active checkouts by store
 */
exports.getActiveCheckouts = async (req, res) => {
  try {
    const { store_id } = req.params;

    const checkouts = await CustomerTrolleyAssignment.findAll({
      where: {
        store_id,
        status: { [Op.in]: ['checked_out', 'overdue'] }
      },
      include: [
        { model: Trolley, as: 'trolley' },
        { model: XSCard, as: 'xsCard', attributes: ['card_number', 'customer_name', 'tier'] }
      ],
      order: [['checkout_timestamp', 'DESC']]
    });

    // Mark overdue checkouts
    const now = new Date();
    const overdueCheckouts = checkouts.filter(c => c.expected_return_time < now && c.status !== 'overdue');

    // Update overdue status
    for (const checkout of overdueCheckouts) {
      checkout.status = 'overdue';
      await checkout.save();
    }

    res.json({
      active_checkouts: checkouts.filter(c => c.status === 'checked_out').length,
      overdue_checkouts: checkouts.filter(c => c.status === 'overdue').length,
      checkouts
    });
  } catch (error) {
    logger.error('[XS Active Checkouts] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Validate XS card
 */
exports.validateXSCard = async (req, res) => {
  try {
    const { card_number } = req.body;

    if (!card_number) {
      return res.status(400).json({ error: 'Card number is required' });
    }

    const validation = await xsIntegrationService.validateCard(card_number);

    if (!validation.valid) {
      return res.status(400).json(validation);
    }

    // Get next tier info
    const nextTierInfo = rewardsService.getNextTierInfo(
      validation.card.tier,
      validation.card.total_trolley_returns
    );

    res.json({
      ...validation,
      next_tier_info: nextTierInfo
    });
  } catch (error) {
    logger.error('[XS Validate] Error:', error);
    res.status(500).json({ error: error.message });
  }
};
