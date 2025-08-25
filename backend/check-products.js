const mongoose = require('mongoose');
require('dotenv').config();

async function checkProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Define the Product schema directly since we can't import TypeScript
    const productSchema = new mongoose.Schema({
      name: String,
      description: String,
      slug: String,
      categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
      price: Number,
      stock: Number,
      images: [String],
      defaultImage: String,
      occasions: [String],
      vendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
      isFeatured: Boolean,
      isDeleted: Boolean
    }, { timestamps: true });
    
    const Product = mongoose.model('Product', productSchema);
    const products = await Product.find({}).lean();
    
    console.log('\n=== PRODUCTS IN DATABASE ===');
    console.log(`Total products: ${products.length}\n`);
    
    products.forEach((product, index) => {
      console.log(`Product ${index + 1}:`);
      console.log(`  Name: ${product.name}`);
      console.log(`  ID: ${product._id}`);
      console.log(`  Images: ${JSON.stringify(product.images)}`);
      console.log(`  Default Image: ${product.defaultImage}`);
      console.log(`  Slug: ${product.slug}`);
      console.log(`  Price: ${product.price}`);
      console.log(`  Stock: ${product.stock}`);
      console.log('  ---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkProducts();
