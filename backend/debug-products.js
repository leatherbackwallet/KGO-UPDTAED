const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
});

async function debugProducts() {
  try {
    console.log('🔍 Debugging Products Route...');
    
    // Wait for connection to be established
    await mongoose.connection.asPromise();
    console.log('✅ Connected to MongoDB');
    
    // Get all products directly from the database
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    
    console.log(`📊 Total products in database: ${products.length}`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (ID: ${product._id})`);
      console.log(`   - Featured: ${product.isFeatured}`);
      console.log(`   - Deleted: ${product.isDeleted}`);
      console.log(`   - Price: ${product.price}`);
      console.log(`   - Stock: ${product.stock}`);
      console.log('');
    });
    
    // Check for featured products
    const featuredProducts = products.filter(p => p.isFeatured === true);
    console.log(`📊 Featured products: ${featuredProducts.length}`);
    
    // Check for non-featured products
    const nonFeaturedProducts = products.filter(p => p.isFeatured === false);
    console.log(`📊 Non-featured products: ${nonFeaturedProducts.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

debugProducts();
