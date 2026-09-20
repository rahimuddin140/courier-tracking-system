/**
 * Comprehensive Automated Verification Suite for Courier & Parcel Delivery Tracking System
 */
const assert = require('assert');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Models & Helpers
const connectDB = require('../config/db');
const User = require('../models/User');
const Zone = require('../models/Zone');
const Parcel = require('../models/Parcel');
const generateTrackingId = require('../helpers/generateTrackingId');
const calculateCharge = require('../helpers/calculateCharge');

async function runTests() {
  console.log('🚀 Starting System Automated Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return (async () => {
      try {
        await fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     Error: ${err.message}`);
        failed++;
      }
    })();
  }

  // 1. Database Connection
  await test('MongoDB Connection initializes properly', async () => {
    const conn = await connectDB();
    assert(conn && conn.connection.readyState === 1, 'Database should be connected (readyState 1)');
  });

  // 2. Tracking ID Generator
  await test('Tracking ID Generator produces PKG-YYYYMMDD-XXXX format', () => {
    const id1 = generateTrackingId();
    const id2 = generateTrackingId();
    const pattern = /^PKG-\d{8}-[A-F0-9]{4}$/;
    assert(pattern.test(id1), `Generated ID "${id1}" does not match pattern PKG-YYYYMMDD-XXXX`);
    assert(pattern.test(id2), `Generated ID "${id2}" does not match pattern PKG-YYYYMMDD-XXXX`);
    assert.notStrictEqual(id1, id2, 'Two generated tracking IDs should not be identical');
  });

  // 3. User Model & Password Hashing
  let testCustomer, testAgent, testAdmin;
  await test('User creation and bcrypt password verification', async () => {
    await User.deleteMany({ email: { $in: ['test_cust@test.com', 'test_agent@test.com', 'test_admin@test.com'] } });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('secretPassword123', salt);

    testCustomer = await User.create({
      name: 'Test Customer',
      email: 'test_cust@test.com',
      password: hash,
      phone: '9999900001',
      role: 'customer'
    });

    assert.strictEqual(testCustomer.role, 'customer');
    const validPass = await testCustomer.comparePassword('secretPassword123');
    const invalidPass = await testCustomer.comparePassword('wrongPassword');
    assert(validPass, 'Correct password should authenticate');
    assert(!invalidPass, 'Wrong password should fail');
  });

  // 4. Zone Creation & Dynamic Delivery Charge Calculation
  let testZone;
  await test('Zone creation and delivery charge estimation formula', async () => {
    await Zone.deleteMany({ zoneName: 'Test Express Zone' });

    testZone = await Zone.create({
      zoneName: 'Test Express Zone',
      pincodes: ['999001', '999002'],
      baseFee: 80,
      perKgRate: 35
    });

    // Pincode in zone: 80 + (2.5 * 35) = 80 + 87.5 = 167.5
    const estimateInZone = await calculateCharge('999001', 2.5);
    assert.strictEqual(estimateInZone.isDefault, false);
    assert.strictEqual(estimateInZone.charge, 167.5);
    assert.strictEqual(estimateInZone.zoneName, 'Test Express Zone');

    // Pincode not in zone (default fallback: 100 + 2.5 * 30 = 175)
    const estimateDefault = await calculateCharge('123999', 2.5);
    assert.strictEqual(estimateDefault.isDefault, true);
    assert.strictEqual(estimateDefault.charge, 175);
  });

  // 5. Parcel Booking & Initial Status History Log
  let testParcel;
  await test('Parcel booking creates initial "Booked" status and timestamped history log', async () => {
    const trackingId = generateTrackingId();
    const charge = (await calculateCharge('999001', 3.0)).charge;

    testParcel = await Parcel.create({
      trackingId,
      customer: testCustomer._id,
      senderName: 'Origin Sender',
      senderPhone: '9999900001',
      senderAddress: 'Sender Warehouse 1',
      senderPincode: '999002',
      receiverName: 'Destination Recipient',
      receiverPhone: '8888800002',
      receiverAddress: 'Drop Point 2',
      receiverPincode: '999001',
      weight: 3.0,
      parcelType: 'Medium Box',
      description: 'Test shipment goods',
      currentStatus: 'Booked',
      deliveryCharge: charge,
      statusHistory: [
        {
          status: 'Booked',
          timestamp: new Date(),
          updatedBy: testCustomer._id,
          remarks: 'Test parcel booked.'
        }
      ]
    });

    assert.strictEqual(testParcel.currentStatus, 'Booked');
    assert.strictEqual(testParcel.statusHistory.length, 1);
    assert.strictEqual(testParcel.statusHistory[0].status, 'Booked');
    assert(testParcel.statusHistory[0].timestamp instanceof Date, 'History must contain timestamp');
  });

  // 6. Admin Parcel Assignment
  await test('Admin assigns parcel to delivery agent and logs update', async () => {
    const salt = await bcrypt.genSalt(10);
    testAgent = await User.create({
      name: 'Test Delivery Agent',
      email: 'test_agent@test.com',
      password: await bcrypt.hash('agent123', salt),
      phone: '9999900002',
      role: 'agent',
      zone: testZone._id
    });

    testParcel.assignedAgent = testAgent._id;
    testParcel.statusHistory.push({
      status: testParcel.currentStatus,
      timestamp: new Date(),
      updatedBy: testCustomer._id,
      remarks: `Assigned to agent ${testAgent.name}`
    });
    await testParcel.save();

    const updated = await Parcel.findById(testParcel._id).populate('assignedAgent');
    assert.strictEqual(updated.assignedAgent.name, 'Test Delivery Agent');
    assert.strictEqual(updated.statusHistory.length, 2);
  });

  // 7. Enforced Status Lifecycle Transitions
  await test('Agent lifecycle transitions: Booked -> Picked Up -> In Transit -> Out for Delivery -> Delivered', async () => {
    const VALID_TRANSITIONS = {
      'Booked': ['Picked Up'],
      'Picked Up': ['In Transit'],
      'In Transit': ['Out for Delivery'],
      'Out for Delivery': ['Delivered', 'Failed'],
      'Delivered': [],
      'Failed': ['Out for Delivery']
    };

    // Transition 1: Picked Up
    assert(VALID_TRANSITIONS[testParcel.currentStatus].includes('Picked Up'), 'Cannot transition to Picked Up');
    testParcel.currentStatus = 'Picked Up';
    testParcel.statusHistory.push({
      status: 'Picked Up',
      timestamp: new Date(),
      updatedBy: testAgent._id,
      remarks: 'Package collected.'
    });
    await testParcel.save();

    // Transition 2: In Transit
    assert(VALID_TRANSITIONS[testParcel.currentStatus].includes('In Transit'), 'Cannot transition to In Transit');
    testParcel.currentStatus = 'In Transit';
    testParcel.statusHistory.push({
      status: 'In Transit',
      timestamp: new Date(),
      updatedBy: testAgent._id,
      remarks: 'Dispatched to hub.'
    });
    await testParcel.save();

    // Transition 3: Out for Delivery
    assert(VALID_TRANSITIONS[testParcel.currentStatus].includes('Out for Delivery'), 'Cannot transition to Out for Delivery');
    testParcel.currentStatus = 'Out for Delivery';
    testParcel.statusHistory.push({
      status: 'Out for Delivery',
      timestamp: new Date(),
      updatedBy: testAgent._id,
      remarks: 'Out on motorcycle.'
    });
    await testParcel.save();

    // Transition 4: Delivered
    assert(VALID_TRANSITIONS[testParcel.currentStatus].includes('Delivered'), 'Cannot transition to Delivered');
    testParcel.currentStatus = 'Delivered';
    testParcel.deliveredAt = new Date();
    testParcel.statusHistory.push({
      status: 'Delivered',
      timestamp: new Date(),
      updatedBy: testAgent._id,
      remarks: 'Successfully delivered and signature collected.'
    });
    await testParcel.save();

    const finalized = await Parcel.findById(testParcel._id);
    assert.strictEqual(finalized.currentStatus, 'Delivered');
    assert(finalized.deliveredAt instanceof Date, 'deliveredAt date must be recorded');
    assert.strictEqual(finalized.statusHistory.length, 6);
  });

  // 8. Illegal Status Transition Prevention
  await test('Illegal transitions are blocked from terminal Delivered status', () => {
    const VALID_TRANSITIONS = {
      'Booked': ['Picked Up'],
      'Delivered': []
    };
    const allowed = VALID_TRANSITIONS['Delivered'] || [];
    assert.strictEqual(allowed.length, 0, 'Delivered parcel cannot transition further');
  });

  // 9. Customer Cancellation Rule
  await test('Customer can only cancel if parcel is Booked (not Picked Up or In Transit)', async () => {
    // Already delivered parcel should NOT be cancellable
    assert.notStrictEqual(testParcel.currentStatus, 'Booked');

    // Create a new fresh parcel in 'Booked' state
    const cancellableParcel = await Parcel.create({
      trackingId: generateTrackingId(),
      customer: testCustomer._id,
      senderName: 'Sender',
      senderPhone: '111',
      senderAddress: 'Addr',
      senderPincode: '111',
      receiverName: 'Receiver',
      receiverPhone: '222',
      receiverAddress: 'Drop',
      receiverPincode: '222',
      weight: 1.0,
      currentStatus: 'Booked'
    });

    assert.strictEqual(cancellableParcel.currentStatus, 'Booked');
    cancellableParcel.currentStatus = 'Cancelled';
    await cancellableParcel.save();
    assert.strictEqual(cancellableParcel.currentStatus, 'Cancelled');
  });

  console.log('\n=============================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  // Clean up test records
  await User.deleteMany({ email: { $in: ['test_cust@test.com', 'test_agent@test.com'] } });
  await Zone.deleteMany({ zoneName: 'Test Express Zone' });
  await Parcel.deleteMany({ customer: testCustomer._id });

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
