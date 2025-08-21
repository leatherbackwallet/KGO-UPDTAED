/**
 * Database Cleanup Script - Remove Orphaned Records
 * Cleans up orphaned records that reference non-existent products
 */

const mongoose = require('mongoose');
const { Product } = require('../models/products.model');
const { ProductAttribute } = require('../models/productAttributes.model');
const { VendorProduct } = require('../models/vendorProducts.model');
const { Review } = require('../models/reviews.model');
const { Wishlist } = require('../models/wishlists.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onyourbehalf', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function cleanupOrphanedRecords() {
  try {
    console.log('🧹 Starting database cleanup...\n');
    
    // Get all existing product IDs
    const existingProductIds = await Product.find({}, '_id');
    const productIdSet = new Set(existingProductIds.map(p => p._id.toString()));
    
    console.log(`📊 Found ${existingProductIds.length} existing products`);
    
    // Cleanup orphaned product attributes
    console.log('\n🔍 Checking for orphaned product attributes...');
    const orphanedAttributes = await ProductAttribute.find({
      productId: { $nin: existingProductIds.map(p => p._id) }
    });
    
    if (orphanedAttributes.length > 0) {
      console.log(`🗑️ Found ${orphanedAttributes.length} orphaned product attributes`);
      await ProductAttribute.deleteMany({
        productId: { $nin: existingProductIds.map(p => p._id) }
      });
      console.log('✅ Cleaned up orphaned product attributes');
    } else {
      console.log('✅ No orphaned product attributes found');
    }
    
    // Cleanup orphaned vendor products
    console.log('\n🔍 Checking for orphaned vendor products...');
    const orphanedVendorProducts = await VendorProduct.find({
      productId: { $nin: existingProductIds.map(p => p._id) }
    });
    
    if (orphanedVendorProducts.length > 0) {
      console.log(`🗑️ Found ${orphanedVendorProducts.length} orphaned vendor products`);
      await VendorProduct.deleteMany({
        productId: { $nin: existingProductIds.map(p => p._id) }
      });
      console.log('✅ Cleaned up orphaned vendor products');
    } else {
      console.log('✅ No orphaned vendor products found');
    }
    
    // Cleanup orphaned reviews
    console.log('\n🔍 Checking for orphaned reviews...');
    const orphanedReviews = await Review.find({
      productId: { $nin: existingProductIds.map(p => p._id) }
    });
    
    if (orphanedReviews.length > 0) {
      console.log(`🗑️ Found ${orphanedReviews.length} orphaned reviews`);
      await Review.deleteMany({
        productId: { $nin: existingProductIds.map(p => p._id) }
      });
      console.log('✅ Cleaned up orphaned reviews');
    } else {
      console.log('✅ No orphaned reviews found');
    }
    
    // Cleanup orphaned wishlist items
    console.log('\n🔍 Checking for orphaned wishlist items...');
    const wishlists = await Wishlist.find({});
    let updatedWishlists = 0;
    
    for (const wishlist of wishlists) {
      const originalLength = wishlist.products.length;
      wishlist.products = wishlist.products.filter(productId => 
        productIdSet.has(productId.toString())
      );
      
      if (wishlist.products.length !== originalLength) {
        await wishlist.save();
        updatedWishlists++;
      }
    }
    
    if (updatedWishlists > 0) {
      console.log(`🔄 Updated ${updatedWishlists} wishlists to remove orphaned products`);
    } else {
      console.log('✅ No orphaned wishlist items found');
    }
    
    console.log('\n🎉 Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
cleanupOrphanedRecords();
