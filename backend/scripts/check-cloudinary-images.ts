/**
 * Check Cloudinary Images Script
 * Lists all images currently in Cloudinary
 */

import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkCloudinaryImages() {
  try {
    console.log('🔍 Checking Cloudinary images...');
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
    });
    
    // List all images in the products folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'keralagiftsonline/products',
      max_results: 50
    });
    
    console.log(`📊 Found ${result.resources.length} images in Cloudinary:`);
    console.log('');
    
    result.resources.forEach((resource: any, index: number) => {
      console.log(`${index + 1}. ${resource.public_id}`);
      console.log(`   Format: ${resource.format}`);
      console.log(`   Size: ${resource.bytes} bytes`);
      console.log(`   Created: ${resource.created_at}`);
      console.log(`   URL: ${resource.secure_url}`);
      console.log('');
    });
    
    // Check for any recent uploads that might be for TEST Cake
    console.log('🔍 Looking for recent uploads that might be for TEST Cake...');
    const recentImages = result.resources
      .filter((resource: any) => {
        const createdAt = new Date(resource.created_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return hoursDiff < 24; // Images uploaded in the last 24 hours
      })
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    if (recentImages.length > 0) {
      console.log(`📅 Found ${recentImages.length} recent uploads:`);
      recentImages.forEach((resource: any) => {
        console.log(`   - ${resource.public_id} (${resource.created_at})`);
      });
    } else {
      console.log('📅 No recent uploads found');
    }
    
  } catch (error) {
    console.error('❌ Error checking Cloudinary images:', error);
  }
}

// Run the check
if (require.main === module) {
  checkCloudinaryImages();
}
