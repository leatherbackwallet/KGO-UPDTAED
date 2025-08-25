/**
 * Fix Funeral Wreath Image Script
 * Links the newly uploaded Cloudinary image to the Funeral Wreath product
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Product } from '../models/products.model';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixFuneralWreathImage() {
  try {
    console.log('🔧 Fixing Funeral Wreath image...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find the Funeral Wreath product
    const product = await Product.findOne({ name: 'Funeral Wreath' });
    
    if (!product) {
      console.log('❌ Funeral Wreath product not found');
      return;
    }
    
    console.log(`✅ Found Funeral Wreath product: ${product._id}`);
    console.log(`Current images: ${JSON.stringify(product.images)}`);
    console.log(`Current defaultImage: ${product.defaultImage}`);
    
    // The newly uploaded image (from the recent upload)
    const cloudinaryImageId = 'keralagiftsonline/products/product-1756024815368-142700380';
    
    // Update the product with the image
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      {
        images: [cloudinaryImageId],
        defaultImage: cloudinaryImageId
      },
      { new: true }
    );
    
    if (updatedProduct) {
      console.log('✅ Funeral Wreath image updated successfully!');
      console.log(`New images: ${JSON.stringify(updatedProduct.images)}`);
      console.log(`New defaultImage: ${updatedProduct.defaultImage}`);
      
      // Test the Cloudinary URL
      const cloudinaryUrl = `https://res.cloudinary.com/deojqbepy/image/upload/${cloudinaryImageId}`;
      console.log(`Cloudinary URL: ${cloudinaryUrl}`);
    } else {
      console.log('❌ Failed to update Funeral Wreath product');
    }
    
  } catch (error) {
    console.error('❌ Error fixing Funeral Wreath image:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
if (require.main === module) {
  fixFuneralWreathImage();
}
