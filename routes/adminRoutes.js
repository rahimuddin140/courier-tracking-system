const express = require('express');
const bcrypt = require('bcryptjs');
const Parcel = require('../models/Parcel');
const User = require('../models/User');
const Zone = require('../models/Zone');
const isAuthenticated = require('../middlewares/isAuthenticated');
const authorizeRole = require('../middlewares/authorizeRole');

const router = express.Router();

// Apply auth & admin role middlewares
router.use(isAuthenticated);
router.use(authorizeRole('admin'));

// GET /admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const allParcels = await Parcel.find().sort({ bookedAt: -1 });
    const agents = await User.find({ role: 'agent' }).populate('zone');

    const totalParcels = allParcels.length;

    // Time-based stats
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const bookedToday = allParcels.filter(p => new Date(p.bookedAt) >= startOfToday).length;
    const bookedThisWeek = allParcels.filter(p => new Date(p.bookedAt) >= startOfWeek).length;

    // Status counts
    const statusCounts = {
      Booked: allParcels.filter(p => p.currentStatus === 'Booked').length,
      'Picked Up': allParcels.filter(p => p.currentStatus === 'Picked Up').length,
      'In Transit': allParcels.filter(p => p.currentStatus === 'In Transit').length,
      'Out for Delivery': allParcels.filter(p => p.currentStatus === 'Out for Delivery').length,
      Delivered: allParcels.filter(p => p.currentStatus === 'Delivered').length,
      Failed: allParcels.filter(p => p.currentStatus === 'Failed').length,
      Cancelled: allParcels.filter(p => p.currentStatus === 'Cancelled').length
    };

    // Agent-wise workload calculation
    const agentWorkload = agents.map(agent => {
      const agentParcels = allParcels.filter(
        p => p.assignedAgent && p.assignedAgent.toString() === agent._id.toString()
      );
      return {
        _id: agent._id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        zoneName: agent.zone ? agent.zone.zoneName : 'Unassigned',
        isActive: agent.isActive,
        total: agentParcels.length,
        pickedUp: agentParcels.filter(p => p.currentStatus === 'Picked Up').length,
        inTransit: agentParcels.filter(p => p.currentStatus === 'In Transit').length,
        outForDelivery: agentParcels.filter(p => p.currentStatus === 'Out for Delivery').length,
        delivered: agentParcels.filter(p => p.currentStatus === 'Delivered').length,
        failed: agentParcels.filter(p => p.currentStatus === 'Failed').length,
        activeLoad: agentParcels.filter(p => ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(p.currentStatus)).length
      };
    });

    const recentParcels = await Parcel.find()
      .populate('assignedAgent', 'name')
      .populate('customer', 'name email')
      .sort({ bookedAt: -1 })
      .limit(10);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - Courier Tracking System',
      stats: {
        totalParcels,
        bookedToday,
        bookedThisWeek,
        statusCounts
      },
      agentWorkload,
      recentParcels
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    req.flash('error', 'Failed to load admin dashboard.');
    res.redirect('/');
  }
});

// GET /admin/parcels - list all parcels with filters
router.get('/parcels', async (req, res) => {
  try {
    const { status, agentId, search, dateFrom, dateTo } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.currentStatus = status;
    }
    if (agentId && agentId !== 'all') {
      if (agentId === 'unassigned') {
        query.assignedAgent = null;
      } else {
        query.assignedAgent = agentId;
      }
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { trackingId: regex },
        { senderName: regex },
        { receiverName: regex },
        { receiverPincode: regex },
        { receiverAddress: regex }
      ];
    }
    if (dateFrom || dateTo) {
      query.bookedAt = {};
      if (dateFrom) query.bookedAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const dTo = new Date(dateTo);
        dTo.setHours(23, 59, 59, 999);
        query.bookedAt.$lte = dTo;
      }
    }

    const parcels = await Parcel.find(query)
      .populate('assignedAgent', 'name phone email')
      .populate('customer', 'name email')
      .sort({ bookedAt: -1 });

    const agents = await User.find({ role: 'agent', isActive: true }).select('name _id');

    res.render('admin/allParcels', {
      title: 'Manage All Parcels - Courier Tracking System',
      parcels,
      agents,
      filters: {
        status: status || 'all',
        agentId: agentId || 'all',
        search: search || '',
        dateFrom: dateFrom || '',
        dateTo: dateTo || ''
      }
    });
  } catch (err) {
    console.error('Admin parcels error:', err);
    req.flash('error', 'Failed to fetch parcels.');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/parcel/:id/assign - assign or reassign agent
router.post('/parcel/:id/assign', async (req, res) => {
  try {
    const { agentId } = req.body;
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      req.flash('error', 'Parcel not found.');
      return res.redirect('/admin/parcels');
    }

    if (!agentId) {
      req.flash('error', 'Please select an agent to assign.');
      return res.redirect('/admin/parcels');
    }

    const agent = await User.findOne({ _id: agentId, role: 'agent' });
    if (!agent) {
      req.flash('error', 'Selected agent not found or invalid.');
      return res.redirect('/admin/parcels');
    }

    parcel.assignedAgent = agent._id;
    parcel.statusHistory.push({
      status: parcel.currentStatus,
      timestamp: new Date(),
      updatedBy: req.session.user._id,
      remarks: `Assigned to delivery agent ${agent.name} (${agent.phone}) by Admin.`
    });

    await parcel.save();

    req.flash('success', `Parcel ${parcel.trackingId} successfully assigned to ${agent.name}.`);
    res.redirect('/admin/parcels');
  } catch (err) {
    console.error('Admin assign error:', err);
    req.flash('error', 'Failed to assign parcel to agent.');
    res.redirect('/admin/parcels');
  }
});

// GET /admin/agents - list all agents
router.get('/agents', async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' }).populate('zone').sort({ createdAt: -1 });
    res.render('admin/manageAgents', {
      title: 'Manage Delivery Agents - Courier Tracking System',
      agents
    });
  } catch (err) {
    console.error('Error fetching agents:', err);
    req.flash('error', 'Failed to load agents.');
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/agents/create
router.get('/agents/create', async (req, res) => {
  try {
    const zones = await Zone.find().sort({ zoneName: 1 });
    res.render('admin/createAgent', {
      title: 'Create Delivery Agent - Courier Tracking System',
      zones
    });
  } catch (err) {
    console.error('Error loading create agent page:', err);
    req.flash('error', 'Failed to load agent creation form.');
    res.redirect('/admin/agents');
  }
});

// POST /admin/agents/create
router.post('/admin/agents/create', async (req, res) => {
  // Alias for path if needed
  res.redirect(307, '/admin/agents/create');
});

router.post('/agents/create', async (req, res) => {
  try {
    const { name, email, phone, password, zoneId } = req.body;

    if (!name || !email || !phone || !password) {
      req.flash('error', 'Name, email, phone, and password are required.');
      return res.redirect('/admin/agents/create');
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      req.flash('error', 'An account with this email already exists.');
      return res.redirect('/admin/agents/create');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAgent = new User({
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: 'agent',
      zone: zoneId && zoneId !== '' ? zoneId : null,
      isActive: true
    });

    await newAgent.save();

    req.flash('success', `Agent ${newAgent.name} created successfully.`);
    res.redirect('/admin/agents');
  } catch (err) {
    console.error('Error creating agent:', err);
    req.flash('error', 'Failed to create agent.');
    res.redirect('/admin/agents/create');
  }
});

// GET /admin/agents/edit/:id
router.get('/agents/edit/:id', async (req, res) => {
  try {
    const agent = await User.findById(req.params.id);
    if (!agent || agent.role !== 'agent') {
      req.flash('error', 'Agent not found.');
      return res.redirect('/admin/agents');
    }
    const zones = await Zone.find().sort({ zoneName: 1 });
    res.render('admin/editAgent', {
      title: `Edit Agent: ${agent.name} - Courier Tracking System`,
      agent,
      zones
    });
  } catch (err) {
    console.error('Error loading edit agent page:', err);
    req.flash('error', 'Failed to load agent edit form.');
    res.redirect('/admin/agents');
  }
});

// POST /admin/agents/edit/:id
router.post('/agents/edit/:id', async (req, res) => {
  try {
    const { name, phone, zoneId, isActive, password } = req.body;
    const agent = await User.findById(req.params.id);

    if (!agent || agent.role !== 'agent') {
      req.flash('error', 'Agent not found.');
      return res.redirect('/admin/agents');
    }

    agent.name = name ? name.trim() : agent.name;
    agent.phone = phone ? phone.trim() : agent.phone;
    agent.zone = zoneId && zoneId !== '' ? zoneId : null;
    agent.isActive = isActive === 'true' || isActive === true || isActive === 'on';

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      agent.password = await bcrypt.hash(password.trim(), salt);
    }

    await agent.save();

    req.flash('success', `Agent ${agent.name} updated successfully.`);
    res.redirect('/admin/agents');
  } catch (err) {
    console.error('Error updating agent:', err);
    req.flash('error', 'Failed to update agent.');
    res.redirect(`/admin/agents/edit/${req.params.id}`);
  }
});

// GET /admin/zones - list all zones
router.get('/zones', async (req, res) => {
  try {
    const zones = await Zone.find().sort({ zoneName: 1 });
    res.render('admin/manageZones', {
      title: 'Manage Delivery Zones - Courier Tracking System',
      zones
    });
  } catch (err) {
    console.error('Error fetching zones:', err);
    req.flash('error', 'Failed to load zones.');
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/zones/create
router.get('/zones/create', (req, res) => {
  res.render('admin/createZone', {
    title: 'Create Delivery Zone - Courier Tracking System'
  });
});

// POST /admin/zones/create
router.post('/zones/create', async (req, res) => {
  try {
    const { zoneName, pincodes, baseFee, perKgRate } = req.body;

    if (!zoneName) {
      req.flash('error', 'Zone name is required.');
      return res.redirect('/admin/zones/create');
    }

    const existing = await Zone.findOne({ zoneName: zoneName.trim() });
    if (existing) {
      req.flash('error', 'A zone with this name already exists.');
      return res.redirect('/admin/zones/create');
    }

    const pincodeArray = pincodes
      ? pincodes.split(',').map(p => p.trim()).filter(p => p.length > 0)
      : [];

    const newZone = new Zone({
      zoneName: zoneName.trim(),
      pincodes: pincodeArray,
      baseFee: parseFloat(baseFee) || 50,
      perKgRate: parseFloat(perKgRate) || 20
    });

    await newZone.save();

    req.flash('success', `Zone "${newZone.zoneName}" created successfully.`);
    res.redirect('/admin/zones');
  } catch (err) {
    console.error('Error creating zone:', err);
    req.flash('error', 'Failed to create zone.');
    res.redirect('/admin/zones/create');
  }
});

// GET /admin/zones/edit/:id
router.get('/zones/edit/:id', async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      req.flash('error', 'Zone not found.');
      return res.redirect('/admin/zones');
    }
    res.render('admin/editZone', {
      title: `Edit Zone: ${zone.zoneName} - Courier Tracking System`,
      zone
    });
  } catch (err) {
    console.error('Error loading edit zone page:', err);
    req.flash('error', 'Failed to load zone edit form.');
    res.redirect('/admin/zones');
  }
});

// POST /admin/zones/edit/:id
router.post('/zones/edit/:id', async (req, res) => {
  try {
    const { zoneName, pincodes, baseFee, perKgRate } = req.body;
    const zone = await Zone.findById(req.params.id);

    if (!zone) {
      req.flash('error', 'Zone not found.');
      return res.redirect('/admin/zones');
    }

    const pincodeArray = pincodes
      ? pincodes.split(',').map(p => p.trim()).filter(p => p.length > 0)
      : [];

    zone.zoneName = zoneName ? zoneName.trim() : zone.zoneName;
    zone.pincodes = pincodeArray;
    zone.baseFee = parseFloat(baseFee) >= 0 ? parseFloat(baseFee) : zone.baseFee;
    zone.perKgRate = parseFloat(perKgRate) >= 0 ? parseFloat(perKgRate) : zone.perKgRate;

    await zone.save();

    req.flash('success', `Zone "${zone.zoneName}" updated successfully.`);
    res.redirect('/admin/zones');
  } catch (err) {
    console.error('Error updating zone:', err);
    req.flash('error', 'Failed to update zone.');
    res.redirect(`/admin/zones/edit/${req.params.id}`);
  }
});

module.exports = router;
