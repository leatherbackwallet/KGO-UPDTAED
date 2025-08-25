// Test image URL generation
const baseImagePath = "keralagiftsonline/products/product-1756023789547-930946815";

function getOptimizedImagePath(publicId, size = 'medium') {
  const PRODUCT_IMAGE_SIZES = {
    thumb: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 }
  };

  // If it's not a Cloudinary public ID, return as is
  if (!publicId.startsWith('keralagiftsonline/products/')) {
    return publicId;
  }
  
  const sizeConfig = PRODUCT_IMAGE_SIZES[size];
  const transformations = `w_${sizeConfig.width},h_${sizeConfig.height},c_fill,q_auto`;
  
  return `https://res.cloudinary.com/deojqbepy/image/upload/${transformations}/${publicId}`;
}

function getProductImage(imagePath, slug) {
  // If no image path provided, use default
  if (!imagePath) {
    return 'http://localhost:5001/images/products/placeholder.svg';
  }

  // If we have a full URL (already processed), use it directly
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If we have a Cloudinary public_id (starts with keralagiftsonline/products/)
  if (imagePath.startsWith('keralagiftsonline/products/')) {
    return `https://res.cloudinary.com/deojqbepy/image/upload/${imagePath}`;
  }
  
  return 'http://localhost:5001/images/products/placeholder.svg';
}

console.log('Base image path:', baseImagePath);
console.log('Optimized image path:', getOptimizedImagePath(baseImagePath, 'medium'));
console.log('Direct product image:', getProductImage(baseImagePath));
