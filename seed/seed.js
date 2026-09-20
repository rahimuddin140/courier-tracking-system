require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Zone = require('../models/Zone');
const Parcel = require('../models/Parcel');
const generateTrackingId = require('../helpers/generateTrackingId');

async function seedDatabase() {
  console.log('🌱 Starting Courier System Database Seeding...');

  await connectDB();

  try {
    // 1. Clear existing collections
    console.log('🧹 Clearing old data...');
    await User.deleteMany({});
    await Zone.deleteMany({});
    await Parcel.deleteMany({});

    // 2. Create Delivery Zones
    console.log('📍 Creating delivery zones...');
    const zones = await Zone.create([
      {
        zoneName: 'Metro North (Delhi-NCR)',
        pincodes: ['110001', '110002', '110003', '110020', '122001', '201301'],
        baseFee: 60,
        perKgRate: 25
      },
      {
        zoneName: 'Western Commercial (Mumbai-Pune)',
        pincodes: ['400001', '400002', '400050', '411001', '411004'],
        baseFee: 70,
        perKgRate: 30
      },
      {
        zoneName: 'Southern Tech Corridor (Bengaluru)',
        pincodes: ['560001', '560034', '560100', '560102'],
        baseFee: 65,
        perKgRate: 28
      }
    ]);

    // 3. Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const agentPassword = await bcrypt.hash('agent123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    // 4. Create Users (Admin, Agents, Customers)
    console.log('👥 Creating users (Admin, Agents, Customers)...');

    // Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@courier.com',
      password: adminPassword,
      phone: '+91 98765 00001',
      role: 'admin',
      isActive: true
    });

    // Agents
    const agent1 = await User.create({
      name: 'Rajesh Sharma',
      email: 'rajesh@courier.com',
      password: agentPassword,
      phone: '+91 98765 11111',
      role: 'agent',
      zone: zones[0]._id,
      isActive: true
    });

    const agent2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@courier.com',
      password: agentPassword,
      phone: '+91 98765 22222',
      role: 'agent',
      zone: zones[1]._id,
      isActive: true
    });

    const agent3 = await User.create({
      name: 'Arun Kumar',
      email: 'arun@courier.com',
      password: agentPassword,
      phone: '+91 98765 33333',
      role: 'agent',
      zone: zones[2]._id,
      isActive: true
    });

    // Customers
    const customer1 = await User.create({
      name: 'Amit Verma',
      email: 'customer@courier.com',
      password: customerPassword,
      phone: '+91 98111 44444',
      role: 'customer',
      isActive: true
    });

    const customer2 = await User.create({
      name: 'Sneha Gupta',
      email: 'sneha@example.com',
      password: customerPassword,
      phone: '+91 98222 55555',
      role: 'customer',
      isActive: true
    });

    // 5. Create Sample Parcels with rich status histories
    console.log('📦 Creating sample parcels with status histories...');

    const sampleParcels = [
      {
        trackingId: 'PKG-20260920-A101',
        customer: customer1._id,
        senderName: 'Amit Verma',
        senderPhone: '+91 98111 44444',
        senderAddress: 'Flat 402, Green Glen Layout, Bellandur',
        senderPincode: '560102',
        receiverName: 'Rohan Joshi',
        receiverPhone: '+91 98999 12345',
        receiverAddress: '14 Barakhamba Road, Connaught Place',
        receiverPincode: '110001',
        weight: 1.5,
        parcelType: 'Document',
        description: 'Urgent legal contracts and agreement copies',
        currentStatus: 'In Transit',
        assignedAgent: agent1._id,
        deliveryCharge: 60 + 1.5 * 25, // Metro North zone calculation
        bookedAt: new Date(Date.now() - 48 * 3600 * 1000),
        statusHistory: [
          {
            status: 'Booked',
            timestamp: new Date(Date.now() - 48 * 3600 * 1000),
            updatedBy: customer1._id,
            remarks: 'Parcel booked online by Amit Verma.'
          },
          {
            status: 'Picked Up',
            timestamp: new Date(Date.now() - 36 * 3600 * 1000),
            updatedBy: agent1._id,
            remarks: 'Package collected from sender premises.'
          },
          {
            status: 'In Transit',
            timestamp: new Date(Date.now() - 20 * 3600 * 1000),
            updatedBy: agent1._id,
            remarks: 'Departed central logistics hub via express dispatch.'
          }
        ]
      },
      {
        trackingId: 'PKG-20260920-B202',
        customer: customer1._id,
        senderName: 'Amit Verma',
        senderPhone: '+91 98111 44444',
        senderAddress: '42 MG Road',
        senderPincode: '560001',
        receiverName: 'Karan Mehta',
        receiverPhone: '+91 97777 88888',
        receiverAddress: '78 Marine Drive, Nariman Point',
        receiverPincode: '400001',
        weight: 3.0,
        parcelType: 'Small Box',
        description: 'Electronic gadget sample',
        currentStatus: 'Delivered',
        assignedAgent: agent2._id,
        deliveryCharge: 70 + 3.0 * 30, // Western Commercial zone
        bookedAt: new Date(Date.now() - 72 * 3600 * 1000),
        deliveredAt: new Date(Date.now() - 6 * 3600 * 1000),
        statusHistory: [
          {
            status: 'Booked',
            timestamp: new Date(Date.now() - 72 * 3600 * 1000),
            updatedBy: customer1._id,
            remarks: 'Booked online.'
          },
          {
            status: 'Picked Up',
            timestamp: new Date(Date.now() - 60 * 3600 * 1000),
            updatedBy: agent2._id,
            remarks: 'Received at Mumbai sorting facility.'
          },
          {
            status: 'In Transit',
            timestamp: new Date(Date.now() - 30 * 3600 * 1000),
            updatedBy: agent2._id,
            remarks: 'Dispatched to South Mumbai branch.'
          },
          {
            status: 'Out for Delivery',
            timestamp: new Date(Date.now() - 10 * 3600 * 1000),
            updatedBy: agent2._id,
            remarks: 'Agent out for delivery with parcel.'
          },
          {
            status: 'Delivered',
            timestamp: new Date(Date.now() - 6 * 3600 * 1000),
            updatedBy: agent2._id,
            remarks: 'Successfully delivered to receiver. Signed by Karan Mehta.'
          }
        ]
      },
      {
        trackingId: 'PKG-20260921-C303',
        customer: customer2._id,
        senderName: 'Sneha Gupta',
        senderPhone: '+91 98222 55555',
        senderAddress: 'Villa 12, Palm Meadows, Whitefield',
        senderPincode: '560066',
        receiverName: 'Ananya Roy',
        receiverPhone: '+91 91234 56789',
        receiverAddress: '55 Koramangala 4th Block',
        receiverPincode: '560034',
        weight: 5.2,
        parcelType: 'Fragile',
        description: 'Handcrafted ceramic dinner set - handle with care',
        currentStatus: 'Out for Delivery',
        assignedAgent: agent3._id,
        deliveryCharge: 65 + 5.2 * 28,
        bookedAt: new Date(Date.now() - 18 * 3600 * 1000),
        statusHistory: [
          {
            status: 'Booked',
            timestamp: new Date(Date.now() - 18 * 3600 * 1000),
            updatedBy: customer2._id,
            remarks: 'Customer requested fragile item handling.'
          },
          {
            status: 'Picked Up',
            timestamp: new Date(Date.now() - 12 * 3600 * 1000),
            updatedBy: agent3._id,
            remarks: 'Item secured in bubble-wrap crate and picked up.'
          },
          {
            status: 'In Transit',
            timestamp: new Date(Date.now() - 6 * 3600 * 1000),
            updatedBy: agent3._id,
            remarks: 'Transferred to Bengaluru Koramangala hub.'
          },
          {
            status: 'Out for Delivery',
            timestamp: new Date(Date.now() - 2 * 3600 * 1000),
            updatedBy: agent3._id,
            remarks: 'Agent on the way to delivery address.'
          }
        ]
      },
      {
        trackingId: 'PKG-20260921-D404',
        customer: customer2._id,
        senderName: 'Sneha Gupta',
        senderPhone: '+91 98222 55555',
        senderAddress: 'Villa 12, Palm Meadows, Whitefield',
        senderPincode: '560066',
        receiverName: 'Vikram Singh',
        receiverPhone: '+91 99887 76655',
        receiverAddress: '88 Malviya Nagar',
        receiverPincode: '110017',
        weight: 2.0,
        parcelType: 'Medium Box',
        description: 'Festival gift hamper',
        currentStatus: 'Booked',
        assignedAgent: null, // Unassigned for Admin testing
        deliveryCharge: 100 + 2.0 * 30, // Default rate
        bookedAt: new Date(Date.now() - 3 * 3600 * 1000),
        statusHistory: [
          {
            status: 'Booked',
            timestamp: new Date(Date.now() - 3 * 3600 * 1000),
            updatedBy: customer2._id,
            remarks: 'Parcel booked online. Awaiting assignment.'
          }
        ]
      },
      {
        trackingId: 'PKG-20260921-E505',
        customer: customer1._id,
        senderName: 'Amit Verma',
        senderPhone: '+91 98111 44444',
        senderAddress: '42 MG Road',
        senderPincode: '560001',
        receiverName: 'Manish Tiwari',
        receiverPhone: '+91 98711 22334',
        receiverAddress: 'Shop 15, Sadar Bazar',
        receiverPincode: '110006',
        weight: 0.8,
        parcelType: 'Document',
        description: 'Academic transcripts',
        currentStatus: 'Failed',
        assignedAgent: agent1._id,
        deliveryCharge: 60 + 0.8 * 25,
        bookedAt: new Date(Date.now() - 24 * 3600 * 1000),
        statusHistory: [
          {
            status: 'Booked',
            timestamp: new Date(Date.now() - 24 * 3600 * 1000),
            updatedBy: customer1._id,
            remarks: 'Booked transcripts parcel.'
          },
          {
            status: 'Picked Up',
            timestamp: new Date(Date.now() - 18 * 3600 * 1000),
            updatedBy: agent1._id,
            remarks: 'Picked up from sender.'
          },
          {
            status: 'In Transit',
            timestamp: new Date(Date.now() - 10 * 3600 * 1000),
            updatedBy: agent1._id,
            remarks: 'Arrived at delivery hub.'
          },
          {
            status: 'Out for Delivery',
            timestamp: new Date(Date.now() - 4 * 3600 * 1000),
            updatedBy: agent1._id,
            remarks: 'Out for delivery.'
          },
          {
            status: 'Failed',
            timestamp: new Date(Date.now() - 1 * 3600 * 1000),
            updatedBy: agent1._id,
            remarks: 'Customer unavailable at location after multiple phone attempts.'
          }
        ]
      }
    ];

    await Parcel.create(sampleParcels);

    console.log('\n=============================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=============================================================');
    console.log('\n🔑 DEFAULT LOGIN CREDENTIALS:\n');
    console.log('┌──────────┬────────────────────────┬─────────────┐');
    console.log('│ Role     │ Email                  │ Password    │');
    console.log('├──────────┼────────────────────────┼─────────────┤');
    console.log('│ Admin    │ admin@courier.com      │ admin123    │');
    console.log('│ Agent    │ rajesh@courier.com     │ agent123    │');
    console.log('│ Agent    │ priya@courier.com      │ agent123    │');
    console.log('│ Agent    │ arun@courier.com       │ agent123    │');
    console.log('│ Customer │ customer@courier.com   │ customer123 │');
    console.log('│ Customer │ sneha@example.com      │ customer123 │');
    console.log('└──────────┴────────────────────────┴─────────────┘');
    console.log('\n📦 SAMPLE TRACKING CODES TO TEST:');
    console.log('  1. PKG-20260920-A101 (In Transit)');
    console.log('  2. PKG-20260920-B202 (Delivered)');
    console.log('  3. PKG-20260921-C303 (Out for Delivery)');
    console.log('  4. PKG-20260921-D404 (Booked - Unassigned)');
    console.log('  5. PKG-20260921-E505 (Failed)');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
}

seedDatabase();
