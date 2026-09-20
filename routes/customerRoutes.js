const express = require('express');
const Parcel = require('../models/Parcel');
const isAuthenticated = require('../middlewares/isAuthenticated');
const authorizeRole = require('../middlewares/authorizeRole');
const generateTrackingId = require('../helpers/generateTrackingId');
const calculateCharge = require('../helpers/calculateCharge');

const router = express.Router();

// Apply auth middleware to all customer routes
router.use(isAuthenticated);
router.use(authorizeRole('customer'));

// GET /customer/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const customerId = req.session.user._id;

    // Fetch customer's parcels
    const parcels = await Parcel.find({ customer: customerId }).sort({ bookedAt: -1 });

    // Calculate quick stats
    const totalParcels = parcels.length;
    const inTransit = parcels.filter(p => ['Picked Up', 'In Transit', 'Out for Delivery'].includes(p.currentStatus)).length;
    const delivered = parcels.filter(p => p.currentStatus === 'Delivered').length;
    const failed = parcels.filter(p => p.currentStatus === 'Failed').length;
    const booked = parcels.filter(p => p.currentStatus === 'Booked').length;

    res.render('customer/dashboard', {
      title: 'Customer Dashboard - Courier Tracking System',
      stats: { totalParcels, inTransit, delivered, failed, booked },
      parcels: parcels.slice(0, 10) // Show last 10
    });
  } catch (err) {
    console.error('Customer dashboard error:', err);
    req.flash('error', 'Failed to load dashboard data.');
    res.redirect('/');
  }
});

// GET /customer/book
router.get('/book', (req, res) => {
  res.render('customer/bookParcel', {
    title: 'Book a Parcel - Courier Tracking System',
    user: req.session.user
  });
});

// GET /customer/estimate - API endpoint for dynamic delivery charge preview
router.get('/estimate', async (req, res) => {
  try {
    const { pincode, weight } = req.query;
    if (!pincode || !weight) {
      return res.status(400).json({ error: 'Pincode and weight are required' });
    }
    const estimate = await calculateCharge(pincode, weight);
    return res.json(estimate);
  } catch (err) {
    console.error('Estimate error:', err);
    return res.status(500).json({ error: 'Could not calculate estimate' });
  }
});

// POST /customer/book
router.post('/book', async (req, res) => {
  try {
    const {
      senderName,
      senderPhone,
      senderAddress,
      senderPincode,
      receiverName,
      receiverPhone,
      receiverAddress,
      receiverPincode,
      weight,
      parcelType,
      description
    } = req.body;

    // Validate fields
    if (
      !senderName || !senderPhone || !senderAddress || !senderPincode ||
      !receiverName || !receiverPhone || !receiverAddress || !receiverPincode ||
      !weight
    ) {
      req.flash('error', 'Please fill in all mandatory fields.');
      return res.redirect('/customer/book');
    }

    const numericWeight = parseFloat(weight);
    if (isNaN(numericWeight) || numericWeight <= 0) {
      req.flash('error', 'Weight must be a valid positive number.');
      return res.redirect('/customer/book');
    }

    // Generate unique tracking ID
    let trackingId;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      trackingId = generateTrackingId();
      const existing = await Parcel.findOne({ trackingId });
      if (!existing) isUnique = true;
      attempts++;
    }

    // Calculate delivery charge (Stretch Goal)
    const chargeInfo = await calculateCharge(receiverPincode, numericWeight);

    const newParcel = new Parcel({
      trackingId,
      customer: req.session.user._id,
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      senderAddress: senderAddress.trim(),
      senderPincode: senderPincode.trim(),
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverAddress: receiverAddress.trim(),
      receiverPincode: receiverPincode.trim(),
      weight: numericWeight,
      parcelType: parcelType || 'Small Box',
      description: description ? description.trim() : '',
      currentStatus: 'Booked',
      deliveryCharge: chargeInfo.charge,
      statusHistory: [
        {
          status: 'Booked',
          timestamp: new Date(),
          updatedBy: req.session.user._id,
          remarks: `Parcel booked successfully by ${req.session.user.name}. Zone: ${chargeInfo.zoneName}.`
        }
      ]
    });

    await newParcel.save();

    req.flash('success', `Parcel booked successfully! Your Tracking ID is ${trackingId}`);
    res.render('customer/bookingSuccess', {
      title: 'Booking Confirmed - Courier Tracking System',
      parcel: newParcel,
      chargeInfo
    });
  } catch (err) {
    console.error('Parcel booking error:', err);
    req.flash('error', 'Failed to book parcel. Please check your inputs and try again.');
    res.redirect('/customer/book');
  }
});

// GET /customer/parcels
router.get('/parcels', async (req, res) => {
  try {
    const customerId = req.session.user._id;
    const { status, search } = req.query;

    const query = { customer: customerId };
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

    const parcels = await Parcel.find(query)
      .populate('assignedAgent', 'name phone')
      .sort({ bookedAt: -1 });

    res.render('customer/myParcels', {
      title: 'My Booked Parcels - Courier Tracking System',
      parcels,
      currentFilter: status || 'all',
      searchQuery: search || ''
    });
  } catch (err) {
    console.error('Error fetching customer parcels:', err);
    req.flash('error', 'Unable to retrieve parcels.');
    res.redirect('/customer/dashboard');
  }
});

// POST /customer/cancel/:id
router.post('/cancel/:id', async (req, res) => {
  try {
    const parcelId = req.params.id;
    const customerId = req.session.user._id;

    const parcel = await Parcel.findOne({ _id: parcelId, customer: customerId });

    if (!parcel) {
      req.flash('error', 'Parcel not found.');
      return res.redirect('/customer/parcels');
    }

    if (parcel.currentStatus !== 'Booked') {
      req.flash('error', 'Parcels can only be cancelled while status is "Booked". This parcel is already being processed.');
      return res.redirect('/customer/parcels');
    }

    parcel.currentStatus = 'Cancelled';
    parcel.statusHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      updatedBy: customerId,
      remarks: 'Parcel cancelled by customer.'
    });

    await parcel.save();
    req.flash('success', `Parcel ${parcel.trackingId} has been successfully cancelled.`);
    res.redirect('/customer/parcels');
  } catch (err) {
    console.error('Cancel parcel error:', err);
    req.flash('error', 'Failed to cancel parcel.');
    res.redirect('/customer/parcels');
  }
});

module.exports = router;
