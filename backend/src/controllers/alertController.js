const { Alert, Store, Trolley, User } = require('../models');
const { Op } = require('sequelize');

exports.getAllAlerts = async (req, res) => {
  try {
    const { resolved, type, severity, store_id } = req.query;
    const where = {};

    if (resolved !== undefined) where.resolved = resolved === 'true';
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (store_id) where.store_id = store_id;

    const alerts = await Alert.findAll({
      where,
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name']
        },
        {
          model: Trolley,
          as: 'trolley',
          attributes: ['id', 'rfid_tag', 'barcode'],
          required: false
        },
        {
          model: User,
          as: 'resolvedBy',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [
        ['resolved', 'ASC'],
        ['severity', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id, {
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'address']
        },
        {
          model: Trolley,
          as: 'trolley',
          attributes: ['id', 'rfid_tag', 'barcode', 'status'],
          required: false
        },
        {
          model: User,
          as: 'resolvedBy',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (alert.resolved) {
      return res.status(400).json({ error: 'Alert already resolved' });
    }

    await alert.update({
      resolved: true,
      resolved_by: req.user.id,
      resolved_at: new Date()
    });

    res.json({
      message: 'Alert resolved successfully',
      alert
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await alert.destroy();
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUnresolvedCount = async (req, res) => {
  try {
    const count = await Alert.count({
      where: { resolved: false }
    });

    const bySeverity = await Alert.findAll({
      where: { resolved: false },
      attributes: [
        'severity',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['severity']
    });

    res.json({
      total: count,
      by_severity: bySeverity.reduce((acc, item) => {
        acc[item.severity] = parseInt(item.get('count'));
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
