/**
 * Product Restoration Script
 * Use this script to restore products that were accidentally deleted during seeding
 * Run this script manually when you need to restore specific products
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas inline
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  description: { type: String, trim: true },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }],
  price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
  stock: { type: Number, required: true, min: [0, 'Stock cannot be negative'] },
  images: [{ type: String, trim: true }],
  defaultImage: { type: String, trim: true },
  occasions: [{ type: String, trim: true }],
  vendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
  isFeatured: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);

async function restoreProducts() {
  try {
    console.log('🔧 Restoring products...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get existing categories
    const categories = await Category.find();
    console.log(`Found ${categories.length} categories`);
    
    // Find category IDs
    const celebrationCakes = categories.find(c => c.slug === 'celebration-cakes');
    const giftBaskets = categories.find(c => c.slug === 'gift-baskets');
    const flowers = categories.find(c => c.slug === 'flowers');
    const chocolates = categories.find(c => c.slug === 'chocolates');
    
    if (!celebrationCakes || !giftBaskets || !flowers || !chocolates) {
      throw new Error('Required categories not found. Please run seeding first.');
    }
    
    // Define products to restore (add your previously added products here)
    const productsToRestore = [
      // Add your previously added products here
      // Example:
      /*
      {
        name: 'Your Custom Product Name',
        description: 'Your product description',
        slug: 'your-custom-product-slug',
        categories: [celebrationCakes._id], // or other category
        price: 150,
        stock: 20,
        images: ['/images/products/your-product-image.jpg'],
        defaultImage: '/images/products/your-product-image.jpg',
        occasions: ['BIRTHDAY', 'ANNIVERSARY'],
        isFeatured: true
      },
      */
    ];
    
    if (productsToRestore.length === 0) {
      console.log('⚠️  No products defined for restoration.');
      console.log('Please add your previously added products to the productsToRestore array in this script.');
      return;
    }
    
    // Check for existing products with same slugs
    for (const product of productsToRestore) {
      const existing = await Product.findOne({ slug: product.slug });
      if (existing) {
        console.log(`⚠️  Product with slug "${product.slug}" already exists, skipping...`);
        continue;
      }
      
      // Create the product
      const newProduct = await Product.create(product);
      console.log(`✅ Restored product: ${newProduct.name} (${newProduct.slug})`);
    }
    
    console.log('🎉 Product restoration completed!');
    
  } catch (error) {
    console.error('❌ Product restoration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run restoration if called directly
if (require.main === module) {
  restoreProducts()
    .then(() => {
      console.log('Restoration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Restoration script failed:', error);
      process.exit(1);
    });
}

module.exports = { restoreProducts };
