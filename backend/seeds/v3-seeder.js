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
    en: { type: String, required: true },
    de: { type: String, required: true }
  },
  slug: { type: String, required: true, unique: true },
  description: {
    en: String,
    de: String
  },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true },
    de: { type: String, required: true }
  },
  description: {
    en: { type: String, required: true },
    de: { type: String, required: true }
  },
  slug: { type: String, required: true, unique: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images: [String],
  defaultImage: String,
  isFeatured: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const attributeSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true },
    de: { type: String, required: true }
  },
  type: {
    type: String,
    enum: ['text', 'dropdown', 'checkbox_group', 'number', 'boolean'],
    required: true
  },
  options: [{
    label: {
      en: String,
      de: String
    },
    value: String
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

  await Role.deleteMany({});
  const createdRoles = await Role.insertMany(roles);
  console.log(`Created ${createdRoles.length} roles`);
  return createdRoles;
}

async function seedUsers(roles) {
  console.log('Seeding users...');
  
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

  await User.deleteMany({});
  const createdUsers = await User.insertMany(users);
  console.log(`Created ${createdUsers.length} users`);
  return createdUsers;
}

async function seedCategories() {
  console.log('Seeding categories...');
  
  const categories = [
    {
      name: { en: 'Celebration Cakes', de: 'Feierkuchen' },
      slug: 'celebration-cakes',
      description: { en: 'Beautiful cakes for special occasions', de: 'Schöne Kuchen für besondere Anlässe' },
      sortOrder: 1,
      isActive: true
    },
    {
      name: { en: 'Gift Baskets', de: 'Geschenkkörbe' },
      slug: 'gift-baskets',
      description: { en: 'Curated gift baskets for all occasions', de: 'Kuratiert Geschenkkörbe für alle Anlässe' },
      sortOrder: 2,
      isActive: true
    },
    {
      name: { en: 'Flowers', de: 'Blumen' },
      slug: 'flowers',
      description: { en: 'Fresh flowers and arrangements', de: 'Frische Blumen und Arrangements' },
      sortOrder: 3,
      isActive: true
    },
    {
      name: { en: 'Chocolates', de: 'Schokoladen' },
      slug: 'chocolates',
      description: { en: 'Premium chocolates and sweets', de: 'Premium Schokoladen und Süßigkeiten' },
      sortOrder: 4,
      isActive: true
    }
  ];

  await Category.deleteMany({});
  const createdCategories = await Category.insertMany(categories);
  console.log(`Created ${createdCategories.length} categories`);
  return createdCategories;
}

async function seedProducts(categories) {
  console.log('Seeding products...');
  
  const products = [
    {
      name: { en: 'Birthday Cake', de: 'Geburtstagskuchen' },
      description: { en: 'Delicious birthday cake with cream and fruits', de: 'Leckerer Geburtstagskuchen mit Sahne und Früchten' },
      slug: 'birthday-cake',
      category: categories[0]._id,
      images: ['/images/products/birthday-cake.svg'],
      defaultImage: '/images/products/birthday-cake.svg',
      isFeatured: true
    },
    {
      name: { en: 'Wedding Cake', de: 'Hochzeitstorte' },
      description: { en: 'Elegant wedding cake with white frosting', de: 'Elegante Hochzeitstorte mit weißer Glasur' },
      slug: 'wedding-cake',
      category: categories[0]._id,
      images: ['/images/products/wedding-cake.svg'],
      defaultImage: '/images/products/wedding-cake.svg',
      isFeatured: true
    },
    {
      name: { en: 'Gift Basket Premium', de: 'Geschenkkorb Premium' },
      description: { en: 'Premium gift basket with chocolates and wine', de: 'Premium Geschenkkorb mit Schokoladen und Wein' },
      slug: 'gift-basket-premium',
      category: categories[1]._id,
      images: ['/images/products/gift-basket-premium.svg'],
      defaultImage: '/images/products/gift-basket-premium.svg',
      isFeatured: false
    },
    {
      name: { en: 'Rose Bouquet', de: 'Rosenstrauß' },
      description: { en: 'Beautiful red rose bouquet', de: 'Schöner roter Rosenstrauß' },
      slug: 'rose-bouquet',
      category: categories[2]._id,
      images: ['/images/products/rose-bouquet.svg'],
      defaultImage: '/images/products/rose-bouquet.svg',
      isFeatured: true
    }
  ];

  await Product.deleteMany({});
  const createdProducts = await Product.insertMany(products);
  console.log(`Created ${createdProducts.length} products`);
  return createdProducts;
}

async function seedAttributes() {
  console.log('Seeding attributes...');
  
  const attributes = [
    {
      name: { en: 'Size', de: 'Größe' },
      type: 'dropdown',
      options: [
        { label: { en: 'Small', de: 'Klein' }, value: 'small' },
        { label: { en: 'Medium', de: 'Mittel' }, value: 'medium' },
        { label: { en: 'Large', de: 'Groß' }, value: 'large' }
      ],
      isRequired: true
    },
    {
      name: { en: 'Color', de: 'Farbe' },
      type: 'dropdown',
      options: [
        { label: { en: 'Red', de: 'Rot' }, value: 'red' },
        { label: { en: 'White', de: 'Weiß' }, value: 'white' },
        { label: { en: 'Pink', de: 'Rosa' }, value: 'pink' }
      ],
      isRequired: false
    },
    {
      name: { en: 'Allergen Free', de: 'Allergenfrei' },
      type: 'checkbox_group',
      options: [
        { label: { en: 'Gluten Free', de: 'Glutenfrei' }, value: 'gluten_free' },
        { label: { en: 'Dairy Free', de: 'Laktosefrei' }, value: 'dairy_free' },
        { label: { en: 'Nut Free', de: 'Nussfrei' }, value: 'nut_free' }
      ],
      isRequired: false
    }
  ];

  await Attribute.deleteMany({});
  const createdAttributes = await Attribute.insertMany(attributes);
  console.log(`Created ${createdAttributes.length} attributes`);
  return createdAttributes;
}

async function seedPromotions() {
  console.log('Seeding promotions...');
  
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

  await Promotion.deleteMany({});
  const createdPromotions = await Promotion.insertMany(promotions);
  console.log(`Created ${createdPromotions.length} promotions`);
  return createdPromotions;
}

async function seedHubs() {
  console.log('Seeding hubs...');
  
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

  await Hub.deleteMany({});
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