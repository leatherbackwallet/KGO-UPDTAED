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

async function testProductsAPI() {
  try {
    console.log('🔍 Testing Products API Directly...');
    
    // Wait for connection to be established
    await mongoose.connection.asPromise();
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Get all products with no filter
    console.log('\n📊 Test 1: All products (no filter)');
    const allProducts = await Product.find({});
    console.log(`Total products: ${allProducts.length}`);
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (Featured: ${product.isFeatured})`);
    });
    
    // Test 2: Get featured products only
    console.log('\n📊 Test 2: Featured products only');
    const featuredProducts = await Product.find({ isFeatured: true });
    console.log(`Featured products: ${featuredProducts.length}`);
    featuredProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
    });
    
    // Test 3: Get non-featured products only
    console.log('\n📊 Test 3: Non-featured products only');
    const nonFeaturedProducts = await Product.find({ isFeatured: false });
    console.log(`Non-featured products: ${nonFeaturedProducts.length}`);
    nonFeaturedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
    });
    
    // Test 4: Simulate the API query with sorting
    console.log('\n📊 Test 4: API query with sorting');
    const apiQueryProducts = await Product.find({})
      .populate('categories', 'name slug')
      .populate('vendors', 'storeName')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(100);
    console.log(`API query products: ${apiQueryProducts.length}`);
    apiQueryProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (Featured: ${product.isFeatured})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testProductsAPI();
