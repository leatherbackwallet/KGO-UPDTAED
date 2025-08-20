/**
 * Migration Script - Add default prices to existing products
 * This script will add a default price of 29.99 to all products that don't have a price
 */

import mongoose from 'mongoose';
import { Product } from '../models/products.model';
import dotenv from 'dotenv';

dotenv.config();

async function addProductPrices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');
    
    // Find all products without a price field or with price = 0
    const productsWithoutPrice = await Product.find({
      $or: [
        { price: { $exists: false } },
        { price: 0 },
        { price: null }
      ]
    });
    
    console.log(`Found ${productsWithoutPrice.length} products without price`);
    
    if (productsWithoutPrice.length === 0) {
      console.log('All products already have prices');
      return;
    }
    
    // Update each product with a default price
    const defaultPrice = 29.99;
    let updatedCount = 0;
    
    for (const product of productsWithoutPrice) {
      await Product.findByIdAndUpdate(product._id, {
        price: defaultPrice
      });
              console.log(`Updated product "${product.name}" with price ₹${defaultPrice}`);
      updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} products with default price`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
addProductPrices(); 