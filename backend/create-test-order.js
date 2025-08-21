const mongoose = require('mongoose');

// Connect to MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline';

async function createTestOrder() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get the Order and Product models
    const { Order } = require('./models/orders.model');
    const { Product } = require('./models/products.model');
    
    // Get a product to use in the order
    const product = await Product.findOne();
    if (!product) {
      console.log('❌ No products found. Please create products first.');
      return;
    }
    
    console.log('📦 Using product:', product.name);
    
    // Create a test order
    const testOrder = new Order({
      userId: new mongoose.Types.ObjectId(), // Create a dummy user ID
      requestedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      shippingDetails: {
        recipientName: 'Test Customer',
        recipientPhone: '+49123456789',
        address: {
          streetName: 'Test Street',
          houseNumber: '123',
          postalCode: '12345',
          city: 'Test City',
          countryCode: 'DE'
        },
        specialInstructions: 'Test order for admin dashboard'
      },
      orderItems: [{
        productId: product._id,
        quantity: 2,
        price: product.price
      }],
      totalPrice: product.price * 2,
      orderStatus: 'payment_done',
      statusHistory: [{
        status: 'payment_done',
        timestamp: new Date(),
        notes: 'Test order created'
      }]
    });
    
    await testOrder.save();
    console.log('✅ Test order created successfully!');
    console.log('Order ID:', testOrder.orderId);
    console.log('Total Price:', testOrder.totalPrice);
    console.log('Status:', testOrder.orderStatus);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestOrder();
