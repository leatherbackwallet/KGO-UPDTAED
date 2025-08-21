const mongoose = require('mongoose');

// Connect to MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline';

async function checkOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get the Order model
    const { Order } = require('./models/orders.model');
    
    // Check total count
    const totalOrders = await Order.countDocuments({ isDeleted: false });
    console.log(`📊 Total orders in database: ${totalOrders}`);
    
    if (totalOrders > 0) {
      // Get all orders with populated fields
      const orders = await Order.find({ isDeleted: false })
        .populate('userId', 'firstName lastName email phone')
        .populate({
          path: 'orderItems.productId',
          select: 'name price images description categories',
          populate: {
            path: 'categories',
            select: 'name'
          }
        })
        .sort({ createdAt: -1 })
        .limit(5);
      
      console.log('\n📋 Sample orders:');
      orders.forEach((order, index) => {
        console.log(`\n--- Order ${index + 1} ---`);
        console.log(`Order ID: ${order.orderId}`);
        console.log(`Status: ${order.orderStatus}`);
        console.log(`Total Price: ₹${order.totalPrice}`);
        console.log(`Customer: ${order.shippingDetails.recipientName}`);
        console.log(`Phone: ${order.shippingDetails.recipientPhone}`);
        console.log(`Items: ${order.orderItems.length}`);
        console.log(`Created: ${order.createdAt}`);
      });
    } else {
      console.log('❌ No orders found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkOrders();
