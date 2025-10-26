const { User, Trolley, Store, Alert, MaintenanceRecord, StatusHistory } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
  try {
    // Get store_id from query params for filtering
    const { store_id } = req.query;
    const storeFilter = store_id ? { store_id: parseInt(store_id) } : {};

    // Get trolley counts by status
    const trolleyStats = await Trolley.findAll({
      where: storeFilter,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status']
    });

    const statusCounts = trolleyStats.reduce((acc, item) => {
      acc[item.status] = parseInt(item.get('count'));
      return acc;
    }, {});

    // Total trolleys
    const totalTrolleys = await Trolley.count({ where: storeFilter });

    // Unresolved alerts
    const alertFilter = store_id ? { resolved: false, store_id: parseInt(store_id) } : { resolved: false };
    const unresolvedAlerts = await Alert.count({
      where: alertFilter
    });

    // Recent activity (last 24 hours)
    const recentActivityWhere = {
      timestamp: {
        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    };

    const recentActivity = await StatusHistory.findAll({
      where: recentActivityWhere,
      include: [
        {
          model: Trolley,
          as: 'trolley',
          attributes: ['id', 'rfid_tag'],
          ...(store_id && { where: { store_id: parseInt(store_id) } })
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: 10
    });

    // Maintenance this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const maintenanceWhere = {
      maintenance_date: {
        [Op.gte]: startOfMonth
      }
    };

    const maintenanceThisMonth = await MaintenanceRecord.count({
      where: maintenanceWhere,
      ...(store_id && {
        include: [{
          model: Trolley,
          as: 'trolley',
          where: { store_id: parseInt(store_id) },
          attributes: []
        }]
      })
    });

    // Store summary with enhanced health metrics
    const storeWhere = store_id ? { id: parseInt(store_id) } : {};
    const stores = await Store.findAll({
      where: storeWhere,
      attributes: ['id', 'name', 'active_threshold', 'total_capacity'],
      include: [{
        model: Trolley,
        as: 'trolleys',
        attributes: ['status', 'id']
      }]
    });

    // Get unresolved alerts per store
    const storeAlerts = await Alert.findAll({
      where: { resolved: false },
      attributes: ['store_id', [fn('COUNT', col('id')), 'alert_count']],
      group: ['store_id']
    });

    const alertsByStore = storeAlerts.reduce((acc, item) => {
      acc[item.store_id] = parseInt(item.get('alert_count'));
      return acc;
    }, {});

    // Get recent maintenance records (last 30 days) per store
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentMaintenance = await MaintenanceRecord.findAll({
      where: {
        maintenance_date: { [Op.gte]: thirtyDaysAgo }
      },
      include: [{
        model: Trolley,
        as: 'trolley',
        attributes: ['store_id']
      }],
      attributes: ['id']
    });

    const maintenanceByStore = recentMaintenance.reduce((acc, record) => {
      const storeId = record.trolley?.store_id;
      if (storeId) {
        acc[storeId] = (acc[storeId] || 0) + 1;
      }
      return acc;
    }, {});

    const storeSummary = stores.map(store => {
      const activeCount = store.trolleys.filter(t => t.status === 'active').length;
      const maintenanceCount = store.trolleys.filter(t => t.status === 'maintenance').length;
      const stolenCount = store.trolleys.filter(t => t.status === 'stolen').length;
      const totalCount = store.trolleys.length;
      const alertCount = alertsByStore[store.id] || 0;
      const recentMaintenanceCount = maintenanceByStore[store.id] || 0;

      // Calculate health metrics
      const activePercentage = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;
      const maintenancePercentage = totalCount > 0 ? Math.round((maintenanceCount / totalCount) * 100) : 0;
      const stolenPercentage = totalCount > 0 ? Math.round((stolenCount / totalCount) * 100) : 0;
      const capacityUtilization = store.total_capacity > 0 ? Math.round((totalCount / store.total_capacity) * 100) : 0;
      const belowThreshold = activeCount < store.active_threshold;

      // Determine health status with new thresholds: Good (70-100), Moderate (40-69), Bad (0-39)
      let healthStatus, healthScore;

      // Start with base score from active percentage (ensure it's a number)
      healthScore = Number(activePercentage) || 0;

      // Apply penalties for various issues
      if (belowThreshold) {
        healthScore -= 15; // Significant penalty for being below threshold
      }

      // Alert penalties
      if (alertCount > 0) {
        healthScore -= Math.min(alertCount * 3, 20); // Up to -20 for alerts
      }

      // Maintenance backlog penalty
      if (maintenancePercentage > 30) {
        healthScore -= 10;
      } else if (maintenancePercentage > 20) {
        healthScore -= 5;
      }

      // Stolen trolleys penalty
      if (stolenPercentage > 10) {
        healthScore -= 10;
      } else if (stolenPercentage > 5) {
        healthScore -= 5;
      }

      // Ensure score stays within 0-100 range and is always a valid number
      healthScore = Math.max(0, Math.min(100, Math.round(Number(healthScore) || 0)));

      // Determine status based on final score
      if (healthScore >= 70) {
        healthStatus = 'good';
      } else if (healthScore >= 40) {
        healthStatus = 'moderate';
      } else {
        healthStatus = 'bad';
      }

      // Generate intelligent recommendations
      const recommendations = [];

      if (healthStatus === 'bad') {
        if (maintenancePercentage > 30) {
          recommendations.push({
            priority: 'critical',
            category: 'maintenance',
            action: 'Prioritize maintenance backlog immediately',
            details: `${maintenanceCount} trolleys (${maintenancePercentage}%) in maintenance`
          });
        }
        if (stolenPercentage > 10) {
          recommendations.push({
            priority: 'critical',
            category: 'security',
            action: 'Investigate trolley theft patterns',
            details: `${stolenCount} trolleys marked as stolen`
          });
        }
        if (belowThreshold) {
          recommendations.push({
            priority: 'critical',
            category: 'availability',
            action: 'Urgent: Active trolley count below threshold',
            details: `Only ${activeCount} active (threshold: ${store.active_threshold})`
          });
        }
        if (alertCount > 5) {
          recommendations.push({
            priority: 'high',
            category: 'alerts',
            action: 'Address pending alerts',
            details: `${alertCount} unresolved alerts require attention`
          });
        }
        if (capacityUtilization < 60) {
          recommendations.push({
            priority: 'medium',
            category: 'capacity',
            action: 'Consider increasing trolley inventory',
            details: `Operating at ${capacityUtilization}% of total capacity`
          });
        }
      } else if (healthStatus === 'moderate') {
        if (maintenancePercentage > 20) {
          recommendations.push({
            priority: 'high',
            category: 'maintenance',
            action: 'Expedite maintenance to increase active trolleys',
            details: `${maintenanceCount} trolleys awaiting maintenance`
          });
        }
        if (belowThreshold) {
          recommendations.push({
            priority: 'high',
            category: 'availability',
            action: 'Increase active trolley availability',
            details: `Current: ${activeCount}, Target: ${store.active_threshold}`
          });
        }
        if (alertCount > 3) {
          recommendations.push({
            priority: 'medium',
            category: 'alerts',
            action: 'Review and resolve pending alerts',
            details: `${alertCount} alerts need attention`
          });
        }
        if (stolenPercentage > 5) {
          recommendations.push({
            priority: 'medium',
            category: 'security',
            action: 'Monitor trolley security measures',
            details: `${stolenCount} stolen trolleys detected`
          });
        }
      }

      return {
        id: store.id,
        name: store.name,
        active: activeCount,
        maintenance: maintenanceCount,
        stolen: stolenCount,
        total: totalCount,
        capacity: store.total_capacity,
        threshold: store.active_threshold,
        activePercentage: Number(activePercentage) || 0,
        maintenancePercentage: Number(maintenancePercentage) || 0,
        stolenPercentage: Number(stolenPercentage) || 0,
        capacityUtilization: Number(capacityUtilization) || 0,
        alertCount: Number(alertCount) || 0,
        recentMaintenanceCount: Number(recentMaintenanceCount) || 0,
        healthStatus: healthStatus || 'bad',
        healthScore: Number.isFinite(healthScore) ? healthScore : 0,
        belowThreshold: Boolean(belowThreshold),
        recommendations
      };
    });

    res.json({
      summary: {
        total_trolleys: totalTrolleys,
        status_counts: {
          active: statusCounts.active || 0,
          maintenance: statusCounts.maintenance || 0,
          stolen: statusCounts.stolen || 0,
          decommissioned: statusCounts.decommissioned || 0,
          recovered: statusCounts.recovered || 0
        },
        unresolved_alerts: unresolvedAlerts,
        maintenance_this_month: maintenanceThisMonth
      },
      recent_activity: recentActivity,
      stores: storeSummary
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getMapData = async (req, res) => {
  try {
    const stores = await Store.findAll({
      attributes: [
        'id',
        'name',
        'location_lat',
        'location_long',
        'address'
      ],
      include: [{
        model: Trolley,
        as: 'trolleys',
        attributes: ['id', 'status']
      }]
    });

    const mapData = stores.map(store => ({
      id: store.id,
      name: store.name,
      latitude: parseFloat(store.location_lat),
      longitude: parseFloat(store.location_long),
      address: store.address,
      trolley_counts: {
        active: store.trolleys.filter(t => t.status === 'active').length,
        maintenance: store.trolleys.filter(t => t.status === 'maintenance').length,
        stolen: store.trolleys.filter(t => t.status === 'stolen').length,
        total: store.trolleys.length
      }
    }));

    res.json({ stores: mapData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Status changes over time
    const statusChanges = await StatusHistory.findAll({
      where: {
        timestamp: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        [fn('DATE', col('timestamp')), 'date'],
        'new_status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: [literal('DATE(timestamp)'), 'new_status'],
      order: [[literal('DATE(timestamp)'), 'ASC']]
    });

    // Maintenance costs
    const maintenanceCosts = await MaintenanceRecord.findAll({
      where: {
        maintenance_date: {
          [Op.gte]: startDate
        },
        cost: {
          [Op.not]: null
        }
      },
      attributes: [
        [fn('DATE', col('maintenance_date')), 'date'],
        [fn('SUM', col('cost')), 'total_cost'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [literal('DATE(maintenance_date)')],
      order: [[literal('DATE(maintenance_date)'), 'ASC']]
    });

    // Trolleys flagged as stolen
    const stolenTrends = await StatusHistory.findAll({
      where: {
        timestamp: {
          [Op.gte]: startDate
        },
        new_status: 'stolen'
      },
      attributes: [
        [fn('DATE', col('timestamp')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [literal('DATE(timestamp)')],
      order: [[literal('DATE(timestamp)'), 'ASC']]
    });

    res.json({
      period: `${period} days`,
      status_changes: statusChanges,
      maintenance: maintenanceCosts,
      stolen_trends: stolenTrends
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
