const { Store, Trolley } = require('../models');

exports.getAllStores = async (req, res) => {
  try {
    const { province, brand, city } = req.query;
    const where = {};

    // Phase 2B: Add filtering by province, brand, and city
    if (province) where.province = province;
    if (brand) where.brand = brand;
    if (city) where.city = city;

    const stores = await Store.findAll({
      where,
      include: [{
        model: Trolley,
        as: 'trolleys',
        attributes: ['id', 'status'],
        required: false
      }],
      order: [['province', 'ASC'], ['city', 'ASC'], ['name', 'ASC']]
    });

    // Add trolley counts by status
    const storesWithCounts = stores.map(store => {
      const trolleys = store.trolleys || [];
      return {
        ...store.toJSON(),
        trolley_counts: {
          active: trolleys.filter(t => t.status === 'active').length,
          maintenance: trolleys.filter(t => t.status === 'maintenance').length,
          stolen: trolleys.filter(t => t.status === 'stolen').length,
          decommissioned: trolleys.filter(t => t.status === 'decommissioned').length,
          recovered: trolleys.filter(t => t.status === 'recovered').length,
          total: trolleys.length
        }
      };
    });

    res.json({ stores: storesWithCounts });
  } catch (error) {
    console.error('Error in getAllStores:', error);
    res.status(500).json({
      error: 'Failed to fetch stores',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getStoreById = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id, {
      include: [{
        model: Trolley,
        as: 'trolleys'
      }]
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({ store });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createStore = async (req, res) => {
  try {
    const { name, location_lat, location_long, address, active_threshold } = req.body;

    const store = await Store.create({
      name,
      location_lat,
      location_long,
      address,
      active_threshold: active_threshold || 50
    });

    res.status(201).json({
      message: 'Store created successfully',
      store
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Phase 2B: Support all new fields
    const {
      name,
      brand,
      address,
      city,
      province,
      postal_code,
      location_lat,
      location_long,
      geofence_radius,
      active_threshold,
      total_capacity,
      manager_name,
      contact_number,
      operating_hours
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (brand !== undefined) updateData.brand = brand;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (province !== undefined) updateData.province = province;
    if (postal_code !== undefined) updateData.postal_code = postal_code;
    if (location_lat !== undefined) updateData.location_lat = location_lat;
    if (location_long !== undefined) updateData.location_long = location_long;
    if (geofence_radius !== undefined) updateData.geofence_radius = geofence_radius;
    if (active_threshold !== undefined) updateData.active_threshold = active_threshold;
    if (total_capacity !== undefined) updateData.total_capacity = total_capacity;
    if (manager_name !== undefined) updateData.manager_name = manager_name;
    if (contact_number !== undefined) updateData.contact_number = contact_number;
    if (operating_hours !== undefined) updateData.operating_hours = operating_hours;

    await store.update(updateData);

    res.json({
      message: 'Store updated successfully',
      store
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteStore = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if store has trolleys
    const trolleyCount = await Trolley.count({ where: { store_id: store.id } });
    if (trolleyCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete store with associated trolleys',
        trolley_count: trolleyCount
      });
    }

    await store.destroy();
    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStoreTrolleys = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { store_id: req.params.id };

    if (status) {
      where.status = status;
    }

    const trolleys = await Trolley.findAll({
      where,
      order: [['last_scanned', 'DESC']]
    });

    res.json({ trolleys });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
