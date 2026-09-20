const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  zoneName: {
    type: String,
    required: [true, 'Zone name is required'],
    unique: true,
    trim: true
  },
  pincodes: {
    type: [String],
    default: []
  },
  baseFee: {
    type: Number,
    default: 50,
    min: [0, 'Base fee cannot be negative']
  },
  perKgRate: {
    type: Number,
    default: 20,
    min: [0, 'Rate per kg cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Zone', zoneSchema);
