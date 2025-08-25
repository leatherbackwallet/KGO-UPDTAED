/**
 * Fix All Product Images Script
 * Links all products to the actual working Cloudinary images
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Product } from '../models/products.model';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixAllProductImages() {
  try {
    console.log('🔧 Fixing all product images...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get all products
    const products = await Product.find({});
    console.log(`📊 Found ${products.length} products`);
    
    // Available working Cloudinary images
    const workingImages = [
      'keralagiftsonline/products/product-1756023789547-930946815', // Most recent
      'keralagiftsonline/products/product-1756023765540-566483315'  // Second most recent
    ];
    
    let imageIndex = 0;
    
    for (const product of products) {
      console.log(`\n🔧 Processing: ${product.name}`);
      console.log(`   Current images: ${JSON.stringify(product.images)}`);
      
      // Assign a working image
      const workingImage = workingImages[imageIndex % workingImages.length];
      
      // Update the product
      const updatedProduct = await Product.findByIdAndUpdate(
        product._id,
        {
          images: [workingImage],
          defaultImage: workingImage
        },
        { new: true }
      );
      
      if (updatedProduct) {
        console.log(`   ✅ Updated with: ${workingImage}`);
        imageIndex++;
      } else {
        console.log(`   ❌ Failed to update`);
      }
    }
    
    console.log('\n🎉 All product images updated!');
    
  } catch (error) {
    console.error('❌ Error fixing product images:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
if (require.main === module) {
  fixAllProductImages();
}
