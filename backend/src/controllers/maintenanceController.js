const { MaintenanceRecord, Trolley, User } = require('../models');

exports.getAllMaintenance = async (req, res) => {
  try {
    const { trolley_id, start_date, end_date } = req.query;
    const where = {};

    if (trolley_id) where.trolley_id = trolley_id;
    if (start_date && end_date) {
      where.maintenance_date = {
        [require('sequelize').Op.between]: [start_date, end_date]
      };
    }

    const records = await MaintenanceRecord.findAll({
      where,
      include: [
        {
          model: Trolley,
          as: 'trolley',
          attributes: ['id', 'rfid_tag', 'barcode', 'status']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['maintenance_date', 'DESC']]
    });

    res.json({ records });
  } catch (error) {
    console.error('Error in getAllMaintenance:', error);
    res.status(500).json({
      error: 'Failed to fetch maintenance records',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.createMaintenanceRecord = async (req, res) => {
  try {
    const {
      trolley_id,
      maintenance_date,
      description,
      technician,
      status_after,
      cost
    } = req.body;

    // Verify trolley exists
    const trolley = await Trolley.findByPk(trolley_id);
    if (!trolley) {
      return res.status(404).json({ error: 'Trolley not found' });
    }

    const record = await MaintenanceRecord.create({
      trolley_id,
      maintenance_date: maintenance_date || new Date(),
      description,
      technician,
      status_after,
      cost,
      performed_by: req.user.id
    });

    res.status(201).json({
      message: 'Maintenance record created successfully',
      record
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMaintenanceById = async (req, res) => {
  try {
    const record = await MaintenanceRecord.findByPk(req.params.id, {
      include: [
        {
          model: Trolley,
          as: 'trolley',
          attributes: ['id', 'rfid_tag', 'barcode', 'status']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!record) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    res.json({ record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTrolleyMaintenance = async (req, res) => {
  try {
    const records = await MaintenanceRecord.findAll({
      where: { trolley_id: req.params.trolley_id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['maintenance_date', 'DESC']]
    });

    res.json({ records });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMaintenanceRecord = async (req, res) => {
  try {
    const record = await MaintenanceRecord.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    const {
      maintenance_date,
      description,
      technician,
      status_after,
      cost
    } = req.body;

    await record.update({
      maintenance_date: maintenance_date || record.maintenance_date,
      description: description || record.description,
      technician: technician || record.technician,
      status_after: status_after || record.status_after,
      cost: cost !== undefined ? cost : record.cost
    });

    res.json({
      message: 'Maintenance record updated successfully',
      record
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMaintenanceRecord = async (req, res) => {
  try {
    const record = await MaintenanceRecord.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    await record.destroy();
    res.json({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
