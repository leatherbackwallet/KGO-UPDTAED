/**
 * Fix TEST Cake Image Script
 * Links the existing Cloudinary image to the TEST Cake product
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Product } from '../models/products.model';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixTestCakeImage() {
  try {
    console.log('🔧 Fixing TEST Cake image...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find the TEST Cake product
    const testCake = await Product.findOne({ name: 'TEST Cake' });
    
    if (!testCake) {
      console.log('❌ TEST Cake product not found');
      return;
    }
    
    console.log(`✅ Found TEST Cake product: ${testCake._id}`);
    console.log(`Current images: ${JSON.stringify(testCake.images)}`);
    console.log(`Current defaultImage: ${testCake.defaultImage}`);
    
    // Use the most recent image upload (likely the TEST Cake image)
    const cloudinaryImageId = 'keralagiftsonline/products/product-1756023789547-930946815';
    
    // Update the product with the image
    const updatedProduct = await Product.findByIdAndUpdate(
      testCake._id,
      {
        images: [cloudinaryImageId],
        defaultImage: cloudinaryImageId
      },
      { new: true }
    );
    
    if (updatedProduct) {
      console.log('✅ TEST Cake image updated successfully!');
      console.log(`New images: ${JSON.stringify(updatedProduct.images)}`);
      console.log(`New defaultImage: ${updatedProduct.defaultImage}`);
      
      // Test the Cloudinary URL
      const cloudinaryUrl = `https://res.cloudinary.com/deojqbepy/image/upload/${cloudinaryImageId}`;
      console.log(`Cloudinary URL: ${cloudinaryUrl}`);
    } else {
      console.log('❌ Failed to update TEST Cake product');
    }
    
  } catch (error) {
    console.error('❌ Error fixing TEST Cake image:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
if (require.main === module) {
  fixTestCakeImage();
}
