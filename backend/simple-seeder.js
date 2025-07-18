require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB using the same connection as the main app
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/onYourBehlf';
mongoose.connect(MONGODB_URI);

// Define schemas
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['customer', 'vendor', 'admin', 'support_agent'] },
  phone: String
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  image: String
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  defaultImage: String,
  tags: [String],
  personalizationOptions: [{
    type: { type: String },
    label: String
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const vendorSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  storeName: { type: String, unique: true },
  status: { type: String, enum: ['active', 'inactive', 'pending_approval', 'rejected'] },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String
  },
  serviceablePincodes: [String],
  averageRating: { type: Number, default: 0 }
}, { timestamps: true });

// Create models
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Vendor = mongoose.model('Vendor', vendorSchema);

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Vendor.deleteMany({});
    console.log('🗑️  Cleared existing data');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create users
    const users = await User.insertMany([
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@onyourbehlf.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+91-9876543210'
      },
      {
        firstName: 'John',
        lastName: 'Customer',
        email: 'customer@example.com',
        password: hashedPassword,
        role: 'customer',
        phone: '+91-9876543211'
      },
      {
        firstName: 'Sarah',
        lastName: 'Vendor',
        email: 'vendor@example.com',
        password: hashedPassword,
        role: 'vendor',
        phone: '+91-9876543212'
      },
      {
        firstName: 'Mike',
        lastName: 'Support',
        email: 'support@onyourbehlf.com',
        password: hashedPassword,
        role: 'support_agent',
        phone: '+91-9876543213'
      }
    ]);
    console.log(`✅ Created ${users.length} users`);
    
    // Create categories
    const categories = await Category.insertMany([
      {
        name: 'Celebration Cakes',
        slug: 'celebration-cakes',
        image: '/images/categories/celebration-cakes.jpg'
      },
      {
        name: 'Wedding Cakes',
        slug: 'wedding-cakes',
        image: '/images/categories/wedding-cakes.jpg'
      },
      {
        name: 'Birthday Cakes',
        slug: 'birthday-cakes',
        image: '/images/categories/birthday-cakes.jpg'
      },
      {
        name: 'Cupcakes',
        slug: 'cupcakes',
        image: '/images/categories/cupcakes.jpg'
      }
    ]);
    console.log(`✅ Created ${categories.length} categories`);
    
    // Create products
    const products = await Product.insertMany([
      {
        name: 'Classic Chocolate Celebration Cake',
        slug: 'classic-chocolate-celebration-cake',
        description: 'A rich and moist chocolate cake perfect for any celebration.',
        category: categories[0]._id,
        defaultImage: '/images/products/chocolate-celebration-cake.jpg',
        tags: ['chocolate', 'celebration', 'birthday'],
        personalizationOptions: [
          { type: 'text', label: 'Custom Message' },
          { type: 'color', label: 'Frosting Color' }
        ],
        isActive: true
      },
      {
        name: 'Traditional 3-Tier Wedding Cake',
        slug: 'traditional-3-tier-wedding-cake',
        description: 'Elegant 3-tier wedding cake with classic white fondant.',
        category: categories[1]._id,
        defaultImage: '/images/products/traditional-wedding-cake.jpg',
        tags: ['wedding', 'traditional', 'elegant'],
        personalizationOptions: [
          { type: 'text', label: 'Couple Names' },
          { type: 'color', label: 'Accent Colors' }
        ],
        isActive: true
      },
      {
        name: 'Rainbow Birthday Cake',
        slug: 'rainbow-birthday-cake',
        description: 'Colorful rainbow cake with vibrant layers and fun sprinkles.',
        category: categories[2]._id,
        defaultImage: '/images/products/rainbow-birthday-cake.jpg',
        tags: ['birthday', 'rainbow', 'colorful'],
        personalizationOptions: [
          { type: 'text', label: 'Birthday Message' },
          { type: 'color', label: 'Favorite Colors' }
        ],
        isActive: true
      },
      {
        name: 'Vanilla Cupcakes with Buttercream',
        slug: 'vanilla-cupcakes-buttercream',
        description: 'Classic vanilla cupcakes topped with smooth buttercream frosting.',
        category: categories[3]._id,
        defaultImage: '/images/products/vanilla-cupcakes.jpg',
        tags: ['cupcakes', 'vanilla', 'buttercream'],
        personalizationOptions: [
          { type: 'text', label: 'Custom Message' },
          { type: 'color', label: 'Frosting Color' }
        ],
        isActive: true
      }
    ]);
    console.log(`✅ Created ${products.length} products`);
    
    // Create vendors
    const vendorUsers = users.filter(user => user.role === 'vendor');
    const vendors = await Vendor.insertMany([
      {
        ownerId: vendorUsers[0]._id,
        storeName: 'Sweet Dreams Bakery',
        status: 'active',
        address: {
          street: '123 Baker Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001'
        },
        serviceablePincodes: ['400001', '400002', '400003'],
        averageRating: 4.5
      }
    ]);
    console.log(`✅ Created ${vendors.length} vendors`);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Vendors: ${vendors.length}`);
    
    // Log user details
    console.log('\n👥 Created Users:');
    users.forEach(user => {
      console.log(`   - ${user.role}: ${user.email} (${user.firstName} ${user.lastName})`);
    });
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedDatabase(); 