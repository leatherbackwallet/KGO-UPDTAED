/**
 * Migration Script - Convert existing product images to GridFS
 * This script will:
 * 1. Read existing product images from the filesystem
 * 2. Upload them to GridFS
 * 3. Update the product records with new GridFS URLs
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Product } from '../models/products.model';
import { uploadImage, imageExists } from '../utils/gridfs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize GridFS
import { initializeGridFS } from '../utils/gridfs';

async function migrateToGridFS() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');
    
    // Initialize GridFS
    initializeGridFS();
    console.log('GridFS initialized');
    
    // Get all products
    const products = await Product.find({ isDeleted: false });
    console.log(`Found ${products.length} products to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        console.log(`\nProcessing product: ${product.name.en} (${product._id})`);
        
        const updatedImages: string[] = [];
        let hasChanges = false;
        
        // Process each image in the product
        for (const imagePath of product.images || []) {
          if (!imagePath) continue;
          
          // Skip if already a GridFS URL
          if (imagePath.startsWith('/api/images/')) {
            console.log(`  - Image already in GridFS: ${imagePath}`);
            updatedImages.push(imagePath);
            continue;
          }
          
          // Extract filename from path
          const filename = imagePath.split('/').pop();
          if (!filename) {
            console.log(`  - Invalid image path: ${imagePath}`);
            updatedImages.push(imagePath); // Keep original
            continue;
          }
          
          // Check if file exists in filesystem
          const filePath = path.join(__dirname, '../../../public/images/products', filename);
          if (!fs.existsSync(filePath)) {
            console.log(`  - File not found: ${filePath}`);
            updatedImages.push(imagePath); // Keep original
            continue;
          }
          
          // Read file and upload to GridFS
          const fileBuffer = fs.readFileSync(filePath);
          const fileInfo = {
            originalname: filename,
            mimetype: getMimeType(filename),
            size: fileBuffer.length,
            buffer: fileBuffer
          } as Express.Multer.File;
          
          console.log(`  - Uploading ${filename} to GridFS...`);
          const uploadResult = await uploadImage(fileInfo, filename);
          
          // Create new GridFS URL
          const gridfsUrl = `/api/images/${uploadResult.fileId}`;
          updatedImages.push(gridfsUrl);
          hasChanges = true;
          
          console.log(`  - Uploaded to GridFS: ${gridfsUrl}`);
        }
        
        // Update product if there were changes
        if (hasChanges) {
          await Product.updateOne(
            { _id: product._id },
            { 
              $set: { 
                images: updatedImages,
                defaultImage: updatedImages[0] || product.defaultImage
              }
            }
          );
          migratedCount++;
          console.log(`  ✓ Product updated successfully`);
        } else {
          skippedCount++;
          console.log(`  - No changes needed`);
        }
        
      } catch (error) {
        console.error(`  ✗ Error processing product ${product._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n=== Migration Summary ===`);
    console.log(`Total products: ${products.length}`);
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToGridFS();
}

export { migrateToGridFS }; 