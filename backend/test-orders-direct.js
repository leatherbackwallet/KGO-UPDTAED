const mongoose = require('mongoose');

// Connect to MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline';

async function testOrdersDirect() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get the Order model
    const { Order } = require('./models/orders.model');
    
    // Get all orders with populated fields (same as the API route)
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
      .sort({ createdAt: -1 });
    
    console.log(`📊 Found ${orders.length} orders`);
    
    if (orders.length > 0) {
      console.log('\n📋 First order structure:');
      const firstOrder = orders[0];
      console.log(JSON.stringify(firstOrder, null, 2));
      
      console.log('\n🔍 Key fields check:');
      console.log('orderId:', firstOrder.orderId);
      console.log('orderStatus:', firstOrder.orderStatus);
      console.log('totalPrice:', firstOrder.totalPrice);
      console.log('shippingDetails:', firstOrder.shippingDetails);
      console.log('orderItems count:', firstOrder.orderItems.length);
      console.log('userId populated:', !!firstOrder.userId);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testOrdersDirect();
