const express = require('express');
const Parcel = require('../models/Parcel');
const isAuthenticated = require('../middlewares/isAuthenticated');
const authorizeRole = require('../middlewares/authorizeRole');

const router = express.Router();

// Apply auth & role middlewares
router.use(isAuthenticated);
router.use(authorizeRole('agent'));

// Valid lifecycle transitions mapping
const VALID_TRANSITIONS = {
  'Booked': ['Picked Up'],
  'Picked Up': ['In Transit'],
  'In Transit': ['Out for Delivery'],
  'Out for Delivery': ['Delivered', 'Failed'],
  'Delivered': [],
  'Failed': ['Out for Delivery'], // Agent can re-attempt delivery if customer requested
  'Cancelled': []
};

// GET /agent/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const agentId = req.session.user._id;
    const parcels = await Parcel.find({ assignedAgent: agentId }).sort({ bookedAt: -1 });

    const totalAssigned = parcels.length;
    const pickedUp = parcels.filter(p => p.currentStatus === 'Picked Up').length;
    const inTransit = parcels.filter(p => p.currentStatus === 'In Transit').length;
    const outForDelivery = parcels.filter(p => p.currentStatus === 'Out for Delivery').length;
    const delivered = parcels.filter(p => p.currentStatus === 'Delivered').length;
    const failed = parcels.filter(p => p.currentStatus === 'Failed').length;
    const pending = parcels.filter(p => ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(p.currentStatus)).length;

    res.render('agent/dashboard', {
      title: 'Agent Dashboard - Courier Tracking System',
      stats: {
        totalAssigned,
        pending,
        pickedUp,
        inTransit,
        outForDelivery,
        delivered,
        failed
      },
      recentParcels: parcels.slice(0, 10)
    });
  } catch (err) {
    console.error('Agent dashboard error:', err);
    req.flash('error', 'Failed to load agent dashboard.');
    res.redirect('/');
  }
});

// GET /agent/parcels
router.get('/parcels', async (req, res) => {
  try {
    const agentId = req.session.user._id;
    const { status, search } = req.query;

    const query = { assignedAgent: agentId };
    if (status && status !== 'all') {
      query.currentStatus = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { trackingId: regex },
        { receiverName: regex },
        { receiverAddress: regex },
        { receiverPincode: regex }
      ];
    }

    const parcels = await Parcel.find(query).sort({ bookedAt: -1 });

    res.render('agent/assignedParcels', {
      title: 'Assigned Parcels - Courier Tracking System',
      parcels,
      currentFilter: status || 'all',
      searchQuery: search || ''
    });
  } catch (err) {
    console.error('Agent parcels error:', err);
    req.flash('error', 'Failed to load parcels list.');
    res.redirect('/agent/dashboard');
  }
});

// GET /agent/parcel/:id
router.get('/parcel/:id', async (req, res) => {
  try {
    const agentId = req.session.user._id;
    const parcel = await Parcel.findOne({ _id: req.params.id, assignedAgent: agentId })
      .populate('customer', 'name email phone')
      .populate('statusHistory.updatedBy', 'name role');

    if (!parcel) {
      req.flash('error', 'Parcel not found or not assigned to you.');
      return res.redirect('/agent/parcels');
    }

    const nextAllowedStatuses = VALID_TRANSITIONS[parcel.currentStatus] || [];

    res.render('agent/parcelDetail', {
      title: `Parcel ${parcel.trackingId} - Courier Tracking System`,
      parcel,
      nextAllowedStatuses
    });
  } catch (err) {
    console.error('Agent parcel detail error:', err);
    req.flash('error', 'Failed to load parcel details.');
    res.redirect('/agent/parcels');
  }
});

// POST /agent/parcel/:id/update
router.post('/parcel/:id/update', async (req, res) => {
  try {
    const agentId = req.session.user._id;
    const { status, remarks } = req.body;

    const parcel = await Parcel.findOne({ _id: req.params.id, assignedAgent: agentId });
    if (!parcel) {
      req.flash('error', 'Parcel not found or not assigned to you.');
      return res.redirect('/agent/parcels');
    }

    // Validate lifecycle transitions
    const allowed = VALID_TRANSITIONS[parcel.currentStatus] || [];
    if (!allowed.includes(status)) {
      req.flash('error', `Invalid status transition. Cannot transition from "${parcel.currentStatus}" to "${status}".`);
      return res.redirect(`/agent/parcel/${parcel._id}`);
    }

    // Apply update
    parcel.currentStatus = status;
    const now = new Date();

    if (status === 'Delivered') {
      parcel.deliveredAt = now;
    }

    parcel.statusHistory.push({
      status,
      timestamp: now,
      updatedBy: agentId,
      remarks: remarks ? remarks.trim() : `Status updated to ${status} by agent ${req.session.user.name}.`
    });

    await parcel.save();

    req.flash('success', `Status for parcel ${parcel.trackingId} successfully updated to "${status}".`);
    res.redirect(`/agent/parcel/${parcel._id}`);
  } catch (err) {
    console.error('Agent update status error:', err);
    req.flash('error', 'Failed to update parcel status.');
    res.redirect('/agent/parcels');
  }
});

module.exports = router;
