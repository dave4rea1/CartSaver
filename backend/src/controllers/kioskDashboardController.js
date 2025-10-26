const { CustomerTrolleyAssignment, XSCard, Trolley, Store } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Get comprehensive kiosk dashboard analytics
 */
exports.getKioskAnalytics = async (req, res) => {
  try {
    const { store_id, period = '24' } = req.query; // period in hours
    const storeFilter = store_id ? { store_id: parseInt(store_id) } : {};

    // Time ranges
    const now = new Date();
    const periodHoursAgo = new Date(now.getTime() - (parseInt(period) * 60 * 60 * 1000));
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    // 1. Today's Activity Summary
    const todayCheckouts = await CustomerTrolleyAssignment.count({
      where: {
        ...storeFilter,
        checkout_timestamp: { [Op.gte]: todayStart }
      }
    });

    const todayReturns = await CustomerTrolleyAssignment.count({
      where: {
        ...storeFilter,
        return_timestamp: { [Op.gte]: todayStart },
        status: 'returned'
      }
    });

    const yesterdayCheckouts = await CustomerTrolleyAssignment.count({
      where: {
        ...storeFilter,
        checkout_timestamp: { [Op.gte]: yesterdayStart, [Op.lt]: todayStart }
      }
    });

    const yesterdayReturns = await CustomerTrolleyAssignment.count({
      where: {
        ...storeFilter,
        return_timestamp: { [Op.gte]: yesterdayStart, [Op.lt]: todayStart },
        status: 'returned'
      }
    });

    // 2. Active Checkouts
    const activeCheckouts = await CustomerTrolleyAssignment.findAll({
      where: {
        ...storeFilter,
        status: { [Op.in]: ['checked_out', 'overdue'] }
      },
      include: [
        {
          model: Trolley,
          as: 'trolley',
          attributes: ['id', 'rfid_tag', 'barcode']
        },
        {
          model: XSCard,
          as: 'xsCard',
          attributes: ['card_number', 'customer_name', 'tier']
        },
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name']
        }
      ],
      order: [['checkout_timestamp', 'DESC']],
      limit: 50
    });

    // 3. Overdue Trolleys
    const overdueTrolleys = activeCheckouts.filter(checkout =>
      checkout.expected_return_time && new Date() > new Date(checkout.expected_return_time)
    );

    // 4. Recent Returns (last period)
    const recentReturns = await CustomerTrolleyAssignment.findAll({
      where: {
        ...storeFilter,
        return_timestamp: { [Op.gte]: periodHoursAgo },
        status: 'returned'
      },
      include: [
        {
          model: Trolley,
          as: 'trolley',
          attributes: ['id', 'rfid_tag', 'barcode']
        },
        {
          model: XSCard,
          as: 'xsCard',
          attributes: ['card_number', 'customer_name', 'tier']
        },
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name']
        }
      ],
      order: [['return_timestamp', 'DESC']],
      limit: 20
    });

    // 5. XS Card Statistics
    const xsCardStats = await CustomerTrolleyAssignment.findAll({
      where: {
        ...storeFilter,
        checkout_timestamp: { [Op.gte]: todayStart },
        xs_card_id: { [Op.not]: null }
      },
      include: [{
        model: XSCard,
        as: 'xsCard',
        attributes: ['tier']
      }],
      attributes: ['xs_card_id']
    });

    const tierBreakdown = xsCardStats.reduce((acc, assignment) => {
      const tier = assignment.xsCard?.tier || 'unknown';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});

    // Total points awarded today
    const pointsAwarded = await CustomerTrolleyAssignment.sum('points_awarded', {
      where: {
        ...storeFilter,
        return_timestamp: { [Op.gte]: todayStart },
        status: 'returned'
      }
    }) || 0;

    // 6. Hourly Activity (last 24 hours)
    let hourlyActivity = [];
    try {
      hourlyActivity = await CustomerTrolleyAssignment.findAll({
        where: {
          ...storeFilter,
          checkout_timestamp: { [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        },
        attributes: [
          [fn('EXTRACT', literal("HOUR FROM checkout_timestamp")), 'hour'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: [fn('EXTRACT', literal("HOUR FROM checkout_timestamp"))],
        order: [[fn('EXTRACT', literal("HOUR FROM checkout_timestamp")), 'ASC']],
        raw: true
      });
    } catch (hourlyError) {
      logger.warn('[Kiosk Dashboard] Hourly activity query failed:', hourlyError.message);
      // Continue without hourly activity data
    }

    // 7. Store Performance
    const storePerformance = await CustomerTrolleyAssignment.findAll({
      where: {
        checkout_timestamp: { [Op.gte]: todayStart }
      },
      include: [{
        model: Store,
        as: 'store',
        attributes: ['id', 'name']
      }],
      attributes: [
        'store_id',
        [fn('COUNT', col('customer_trolley_assignments.id')), 'transaction_count']
      ],
      group: ['customer_trolley_assignments.store_id', 'store.id', 'store.name'],
      order: [[fn('COUNT', col('customer_trolley_assignments.id')), 'DESC']],
      raw: false
    });

    // 8. Average Duration
    const completedReturns = await CustomerTrolleyAssignment.findAll({
      where: {
        ...storeFilter,
        return_timestamp: { [Op.gte]: todayStart },
        status: 'returned',
        duration_minutes: { [Op.not]: null }
      },
      attributes: ['duration_minutes']
    });

    const avgDuration = completedReturns.length > 0
      ? Math.round(completedReturns.reduce((sum, r) => sum + r.duration_minutes, 0) / completedReturns.length)
      : 0;

    // 9. Return Compliance Rate
    const onTimeReturns = completedReturns.filter(r => r.duration_minutes <= 240).length; // 4 hours
    const complianceRate = completedReturns.length > 0
      ? Math.round((onTimeReturns / completedReturns.length) * 100)
      : 0;

    // 10. Top Active Customers
    const topCustomers = await CustomerTrolleyAssignment.findAll({
      where: {
        ...storeFilter,
        checkout_timestamp: { [Op.gte]: todayStart },
        xs_card_id: { [Op.not]: null }
      },
      include: [{
        model: XSCard,
        as: 'xsCard',
        attributes: ['card_number', 'customer_name', 'tier', 'points_balance']
      }],
      attributes: [
        'xs_card_id',
        [fn('COUNT', col('customer_trolley_assignments.id')), 'transaction_count']
      ],
      group: ['customer_trolley_assignments.xs_card_id', 'xsCard.id', 'xsCard.card_number', 'xsCard.customer_name', 'xsCard.tier', 'xsCard.points_balance'],
      order: [[fn('COUNT', col('customer_trolley_assignments.id')), 'DESC']],
      limit: 10,
      raw: false
    });

    // Calculate percentage changes
    const checkoutChange = yesterdayCheckouts > 0
      ? Math.round(((todayCheckouts - yesterdayCheckouts) / yesterdayCheckouts) * 100)
      : 0;

    const returnChange = yesterdayReturns > 0
      ? Math.round(((todayReturns - yesterdayReturns) / yesterdayReturns) * 100)
      : 0;

    // Response
    res.json({
      summary: {
        today_checkouts: todayCheckouts,
        today_returns: todayReturns,
        active_now: activeCheckouts.length,
        overdue_count: overdueTrolleys.length,
        checkout_change: checkoutChange,
        return_change: returnChange,
        points_awarded: Math.round(pointsAwarded),
        avg_duration_minutes: avgDuration,
        compliance_rate: complianceRate
      },
      xs_card_stats: {
        total_transactions: xsCardStats.length,
        tier_breakdown: tierBreakdown,
        points_awarded: Math.round(pointsAwarded)
      },
      active_checkouts: activeCheckouts,
      overdue_trolleys: overdueTrolleys,
      recent_returns: recentReturns,
      hourly_activity: hourlyActivity,
      store_performance: storePerformance,
      top_customers: topCustomers
    });

  } catch (error) {
    logger.error('[Kiosk Dashboard] Error fetching analytics:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      sql: error.sql || 'N/A'
    });
    res.status(500).json({
      error: 'Failed to fetch kiosk analytics',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        sql: error.sql
      } : undefined
    });
  }
};

/**
 * Get real-time kiosk activity (lightweight endpoint for live updates)
 */
exports.getLiveActivity = async (req, res) => {
  try {
    const { store_id } = req.query;
    const storeFilter = store_id ? { store_id: parseInt(store_id) } : {};

    const activeCount = await CustomerTrolleyAssignment.count({
      where: {
        ...storeFilter,
        status: { [Op.in]: ['checked_out', 'overdue'] }
      }
    });

    const recentActivity = await CustomerTrolleyAssignment.findAll({
      where: {
        ...storeFilter,
        [Op.or]: [
          { checkout_timestamp: { [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) } },
          { return_timestamp: { [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) } }
        ]
      },
      include: [
        { model: Trolley, as: 'trolley', attributes: ['rfid_tag'] },
        { model: XSCard, as: 'xsCard', attributes: ['customer_name', 'tier'] }
      ],
      order: [
        ['return_timestamp', 'DESC'],
        ['checkout_timestamp', 'DESC']
      ],
      limit: 10
    });

    res.json({
      active_count: activeCount,
      recent_activity: recentActivity,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('[Kiosk Live Activity] Error:', error);
    res.status(500).json({ error: error.message });
  }
};
