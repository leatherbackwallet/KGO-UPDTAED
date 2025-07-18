/**
 * Image Organization Script
 * Helps organize SD images into the proper folder structure for the bakery app
 */

const fs = require('fs');
const path = require('path');

// Product image mappings based on your current seed data
const productImageMappings = {
  // Celebration Cakes
  'classic-chocolate-celebration-cake': 'chocolate-celebration-cake.jpg',
  'vanilla-bean-celebration-cake': 'vanilla-celebration-cake.jpg',
  
  // Wedding Cakes
  'traditional-3-tier-wedding-cake': 'traditional-wedding-cake.jpg',
  'modern-naked-wedding-cake': 'naked-wedding-cake.jpg',
  
  // Birthday Cakes
  'rainbow-birthday-cake': 'rainbow-birthday-cake.jpg',
  'chocolate-truffle-birthday-cake': 'chocolate-truffle-cake.jpg',
  
  // Cupcakes
  'vanilla-cupcakes-buttercream': 'vanilla-cupcakes.jpg',
  'red-velvet-cupcakes': 'red-velvet-cupcakes.jpg',
  
  // Pastries
  'chocolate-croissants': 'chocolate-croissants.jpg',
  'apple-turnovers': 'apple-turnovers.jpg',
  
  // Cookies
  'chocolate-chip-cookies': 'chocolate-chip-cookies.jpg',
  'sugar-cookies': 'sugar-cookies.jpg',
  
  // Breads
  'sourdough-bread': 'sourdough-bread.jpg',
  'whole-wheat-bread': 'whole-wheat-bread.jpg'
};

/**
 * Instructions for organizing images:
 * 
 * 1. Create a folder called 'sd-images' in your project root
 * 2. Place all your SD images in that folder
 * 3. Rename them according to the mappings above
 * 4. Run this script to copy them to the correct location
 */

function organizeImages() {
  const sourceDir = path.join(__dirname, '../sd-images');
  const targetDir = path.join(__dirname, '../frontend/public/images/products');
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  console.log('🎨 Organizing product images...\n');
  
  let copiedCount = 0;
  let missingCount = 0;
  
  for (const [slug, filename] of Object.entries(productImageMappings)) {
    const sourcePath = path.join(sourceDir, filename);
    const targetPath = path.join(targetDir, filename);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied: ${filename} (${slug})`);
      copiedCount++;
    } else {
      console.log(`❌ Missing: ${filename} (${slug})`);
      missingCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Copied: ${copiedCount} images`);
  console.log(`   ❌ Missing: ${missingCount} images`);
  
  if (missingCount > 0) {
    console.log(`\n📝 To complete the setup:`);
    console.log(`   1. Add the missing images to the 'sd-images' folder`);
    console.log(`   2. Rename them according to the mappings above`);
    console.log(`   3. Run this script again`);
  }
  
  // Create a placeholder image if it doesn't exist
  const placeholderPath = path.join(targetDir, 'placeholder.jpg');
  if (!fs.existsSync(placeholderPath)) {
    console.log(`\n🖼️  Creating placeholder image...`);
    // Create a simple 1x1 pixel transparent PNG as placeholder
    const placeholderData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(placeholderPath, placeholderData);
    console.log(`✅ Created placeholder image`);
  }
}

// Run the script
if (require.main === module) {
  organizeImages();
}

module.exports = { organizeImages, productImageMappings }; 