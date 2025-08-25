/**
 * Fix test2CAKE Image Script
 * Links the newly uploaded Cloudinary image to the test2CAKE product
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Product } from '../models/products.model';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixTestcake2Image() {
  try {
    console.log('🔧 Fixing test2CAKE image...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find the test2CAKE product
    const testcake2 = await Product.findOne({ name: 'test2CAKE' });
    
    if (!testcake2) {
      console.log('❌ test2CAKE product not found');
      return;
    }
    
    console.log(`✅ Found test2CAKE product: ${testcake2._id}`);
    console.log(`Current images: ${JSON.stringify(testcake2.images)}`);
    console.log(`Current defaultImage: ${testcake2.defaultImage}`);
    
    // The newly uploaded image (from the recent upload)
    const cloudinaryImageId = 'keralagiftsonline/products/product-1756024186118-30010235';
    
    // Update the product with the image
    const updatedProduct = await Product.findByIdAndUpdate(
      testcake2._id,
      {
        images: [cloudinaryImageId],
        defaultImage: cloudinaryImageId
      },
      { new: true }
    );
    
    if (updatedProduct) {
      console.log('✅ test2CAKE image updated successfully!');
      console.log(`New images: ${JSON.stringify(updatedProduct.images)}`);
      console.log(`New defaultImage: ${updatedProduct.defaultImage}`);
      
      // Test the Cloudinary URL
      const cloudinaryUrl = `https://res.cloudinary.com/deojqbepy/image/upload/${cloudinaryImageId}`;
      console.log(`Cloudinary URL: ${cloudinaryUrl}`);
    } else {
      console.log('❌ Failed to update test2CAKE product');
    }
    
  } catch (error) {
    console.error('❌ Error fixing test2CAKE image:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
if (require.main === module) {
  fixTestcake2Image();
}
