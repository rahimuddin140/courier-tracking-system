const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed', 'Cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: true }
);

const parcelSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: [true, 'Sender name is required'],
    trim: true
  },
  senderPhone: {
    type: String,
    required: [true, 'Sender phone is required'],
    trim: true
  },
  senderAddress: {
    type: String,
    required: [true, 'Sender address is required'],
    trim: true
  },
  senderPincode: {
    type: String,
    required: [true, 'Sender pincode is required'],
    trim: true
  },
  receiverName: {
    type: String,
    required: [true, 'Receiver name is required'],
    trim: true
  },
  receiverPhone: {
    type: String,
    required: [true, 'Receiver phone is required'],
    trim: true
  },
  receiverAddress: {
    type: String,
    required: [true, 'Receiver address is required'],
    trim: true
  },
  receiverPincode: {
    type: String,
    required: [true, 'Receiver pincode is required'],
    trim: true
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [0.01, 'Weight must be greater than 0']
  },
  parcelType: {
    type: String,
    enum: ['Document', 'Small Box', 'Medium Box', 'Large Box', 'Fragile', 'Other'],
    default: 'Small Box'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  currentStatus: {
    type: String,
    enum: ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed', 'Cancelled'],
    default: 'Booked'
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  statusHistory: [statusHistorySchema],
  bookedAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Parcel', parcelSchema);
