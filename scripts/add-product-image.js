#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Simple script to add product images
 * Usage: node scripts/add-product-image.js <image-name> <product-slug>
 * Example: node scripts/add-product-image.js cake.jpg cake
 */

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('❌ Usage: node scripts/add-product-image.js <image-name> <product-slug>');
  console.log('Example: node scripts/add-product-image.js cake.jpg cake');
  process.exit(1);
}

const [imageName, productSlug] = args;
const sourcePath = path.join(__dirname, '..', 'sd-images', imageName);
const targetPath = path.join(__dirname, '..', 'frontend', 'public', 'images', 'products', imageName);

// Check if source image exists
if (!fs.existsSync(sourcePath)) {
  console.log(`❌ Source image not found: ${sourcePath}`);
  console.log('📝 Please add your image to the sd-images folder first');
  process.exit(1);
}

// Copy image to products folder
try {
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`✅ Successfully copied ${imageName} to products folder`);
  console.log(`📁 Image is now available at: /images/products/${imageName}`);
  console.log(`🔗 Product slug: ${productSlug}`);
  console.log(`💡 Make sure your product in the database has the image path: /images/products/${imageName}`);
} catch (error) {
  console.log(`❌ Error copying image: ${error.message}`);
  process.exit(1);
} 