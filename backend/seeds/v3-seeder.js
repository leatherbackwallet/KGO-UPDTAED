/**
 * V3 Database Seeder - KeralGiftsOnline Enterprise Schema
 * Populates the new database with sample data for testing and development
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to the new database
mongoose.connect(process.env.MONGODB_URI);

// Define schemas inline for seeding
const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  permissions: [String],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  phone: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }],
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative']
  },
  images: [{
    type: String,
    trim: true
  }],
  defaultImage: {
    type: String,
    trim: true
  },
  occasions: [{
    type: String,
    trim: true,
    enum: [
      'DIWALI', 'ANNIVERSARY', 'BIRTHDAY', 'CONDOLENCES', 'CONGRATULATION',
      'FATHERS DAY', 'GET WELL SOON', 'HOUSE WARMING', 'JUST BECAUSE',
      'MISS YOU', 'NEW BORN', 'ONAM', 'SYMPATHY', 'THANK YOU',
      'TRADITIONAL', 'WEDDING'
    ]
  }],
  vendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const attributeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'dropdown', 'checkbox_group', 'number', 'boolean'],
    required: true
  },
  options: [{
    label: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  }],
  isRequired: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const promotionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, sparse: true },
  conditions: [{
    type: { type: String, required: true },
    config: { type: mongoose.Schema.Types.Mixed, required: true }
  }],
  actions: [{
    type: { type: String, required: true },
    config: { type: mongoose.Schema.Types.Mixed, required: true }
  }],
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const hubSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  address: {
    streetName: { type: String, required: true },
    houseNumber: { type: String, required: true },
    postalCode: { type: String, required: true },
    city: { type: String, required: true },
    countryCode: { type: String, default: 'DE' }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number]
  },
  operatingHours: String,
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Create models
const Role = mongoose.model('Role', roleSchema);
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Attribute = mongoose.model('Attribute', attributeSchema);
const Promotion = mongoose.model('Promotion', promotionSchema);
const Hub = mongoose.model('Hub', hubSchema);

async function seedRoles() {
  console.log('Seeding roles...');
  
  // Check if roles already exist
  const existingRoles = await Role.countDocuments();
  if (existingRoles > 0) {
    console.log('Roles already exist, skipping...');
    return await Role.find();
  }
  
  const roles = [
    {
      name: 'admin',
      description: 'System administrator with full access',
      permissions: ['*'],
      isActive: true
    },
    {
      name: 'customer',
      description: 'Regular customer',
      permissions: ['view_products', 'place_orders', 'view_own_orders', 'manage_wishlist'],
      isActive: true
    },
    {
      name: 'vendor',
      description: 'Product vendor',
      permissions: ['manage_own_products', 'view_own_orders', 'manage_own_vendor_profile'],
      isActive: true
    },
    {
      name: 'support_agent',
      description: 'Customer support agent',
      permissions: ['view_orders', 'manage_support_tickets', 'view_users'],
      isActive: true
    },
    {
      name: 'delivery_agent',
      description: 'Delivery personnel',
      permissions: ['view_assigned_deliveries', 'update_delivery_status'],
      isActive: true
    }
  ];

  const createdRoles = await Role.insertMany(roles);
  console.log(`Created ${createdRoles.length} roles`);
  return createdRoles;
}

async function seedUsers(roles) {
  console.log('Seeding users...');
  
  // Check if users already exist
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    console.log('Users already exist, skipping...');
    return await User.find();
  }
  
  const adminRole = roles.find(r => r.name === 'admin');
  const customerRole = roles.find(r => r.name === 'customer');
  const vendorRole = roles.find(r => r.name === 'vendor');

  const users = [
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@keralagiftsonline.com',
      password: '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ',
      roleId: adminRole._id,
      phone: '+49123456789',
      isActive: true
    },
    {
      firstName: 'John',
      lastName: 'Customer',
      email: 'customer@example.com',
      password: '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ',
      roleId: customerRole._id,
      phone: '+49123456790',
      isActive: true
    },
    {
      firstName: 'Vendor',
      lastName: 'Owner',
      email: 'vendor@example.com',
      password: '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ',
      roleId: vendorRole._id,
      phone: '+49123456791',
      isActive: true
    }
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`Created ${createdUsers.length} users`);
  return createdUsers;
}

async function seedCategories() {
  console.log('Seeding categories...');
  
  // Check if categories already exist
  const existingCategories = await Category.countDocuments();
  if (existingCategories > 0) {
    console.log('Categories already exist, skipping...');
    return await Category.find();
  }
  
  const categories = [
    {
      name: 'Celebration Cakes',
      slug: 'celebration-cakes',
      description: 'Beautiful cakes for special occasions',
      sortOrder: 1,
      isActive: true
    },
    {
      name: 'Gift Baskets',
      slug: 'gift-baskets',
      description: 'Curated gift baskets for all occasions',
      sortOrder: 2,
      isActive: true
    },
    {
      name: 'Flowers',
      slug: 'flowers',
      description: 'Fresh flowers and arrangements',
      sortOrder: 3,
      isActive: true
    },
    {
      name: 'Chocolates',
      slug: 'chocolates',
      description: 'Premium chocolates and sweets',
      sortOrder: 4,
      isActive: true
    }
  ];

  const createdCategories = await Category.insertMany(categories);
  console.log(`Created ${createdCategories.length} categories`);
  return createdCategories;
}

async function seedProducts(categories) {
  console.log('Seeding products...');
  
  // Check if products already exist
  const existingProducts = await Product.countDocuments();
  if (existingProducts > 0) {
    console.log('Products already exist, skipping...');
    return await Product.find();
  }
  
  const products = [
    {
      name: 'Birthday Cake',
      description: 'Delicious birthday cake with cream and fruits',
      slug: 'birthday-cake',
      categories: [categories[0]._id],
      price: 50,
      stock: 10,
      images: ['/images/products/birthday-cake.svg'],
      defaultImage: '/images/products/birthday-cake.svg',
      occasions: ['BIRTHDAY'],
      isFeatured: true
    },
    {
      name: 'Wedding Cake',
      description: 'Elegant wedding cake with white frosting',
      slug: 'wedding-cake',
      categories: [categories[0]._id],
      price: 100,
      stock: 5,
      images: ['/images/products/wedding-cake.svg'],
      defaultImage: '/images/products/wedding-cake.svg',
      occasions: ['WEDDING'],
      isFeatured: true
    },
    {
      name: 'Gift Basket Premium',
      description: 'Premium gift basket with chocolates and wine',
      slug: 'gift-basket-premium',
      categories: [categories[1]._id],
      price: 75,
      stock: 15,
      images: ['/images/products/gift-basket-premium.svg'],
      defaultImage: '/images/products/gift-basket-premium.svg',
      occasions: ['ANNIVERSARY', 'BIRTHDAY'],
      isFeatured: false
    },
    {
      name: 'Rose Bouquet',
      description: 'Beautiful red rose bouquet',
      slug: 'rose-bouquet',
      categories: [categories[2]._id],
      price: 25,
      stock: 20,
      images: ['/images/products/rose-bouquet.svg'],
      defaultImage: '/images/products/rose-bouquet.svg',
      occasions: ['DIWALI', 'ANNIVERSARY'],
      isFeatured: true
    }
  ];

  const createdProducts = await Product.insertMany(products);
  console.log(`Created ${createdProducts.length} products`);
  return createdProducts;
}

async function seedAttributes() {
  console.log('Seeding attributes...');
  
  // Check if attributes already exist
  const existingAttributes = await Attribute.countDocuments();
  if (existingAttributes > 0) {
    console.log('Attributes already exist, skipping...');
    return await Attribute.find();
  }
  
  const attributes = [
    {
      name: 'Size',
      type: 'dropdown',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' }
      ],
      isRequired: true
    },
    {
      name: 'Color',
      type: 'dropdown',
      options: [
        { label: 'Red', value: 'red' },
        { label: 'White', value: 'white' },
        { label: 'Pink', value: 'pink' }
      ],
      isRequired: false
    },
    {
      name: 'Allergen Free',
      type: 'checkbox_group',
      options: [
        { label: 'Gluten Free', value: 'gluten_free' },
        { label: 'Dairy Free', value: 'dairy_free' },
        { label: 'Nut Free', value: 'nut_free' }
      ],
      isRequired: false
    }
  ];

  const createdAttributes = await Attribute.insertMany(attributes);
  console.log(`Created ${createdAttributes.length} attributes`);
  return createdAttributes;
}

async function seedPromotions() {
  console.log('Seeding promotions...');
  
  // Check if promotions already exist
  const existingPromotions = await Promotion.countDocuments();
  if (existingPromotions > 0) {
    console.log('Promotions already exist, skipping...');
    return await Promotion.find();
  }
  
  const promotions = [
    {
      name: 'Summer Sale 2025',
      code: 'SUMMER25',
      conditions: [
        {
          type: 'cart_total',
          config: { operator: 'gte', value: 50 }
        }
      ],
      actions: [
        {
          type: 'cart_percentage_discount',
          config: { value: 10 }
        }
      ],
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-08-31'),
      isActive: true
    },
    {
      name: 'Free Shipping',
      code: 'FREESHIP',
      conditions: [
        {
          type: 'cart_total',
          config: { operator: 'gte', value: 100 }
        }
      ],
      actions: [
        {
          type: 'apply_free_shipping',
          config: {}
        }
      ],
      isActive: true
    }
  ];

  const createdPromotions = await Promotion.insertMany(promotions);
  console.log(`Created ${createdPromotions.length} promotions`);
  return createdPromotions;
}

async function seedHubs() {
  console.log('Seeding hubs...');
  
  // Check if hubs already exist
  const existingHubs = await Hub.countDocuments();
  if (existingHubs > 0) {
    console.log('Hubs already exist, skipping...');
    return await Hub.find();
  }
  
  const hubs = [
    {
      name: 'Kerala Gifts Hub - Berlin',
      address: {
        streetName: 'Alexanderplatz',
        houseNumber: '1',
        postalCode: '10178',
        city: 'Berlin',
        countryCode: 'DE'
      },
      location: {
        type: 'Point',
        coordinates: [13.4125, 52.5200]
      },
      operatingHours: 'Mon-Fri: 9:00-18:00, Sat: 10:00-16:00',
      isActive: true
    },
    {
      name: 'Kerala Gifts Hub - Munich',
      address: {
        streetName: 'Marienplatz',
        houseNumber: '8',
        postalCode: '80331',
        city: 'Munich',
        countryCode: 'DE'
      },
      location: {
        type: 'Point',
        coordinates: [11.5755, 48.1372]
      },
      operatingHours: 'Mon-Fri: 9:00-18:00, Sat: 10:00-16:00',
      isActive: true
    }
  ];

  const createdHubs = await Hub.insertMany(hubs);
  console.log(`Created ${createdHubs.length} hubs`);
  return createdHubs;
}

async function runSeeder() {
  try {
    console.log('Starting KeralGiftsOnline v3 database seeding...');

    // Seed in order
    const roles = await seedRoles();
    const users = await seedUsers(roles);
    const categories = await seedCategories();
    const products = await seedProducts(categories);
    const attributes = await seedAttributes();
    const promotions = await seedPromotions();
    const hubs = await seedHubs();

    console.log('Seeding completed successfully!');
    console.log(`Created ${roles.length} roles, ${users.length} users, ${categories.length} categories, ${products.length} products, ${attributes.length} attributes, ${promotions.length} promotions, ${hubs.length} hubs`);

  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Run seeder if called directly
if (require.main === module) {
  runSeeder()
    .then(() => {
      console.log('Seeder script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeder script failed:', error);
      process.exit(1);
    });
}

module.exports = { runSeeder }; 