/**
 * Migration Script - Move Local Images to Cloudinary CDN
 * Run this script to migrate existing local images to Cloudinary
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { migrateAllImages, generateMigrationReport } from '../utils/migrateToCloudinary';
import path from 'path';

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  try {
    console.log('Starting Cloudinary migration...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Check Cloudinary configuration
    const cloudinaryConfig = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    };
    
    const missingConfig = Object.entries(cloudinaryConfig)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingConfig.length > 0) {
      throw new Error(`Missing Cloudinary configuration: ${missingConfig.join(', ')}`);
    }
    
    console.log('Cloudinary configuration verified');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {
      deleteLocalAfterUpload: args.includes('--delete-local'),
      updateProductReferences: args.includes('--update-products'),
      batchSize: 10
    };
    
    console.log('Migration options:', options);
    
    // Run migration
    const results = await migrateAllImages(options);
    
    // Generate and display report
    const report = generateMigrationReport(results);
    console.log(report);
    
    // Save report to file
    const fs = await import('fs');
    const reportPath = `migration-report-${new Date().toISOString().split('T')[0]}.txt`;
    fs.writeFileSync(reportPath, report);
    console.log(`Migration report saved to: ${reportPath}`);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  main();
}
