const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
});

async function checkCollections() {
  try {
    console.log('🔍 Checking Database Collections...');
    
    // Wait for connection to be established
    await mongoose.connection.asPromise();
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Total collections in database: ${collections.length}`);
    
    // List all collection names
    console.log('\n📋 Collections found:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    // Check products collection specifically
    console.log('\n📦 Checking products collection...');
    const productsCollection = await mongoose.connection.db.collection('products');
    const productCount = await productsCollection.countDocuments();
    console.log(`📊 Products in collection: ${productCount}`);
    
    if (productCount > 0) {
      const products = await productsCollection.find({}).limit(5).toArray();
      console.log('\n📋 Sample products:');
      products.forEach((product, index) => {
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

checkCollections();
