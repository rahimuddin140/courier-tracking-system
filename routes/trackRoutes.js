const express = require('express');
const Parcel = require('../models/Parcel');

const router = express.Router();

// GET /track - public tracking view
router.get('/track', async (req, res) => {
  const { trackingId } = req.query;
  let parcel = null;
  let notFound = false;

  if (trackingId && trackingId.trim()) {
    try {
      const cleanId = trackingId.trim().toUpperCase();
      parcel = await Parcel.findOne({ trackingId: cleanId })
        .populate('assignedAgent', 'name phone')
        .populate('statusHistory.updatedBy', 'name role');

      if (!parcel) {
        notFound = true;
      }
    } catch (err) {
      console.error('Error fetching parcel by query trackingId:', err);
      notFound = true;
    }
  }

  res.render('track', {
    title: 'Track Your Parcel - Courier Tracking System',
    parcel,
    searchedId: trackingId ? trackingId.trim().toUpperCase() : '',
    notFound
  });
});

// POST /track - public tracking lookup
router.post('/track', async (req, res) => {
  const { trackingId } = req.body;

  if (!trackingId || !trackingId.trim()) {
    req.flash('error', 'Please enter a valid Tracking ID.');
    return res.redirect('/track');
  }

  const cleanId = trackingId.trim().toUpperCase();
  try {
    const parcel = await Parcel.findOne({ trackingId: cleanId })
      .populate('assignedAgent', 'name phone')
      .populate('statusHistory.updatedBy', 'name role');

    if (!parcel) {
      return res.render('track', {
        title: 'Track Your Parcel - Courier Tracking System',
        parcel: null,
        searchedId: cleanId,
        notFound: true
      });
    }

    return res.render('track', {
      title: `Tracking ${parcel.trackingId} - Courier Tracking System`,
      parcel,
      searchedId: cleanId,
      notFound: false
    });
  } catch (err) {
    console.error('Error tracking parcel:', err);
    req.flash('error', 'Error looking up parcel tracking details.');
    return res.redirect('/track');
  }
});

module.exports = router;
