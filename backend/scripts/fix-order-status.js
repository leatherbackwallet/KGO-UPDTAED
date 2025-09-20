/**
 * Database Migration Script: Fix Order Status Inconsistencies
 * 
 * This script fixes the critical issue where orders have:
 * - orderStatus: 'payment_done' but paymentStatus: 'pending'
 * 
 * The correct flow should be:
 * 1. Order created → orderStatus: 'pending', paymentStatus: 'pending'
 * 2. Payment verified → orderStatus: 'payment_done', paymentStatus: 'captured'
 */

const mongoose = require('mongoose');

// Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline';

async function fixOrderStatusInconsistencies() {
  try {
    console.log('🔍 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Get the Order model
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));

    console.log('🔍 Finding orders with status inconsistencies...');
    
    // Find orders where orderStatus is 'payment_done' but paymentStatus is 'pending' or undefined
    const inconsistentOrders = await Order.find({
      orderStatus: 'payment_done',
      $or: [
        { paymentStatus: 'pending' },
        { paymentStatus: { $exists: false } },
        { paymentStatus: null }
      ]
    });

    console.log(`📊 Found ${inconsistentOrders.length} orders with status inconsistencies`);

    if (inconsistentOrders.length === 0) {
      console.log('✅ No inconsistent orders found. Database is clean!');
      return;
    }

    console.log('🔧 Fixing order status inconsistencies...');

    let fixedCount = 0;
    let skippedCount = 0;

    for (const order of inconsistentOrders) {
      console.log(`\n📋 Processing Order: ${order.orderId || order._id}`);
      console.log(`   Current orderStatus: ${order.orderStatus}`);
      console.log(`   Current paymentStatus: ${order.paymentStatus || 'undefined'}`);
      console.log(`   Razorpay Order ID: ${order.razorpayOrderId || 'none'}`);
      console.log(`   Razorpay Payment ID: ${order.razorpayPaymentId || 'none'}`);

      // Check if this order has actually been paid
      const hasRazorpayPaymentId = order.razorpayPaymentId && order.razorpayPaymentId.trim() !== '';
      const hasPaymentDate = order.paymentDate;
      const hasPaymentDetails = order.razorpayPaymentDetails;

      if (hasRazorpayPaymentId || hasPaymentDate || hasPaymentDetails) {
        // This order has been paid, so payment_done is correct
        // Just need to set paymentStatus to captured
        await Order.updateOne(
          { _id: order._id },
          { 
            $set: { 
              paymentStatus: 'captured',
              paymentVerifiedAt: order.paymentDate || new Date()
            }
          }
        );
        console.log(`   ✅ Fixed: Set paymentStatus to 'captured'`);
        fixedCount++;
      } else {
        // This order hasn't been paid, so it should be pending
        await Order.updateOne(
          { _id: order._id },
          { 
            $set: { 
              orderStatus: 'pending',
              paymentStatus: 'pending'
            }
          }
        );
        console.log(`   ✅ Fixed: Set orderStatus to 'pending' and paymentStatus to 'pending'`);
        fixedCount++;
      }
    }

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`   Fixed: ${fixedCount} orders`);
    console.log(`   Skipped: ${skippedCount} orders`);

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const remainingInconsistent = await Order.find({
      orderStatus: 'payment_done',
      $or: [
        { paymentStatus: 'pending' },
        { paymentStatus: { $exists: false } },
        { paymentStatus: null }
      ]
    });

    if (remainingInconsistent.length === 0) {
      console.log('✅ All order status inconsistencies have been fixed!');
    } else {
      console.log(`⚠️  Warning: ${remainingInconsistent.length} orders still have inconsistencies`);
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}

// Run the migration
if (require.main === module) {
  fixOrderStatusInconsistencies()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixOrderStatusInconsistencies };
