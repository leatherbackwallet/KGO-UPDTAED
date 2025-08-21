const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
});

// Import the Product model
const { Product } = require('./models/products.model.ts');

async function checkProducts() {
  try {
    console.log('🔍 Checking Products Database...');
    
    // Wait for connection to be established
    await mongoose.connection.asPromise();
    console.log('✅ Connected to MongoDB');
    
    // Get all products (no filters)
    const allProducts = await Product.find({});
    console.log(`📊 Total products in database: ${allProducts.length}`);
    
    if (allProducts.length > 0) {
      console.log('\n📋 Products found:');
      allProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (ID: ${product._id})`);
        console.log(`   - Price: ${product.price}`);
        console.log(`   - Stock: ${product.stock}`);
        console.log(`   - Is Deleted: ${product.isDeleted}`);
        console.log(`   - Is Featured: ${product.isFeatured}`);
        console.log('');
      });
    }
    
    // Check for deleted products
    const deletedProducts = await Product.find({ isDeleted: true });
    console.log(`🗑️ Deleted products: ${deletedProducts.length}`);
    
    if (deletedProducts.length > 0) {
      console.log('\n🗑️ Deleted products:');
      deletedProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (ID: ${product._id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkProducts();
