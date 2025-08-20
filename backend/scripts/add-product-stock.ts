/**
 * Migration Script - Add default stock values to existing products
 * This script will add a default stock of 100 to all products that don't have stock
 */

import mongoose from 'mongoose';
import { Product } from '../models/products.model';
import dotenv from 'dotenv';

dotenv.config();

async function addProductStock() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');
    
    // Find all products without a stock field or with stock = null
    const productsWithoutStock = await Product.find({
      $or: [
        { stock: { $exists: false } },
        { stock: null },
        { stock: 0 }
      ]
    });
    
    console.log(`Found ${productsWithoutStock.length} products without stock`);
    
    if (productsWithoutStock.length === 0) {
      console.log('All products already have stock values');
      return;
    }
    
    // Update each product with a default stock
    const defaultStock = 100;
    let updatedCount = 0;
    
    for (const product of productsWithoutStock) {
      await Product.findByIdAndUpdate(product._id, {
        stock: defaultStock
      });
              console.log(`Updated product "${product.name}" with stock ${defaultStock}`);
      updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} products with default stock`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
addProductStock(); 