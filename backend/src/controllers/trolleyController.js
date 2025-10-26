const { Trolley, Store, StatusHistory, MaintenanceRecord, Alert } = require('../models');
const { Op } = require('sequelize');
const QRCode = require('qrcode');

exports.getAllTrolleys = async (req, res) => {
  try {
    const { status, store_id, search, limit = 100, offset = 0 } = req.query;
    const where = {};

    if (status) where.status = status;
    if (store_id) where.store_id = parseInt(store_id);
    if (search) {
      where[Op.or] = [
        { rfid_tag: { [Op.iLike]: `%${search}%` } },
        { barcode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: trolleys } = await Trolley.findAndCountAll({
      where,
      include: [{
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'location_lat', 'location_long'],
        required: false // Use LEFT JOIN instead of INNER JOIN for better performance
      }],
      order: [['updated_at', 'DESC']],
      limit: Math.min(parseInt(limit), 500), // Max 500 records per request
      offset: parseInt(offset),
      subQuery: false // Avoid subqueries for better performance
    });

    res.json({
      trolleys,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: count > (parseInt(offset) + trolleys.length)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTrolleyById = async (req, res) => {
  try {
    const trolley = await Trolley.findByPk(req.params.id, {
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'address', 'location_lat', 'location_long']
        },
        {
          model: StatusHistory,
          as: 'statusHistory',
          include: [{
            model: require('../models/User'),
            as: 'user',
            attributes: ['id', 'name', 'email']
          }],
          order: [['timestamp', 'DESC']],
          limit: 10
        },
        {
          model: MaintenanceRecord,
          as: 'maintenanceRecords',
          order: [['maintenance_date', 'DESC']],
          limit: 5
        }
      ]
    });

    if (!trolley) {
      return res.status(404).json({ error: 'Trolley not found' });
    }

    res.json({ trolley });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTrolley = async (req, res) => {
  try {
    const { rfid_tag, barcode, store_id, status } = req.body;

    // Check if RFID tag already exists
    const existing = await Trolley.findOne({ where: { rfid_tag } });
    if (existing) {
      return res.status(400).json({ error: 'RFID tag already registered' });
    }

    const trolley = await Trolley.create({
      rfid_tag,
      barcode,
      store_id,
      status: status || 'active',
      last_scanned: new Date()
    });

    // Create initial status history
    await StatusHistory.create({
      trolley_id: trolley.id,
      previous_status: null,
      new_status: trolley.status,
      updated_by: req.user.id,
      notes: 'Initial registration',
      timestamp: new Date()
    });

    res.status(201).json({
      message: 'Trolley registered successfully',
      trolley
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTrolley = async (req, res) => {
  try {
    const trolley = await Trolley.findByPk(req.params.id);
    if (!trolley) {
      return res.status(404).json({ error: 'Trolley not found' });
    }

    const { rfid_tag, barcode, store_id, status } = req.body;

    await trolley.update({
      rfid_tag: rfid_tag || trolley.rfid_tag,
      barcode: barcode || trolley.barcode,
      store_id: store_id || trolley.store_id,
      status: status || trolley.status
    });

    res.json({
      message: 'Trolley updated successfully',
      trolley
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.scanTrolley = async (req, res) => {
  try {
    const { identifier, new_status, notes } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: 'Identifier is required' });
    }

    // Trim whitespace from identifier
    const trimmedIdentifier = identifier.trim();

    // Find trolley by RFID tag or barcode (case-insensitive)
    const trolley = await Trolley.findOne({
      where: {
        [Op.or]: [
          { rfid_tag: { [Op.iLike]: trimmedIdentifier } },
          { barcode: { [Op.iLike]: trimmedIdentifier } }
        ]
      },
      include: [{
        model: Store,
        as: 'store',
        attributes: ['id', 'name']
      }]
    });

    if (!trolley) {
      return res.status(404).json({ error: 'Trolley not found. Please check the RFID tag or barcode.' });
    }

    const previousStatus = trolley.status;
    const updateData = {
      last_scanned: new Date()
    };

    // Handle status change
    if (new_status && new_status !== previousStatus) {
      updateData.status = new_status;

      // If recovering from stolen status, remove default barcode
      if (previousStatus === 'stolen' && trolley.is_default_barcode) {
        updateData.barcode = null;
        updateData.is_default_barcode = false;
      }

      // Create status history entry
      await StatusHistory.create({
        trolley_id: trolley.id,
        previous_status: previousStatus,
        new_status: new_status,
        updated_by: req.user.id,
        notes: notes || null,
        timestamp: new Date()
      });

      // Create alert if recovered from stolen
      if (previousStatus === 'stolen' && new_status === 'recovered') {
        await Alert.create({
          store_id: trolley.store_id,
          trolley_id: trolley.id,
          type: 'recovered',
          severity: 'info',
          message: `Trolley ${trolley.rfid_tag} has been recovered at ${trolley.store.name}`,
          resolved: false
        });
      }
    }

    await trolley.update(updateData);

    res.json({
      message: 'Trolley scanned successfully',
      trolley,
      status_changed: previousStatus !== new_status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTrolleyHistory = async (req, res) => {
  try {
    const history = await StatusHistory.findAll({
      where: { trolley_id: req.params.id },
      include: [{
        model: require('../models/User'),
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['timestamp', 'DESC']]
    });

    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTrolley = async (req, res) => {
  try {
    const trolley = await Trolley.findByPk(req.params.id);
    if (!trolley) {
      return res.status(404).json({ error: 'Trolley not found' });
    }

    await trolley.destroy();
    res.json({ message: 'Trolley deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate QR code for a trolley
 * GET /api/trolleys/:id/qrcode
 */
exports.generateQRCode = async (req, res) => {
  try {
    const trolley = await Trolley.findByPk(req.params.id, {
      include: [{
        model: Store,
        as: 'store',
        attributes: ['id', 'name']
      }]
    });

    if (!trolley) {
      return res.status(404).json({ error: 'Trolley not found' });
    }

    // Create QR code data with trolley information
    const qrData = JSON.stringify({
      id: trolley.id,
      rfid_tag: trolley.rfid_tag,
      barcode: trolley.barcode,
      store_id: trolley.store_id,
      store_name: trolley.store?.name,
      type: 'cartsaver_trolley'
    });

    // Generate QR code as data URL (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#C8102E', // Shoprite red
        light: '#FFFFFF'
      }
    });

    res.json({
      trolley: {
        id: trolley.id,
        rfid_tag: trolley.rfid_tag,
        barcode: trolley.barcode,
        store_name: trolley.store?.name
      },
      qr_code: qrCodeDataUrl,
      qr_data: qrData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate QR codes for multiple trolleys (bulk)
 * POST /api/trolleys/qrcodes/bulk
 * Body: { trolley_ids: [1, 2, 3] } or { store_id: 1, limit: 10 }
 */
exports.generateBulkQRCodes = async (req, res) => {
  try {
    const { trolley_ids, store_id, limit = 50 } = req.body;

    let trolleys;

    if (trolley_ids && Array.isArray(trolley_ids)) {
      trolleys = await Trolley.findAll({
        where: { id: { [Op.in]: trolley_ids } },
        include: [{
          model: Store,
          as: 'store',
          attributes: ['id', 'name']
        }],
        limit: Math.min(limit, 100)
      });
    } else if (store_id) {
      trolleys = await Trolley.findAll({
        where: { store_id: parseInt(store_id) },
        include: [{
          model: Store,
          as: 'store',
          attributes: ['id', 'name']
        }],
        limit: Math.min(limit, 100)
      });
    } else {
      return res.status(400).json({
        error: 'Either trolley_ids array or store_id is required'
      });
    }

    const qrCodes = await Promise.all(trolleys.map(async (trolley) => {
      const qrData = JSON.stringify({
        id: trolley.id,
        rfid_tag: trolley.rfid_tag,
        barcode: trolley.barcode,
        store_id: trolley.store_id,
        store_name: trolley.store?.name,
        type: 'cartsaver_trolley'
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#C8102E',
          light: '#FFFFFF'
        }
      });

      return {
        trolley_id: trolley.id,
        rfid_tag: trolley.rfid_tag,
        barcode: trolley.barcode,
        store_name: trolley.store?.name,
        qr_code: qrCodeDataUrl
      };
    }));

    res.json({
      count: qrCodes.length,
      qr_codes: qrCodes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
