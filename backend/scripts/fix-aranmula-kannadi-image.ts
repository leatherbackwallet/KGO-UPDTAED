/**
 * Fix aranmula kannadi Image Script
 * Links the newly uploaded Cloudinary image to the aranmula kannadi product
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Product } from '../models/products.model';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixAranmulaKannadiImage() {
  try {
    console.log('🔧 Fixing aranmula kannadi image...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find the aranmula kannadi product
    const product = await Product.findOne({ name: 'aranmula kannadi' });
    
    if (!product) {
      console.log('❌ aranmula kannadi product not found');
      return;
    }
    
    console.log(`✅ Found aranmula kannadi product: ${product._id}`);
    console.log(`Current images: ${JSON.stringify(product.images)}`);
    console.log(`Current defaultImage: ${product.defaultImage}`);
    
    // The newly uploaded image (from the recent upload)
    const cloudinaryImageId = 'keralagiftsonline/products/product-1756024505151-523769410';
    
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
      console.log('✅ aranmula kannadi image updated successfully!');
      console.log(`New images: ${JSON.stringify(updatedProduct.images)}`);
      console.log(`New defaultImage: ${updatedProduct.defaultImage}`);
      
      // Test the Cloudinary URL
      const cloudinaryUrl = `https://res.cloudinary.com/deojqbepy/image/upload/${cloudinaryImageId}`;
      console.log(`Cloudinary URL: ${cloudinaryUrl}`);
    } else {
      console.log('❌ Failed to update aranmula kannadi product');
    }
    
  } catch (error) {
    console.error('❌ Error fixing aranmula kannadi image:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
if (require.main === module) {
  fixAranmulaKannadiImage();
}
