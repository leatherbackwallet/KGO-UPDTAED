/**
 * Comprehensive V3 Database Seeder - KeralGiftsOnline Enterprise Schema
 * Populates ALL collections with sample data for testing and development
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to the new database
mongoose.connect(process.env.MONGODB_URI);

// Define all schemas inline for seeding
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

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedDeliveryDate: { type: Date, required: true },
  shippingDetails: {
    recipientName: { type: String, required: true },
    recipientPhone: { type: String, required: true },
    address: {
      streetName: { type: String, required: true },
      houseNumber: { type: String, required: true },
      postalCode: { type: String, required: true },
      city: { type: String, required: true },
      countryCode: { type: String, default: 'DE' }
    },
    specialInstructions: String
  },
  orderItems: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    personalizationOptions: { type: mongoose.Schema.Types.Mixed }
  }],
  totalPrice: { type: Number, required: true },
  orderStatus: {
    type: String,
    enum: ['pending', 'partially_shipped', 'shipped', 'partially_delivered', 'delivered', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    notes: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  promotionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' },
  discountAmount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  comment: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  paymentMethod: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: { type: String, unique: true },
  gatewayResponse: { type: mongoose.Schema.Types.Mixed },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['order_update', 'promotion', 'system', 'delivery'],
    default: 'system'
  },
  isRead: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  target: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: String,
  userAgent: String,
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const deliveryRunSchema = new mongoose.Schema({
  runId: { type: String, required: true, unique: true },
  hubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  scheduledDate: { type: Date, required: true },
  completedDate: Date,
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const shipmentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  deliveryRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryRun' },
  trackingNumber: { type: String, unique: true },
  status: {
    type: String,
    enum: ['pending', 'shipped', 'out_for_delivery', 'delivered', 'failed'],
    default: 'pending'
  },
  shippedDate: Date,
  deliveredDate: Date,
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: {
    streetName: String,
    houseNumber: String,
    postalCode: String,
    city: String,
    countryCode: String
  },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const vendorProductSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  price: { type: Number, required: true },
  stockQuantity: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxUses: { type: Number },
  usedCount: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const payoutSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: { type: String, required: true },
  reference: { type: String },
  processedDate: Date,
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const ledgerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  reference: { type: String },
  balance: { type: Number, required: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const dailyStatsSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  totalProducts: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const pageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  metaDescription: String,
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Create all models
const Role = mongoose.model('Role', roleSchema);
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Attribute = mongoose.model('Attribute', attributeSchema);
const Promotion = mongoose.model('Promotion', promotionSchema);
const Hub = mongoose.model('Hub', hubSchema);
const Order = mongoose.model('Order', orderSchema);
const Wishlist = mongoose.model('Wishlist', wishlistSchema);
const Review = mongoose.model('Review', reviewSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
const DeliveryRun = mongoose.model('DeliveryRun', deliveryRunSchema);
const Shipment = mongoose.model('Shipment', shipmentSchema);
const Vendor = mongoose.model('Vendor', vendorSchema);
const VendorProduct = mongoose.model('VendorProduct', vendorProductSchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
const Payout = mongoose.model('Payout', payoutSchema);
const Ledger = mongoose.model('Ledger', ledgerSchema);
const DailyStats = mongoose.model('DailyStats', dailyStatsSchema);
const Page = mongoose.model('Page', pageSchema);

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
  const supportRole = roles.find(r => r.name === 'support_agent');
  const deliveryRole = roles.find(r => r.name === 'delivery_agent');

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
    },
    {
      firstName: 'Support',
      lastName: 'Agent',
      email: 'support@example.com',
      password: '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ',
      roleId: supportRole._id,
      phone: '+49123456792',
      isActive: true
    },
    {
      firstName: 'Delivery',
      lastName: 'Driver',
      email: 'delivery@example.com',
      password: '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ',
      roleId: deliveryRole._id,
      phone: '+49123456793',
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
      description: { en: 'Beautiful cakes for special occasions', de: 'Schöne Kuchen für besondere Anlässe' },
      slug: 'celebration-cakes',
      sortOrder: 1,
      isActive: true
    },
    {
      name: { en: 'Gift Baskets', de: 'Geschenkkörbe' },
      description: { en: 'Premium gift baskets for all occasions', de: 'Premium Geschenkkörbe für alle Anlässe' },
      slug: 'gift-baskets',
      sortOrder: 2,
      isActive: true
    },
    {
      name: { en: 'Flowers', de: 'Blumen' },
      description: { en: 'Fresh flowers and bouquets', de: 'Frische Blumen und Sträuße' },
      slug: 'flowers',
      sortOrder: 3,
      isActive: true
    },
    {
      name: { en: 'Chocolates', de: 'Schokoladen' },
      description: { en: 'Premium chocolates and sweets', de: 'Premium Schokoladen und Süßigkeiten' },
      slug: 'chocolates',
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
      images: [],
      defaultImage: '',
      isFeatured: true
    },
    {
      name: { en: 'Wedding Cake', de: 'Hochzeitstorte' },
      description: { en: 'Elegant wedding cake with white frosting', de: 'Elegante Hochzeitstorte mit weißer Glasur' },
      slug: 'wedding-cake',
      category: categories[0]._id,
      images: [],
      defaultImage: '',
      isFeatured: true
    },
    {
      name: { en: 'Gift Basket Premium', de: 'Geschenkkorb Premium' },
      description: { en: 'Premium gift basket with chocolates and wine', de: 'Premium Geschenkkorb mit Schokoladen und Wein' },
      slug: 'gift-basket-premium',
      category: categories[1]._id,
      images: [],
      defaultImage: '',
      isFeatured: false
    },
    {
      name: { en: 'Rose Bouquet', de: 'Rosenstrauß' },
      description: { en: 'Beautiful red rose bouquet', de: 'Schöner roter Rosenstrauß' },
      slug: 'rose-bouquet',
      category: categories[2]._id,
      images: [],
      defaultImage: '',
      isFeatured: true
    },
    {
      name: { en: 'Premium Chocolates', de: 'Premium Schokoladen' },
      description: { en: 'Assorted premium chocolates', de: 'Sortierte Premium Schokoladen' },
      slug: 'premium-chocolates',
      category: categories[3]._id,
      images: ['/images/products/chocolates.jpg'],
      defaultImage: '/images/products/chocolates.jpg',
      isFeatured: true
    }
  ];

  await Product.deleteMany({});
  const createdProducts = await Product.insertMany(products);
  console.log(`Created ${createdProducts.length} products`);
  return createdProducts;
}

async function seedOrders(users, products) {
  console.log('Seeding orders...');
  
  const orders = [
    {
      orderId: 'ORD-2025-001',
      userId: users[1]._id, // customer
      requestedDeliveryDate: new Date('2025-01-25'),
      shippingDetails: {
        recipientName: 'John Customer',
        recipientPhone: '+49123456790',
        address: {
          streetName: 'Musterstraße',
          houseNumber: '123',
          postalCode: '10115',
          city: 'Berlin',
          countryCode: 'DE'
        },
        specialInstructions: 'Please deliver in the afternoon'
      },
      orderItems: [
        {
          productId: products[0]._id,
          quantity: 1,
          price: 45.99
        }
      ],
      totalPrice: 45.99,
      orderStatus: 'delivered',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date('2025-01-20'),
          notes: 'Order placed'
        },
        {
          status: 'delivered',
          timestamp: new Date('2025-01-22'),
          notes: 'Successfully delivered'
        }
      ],
      discountAmount: 0
    },
    {
      orderId: 'ORD-2025-002',
      userId: users[1]._id, // customer
      requestedDeliveryDate: new Date('2025-01-26'),
      shippingDetails: {
        recipientName: 'John Customer',
        recipientPhone: '+49123456790',
        address: {
          streetName: 'Beispielstraße',
          houseNumber: '456',
          postalCode: '80331',
          city: 'Munich',
          countryCode: 'DE'
        }
      },
      orderItems: [
        {
          productId: products[2]._id,
          quantity: 1,
          price: 89.99
        },
        {
          productId: products[3]._id,
          quantity: 1,
          price: 29.99
        }
      ],
      totalPrice: 119.98,
      orderStatus: 'shipped',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date('2025-01-21'),
          notes: 'Order placed'
        },
        {
          status: 'shipped',
          timestamp: new Date('2025-01-23'),
          notes: 'Package shipped'
        }
      ],
      discountAmount: 0
    }
  ];

  await Order.deleteMany({});
  const createdOrders = await Order.insertMany(orders);
  console.log(`Created ${createdOrders.length} orders`);
  return createdOrders;
}

async function seedWishlists(users, products) {
  console.log('Seeding wishlists...');
  
  const wishlists = [
    {
      userId: users[1]._id, // customer
      productId: products[0]._id
    },
    {
      userId: users[1]._id, // customer
      productId: products[3]._id
    }
  ];

  await Wishlist.deleteMany({});
  const createdWishlists = await Wishlist.insertMany(wishlists);
  console.log(`Created ${createdWishlists.length} wishlist items`);
  return createdWishlists;
}

async function seedReviews(users, products) {
  console.log('Seeding reviews...');
  
  const reviews = [
    {
      userId: users[1]._id, // customer
      productId: products[0]._id,
      rating: 5,
      title: 'Excellent Birthday Cake',
      comment: 'The cake was delicious and beautifully decorated!',
      isVerified: true
    },
    {
      userId: users[1]._id, // customer
      productId: products[2]._id,
      rating: 4,
      title: 'Great Gift Basket',
      comment: 'Perfect gift for special occasions.',
      isVerified: true
    }
  ];

  await Review.deleteMany({});
  const createdReviews = await Review.insertMany(reviews);
  console.log(`Created ${createdReviews.length} reviews`);
  return createdReviews;
}

async function seedTransactions(orders) {
  console.log('Seeding transactions...');
  
  const transactions = [
    {
      orderId: orders[0]._id,
      amount: 45.99,
      currency: 'EUR',
      paymentMethod: 'credit_card',
      status: 'completed',
      transactionId: 'TXN-001',
      gatewayResponse: { status: 'success' }
    },
    {
      orderId: orders[1]._id,
      amount: 119.98,
      currency: 'EUR',
      paymentMethod: 'paypal',
      status: 'completed',
      transactionId: 'TXN-002',
      gatewayResponse: { status: 'success' }
    }
  ];

  await Transaction.deleteMany({});
  const createdTransactions = await Transaction.insertMany(transactions);
  console.log(`Created ${createdTransactions.length} transactions`);
  return createdTransactions;
}

async function seedNotifications(users) {
  console.log('Seeding notifications...');
  
  const notifications = [
    {
      userId: users[1]._id, // customer
      title: 'Order Confirmed',
      message: 'Your order ORD-2025-001 has been confirmed.',
      type: 'order_update',
      isRead: false
    },
    {
      userId: users[1]._id, // customer
      title: 'Summer Sale',
      message: 'Get 20% off on all celebration cakes!',
      type: 'promotion',
      isRead: false
    }
  ];

  await Notification.deleteMany({});
  const createdNotifications = await Notification.insertMany(notifications);
  console.log(`Created ${createdNotifications.length} notifications`);
  return createdNotifications;
}

async function seedActivityLogs(users) {
  console.log('Seeding activity logs...');
  
  const activityLogs = [
    {
      userId: users[1]._id, // customer
      action: 'user_registered',
      target: 'user',
      details: { email: 'customer@example.com' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    },
    {
      userId: users[1]._id, // customer
      action: 'order_placed',
      target: 'order',
      details: { orderNumber: 'ORD-2025-001' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    }
  ];

  await ActivityLog.deleteMany({});
  const createdActivityLogs = await ActivityLog.insertMany(activityLogs);
  console.log(`Created ${createdActivityLogs.length} activity logs`);
  return createdActivityLogs;
}

async function seedVendors() {
  console.log('Seeding vendors...');
  
  const vendors = [
    {
      name: 'Kerala Bakery',
      email: 'bakery@keralagiftsonline.com',
      phone: '+49123456794',
      address: {
        streetName: 'Bäckereistraße',
        houseNumber: '10',
        postalCode: '10115',
        city: 'Berlin',
        countryCode: 'DE'
      },
      isActive: true
    },
    {
      name: 'Flower Paradise',
      email: 'flowers@keralagiftsonline.com',
      phone: '+49123456795',
      address: {
        streetName: 'Blumenstraße',
        houseNumber: '25',
        postalCode: '80331',
        city: 'Munich',
        countryCode: 'DE'
      },
      isActive: true
    }
  ];

  await Vendor.deleteMany({});
  const createdVendors = await Vendor.insertMany(vendors);
  console.log(`Created ${createdVendors.length} vendors`);
  return createdVendors;
}

async function seedVendorProducts(vendors, products) {
  console.log('Seeding vendor products...');
  
  const vendorProducts = [
    {
      vendorId: vendors[0]._id,
      productId: products[0]._id,
      price: 45.99,
      stockQuantity: 10
    },
    {
      vendorId: vendors[0]._id,
      productId: products[1]._id,
      price: 89.99,
      stockQuantity: 5
    },
    {
      vendorId: vendors[1]._id,
      productId: products[3]._id,
      price: 29.99,
      stockQuantity: 20
    }
  ];

  await VendorProduct.deleteMany({});
  const createdVendorProducts = await VendorProduct.insertMany(vendorProducts);
  console.log(`Created ${createdVendorProducts.length} vendor products`);
  return createdVendorProducts;
}

async function seedCoupons() {
  console.log('Seeding coupons...');
  
  const coupons = [
    {
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 50,
      maxUses: 100,
      usedCount: 5,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true
    },
    {
      code: 'FREESHIP',
      discountType: 'fixed',
      discountValue: 5.99,
      minOrderAmount: 100,
      maxUses: 50,
      usedCount: 2,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true
    }
  ];

  await Coupon.deleteMany({});
  const createdCoupons = await Coupon.insertMany(coupons);
  console.log(`Created ${createdCoupons.length} coupons`);
  return createdCoupons;
}

async function seedSupportTickets(users) {
  console.log('Seeding support tickets...');
  
  const supportTickets = [
    {
      userId: users[1]._id, // customer
      subject: 'Order Delivery Issue',
      description: 'My order was supposed to be delivered yesterday but I haven\'t received it yet.',
      priority: 'high',
      status: 'open',
      assignedTo: users[3]._id // support agent
    },
    {
      userId: users[1]._id, // customer
      subject: 'Product Quality Question',
      description: 'I want to know about the ingredients used in the birthday cake.',
      priority: 'medium',
      status: 'in_progress',
      assignedTo: users[3]._id // support agent
    }
  ];

  await SupportTicket.deleteMany({});
  const createdSupportTickets = await SupportTicket.insertMany(supportTickets);
  console.log(`Created ${createdSupportTickets.length} support tickets`);
  return createdSupportTickets;
}

async function seedPayouts(vendors) {
  console.log('Seeding payouts...');
  
  const payouts = [
    {
      vendorId: vendors[0]._id,
      amount: 1250.50,
      status: 'completed',
      paymentMethod: 'bank_transfer',
      reference: 'PAY-001',
      processedDate: new Date('2025-01-15')
    },
    {
      vendorId: vendors[1]._id,
      amount: 850.25,
      status: 'pending',
      paymentMethod: 'bank_transfer',
      reference: 'PAY-002'
    }
  ];

  await Payout.deleteMany({});
  const createdPayouts = await Payout.insertMany(payouts);
  console.log(`Created ${createdPayouts.length} payouts`);
  return createdPayouts;
}

async function seedLedgers(users) {
  console.log('Seeding ledgers...');
  
  const ledgers = [
    {
      userId: users[1]._id, // customer
      type: 'credit',
      amount: 100.00,
      description: 'Account credit',
      reference: 'CREDIT-001',
      balance: 100.00
    },
    {
      userId: users[1]._id, // customer
      type: 'debit',
      amount: 45.99,
      description: 'Order payment',
      reference: 'ORD-2025-001',
      balance: 54.01
    }
  ];

  await Ledger.deleteMany({});
  const createdLedgers = await Ledger.insertMany(ledgers);
  console.log(`Created ${createdLedgers.length} ledger entries`);
  return createdLedgers;
}

async function seedDailyStats() {
  console.log('Seeding daily stats...');
  
  const dailyStats = [
    {
      date: new Date('2025-01-20'),
      totalOrders: 15,
      totalRevenue: 1250.75,
      totalProducts: 25,
      totalUsers: 150
    },
    {
      date: new Date('2025-01-21'),
      totalOrders: 12,
      totalRevenue: 980.50,
      totalProducts: 25,
      totalUsers: 155
    }
  ];

  await DailyStats.deleteMany({});
  const createdDailyStats = await DailyStats.insertMany(dailyStats);
  console.log(`Created ${createdDailyStats.length} daily stats`);
  return createdDailyStats;
}

async function seedPages() {
  console.log('Seeding pages...');
  
  const pages = [
    {
      title: 'About Us',
      slug: 'about-us',
      content: 'KeralGiftsOnline is your premier destination for premium gifts and celebration cakes.',
      metaDescription: 'Learn about KeralGiftsOnline - your trusted source for premium gifts and cakes.',
      isActive: true
    },
    {
      title: 'Contact Us',
      slug: 'contact-us',
      content: 'Get in touch with us for any questions or support.',
      metaDescription: 'Contact KeralGiftsOnline for customer support and inquiries.',
      isActive: true
    },
    {
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      content: 'Our privacy policy explains how we collect and use your information.',
      metaDescription: 'Read our privacy policy to understand how we protect your data.',
      isActive: true
    }
  ];

  await Page.deleteMany({});
  const createdPages = await Page.insertMany(pages);
  console.log(`Created ${createdPages.length} pages`);
  return createdPages;
}

async function seedDeliveryRuns(hubs, users, orders) {
  console.log('Seeding delivery runs...');
  
  const deliveryRuns = [
    {
      runId: 'RUN-2025-001',
      hubId: hubs[0]._id,
      driverId: users[4]._id, // delivery agent
      orders: [orders[0]._id],
      status: 'completed',
      scheduledDate: new Date('2025-01-20'),
      completedDate: new Date('2025-01-20'),
      isActive: true
    },
    {
      runId: 'RUN-2025-002',
      hubId: hubs[1]._id,
      driverId: users[4]._id, // delivery agent
      orders: [orders[1]._id],
      status: 'in_progress',
      scheduledDate: new Date('2025-01-21'),
      isActive: true
    }
  ];

  await DeliveryRun.deleteMany({});
  const createdDeliveryRuns = await DeliveryRun.insertMany(deliveryRuns);
  console.log(`Created ${createdDeliveryRuns.length} delivery runs`);
  return createdDeliveryRuns;
}

async function seedShipments(orders, deliveryRuns) {
  console.log('Seeding shipments...');
  
  const shipments = [
    {
      orderId: orders[0]._id,
      deliveryRunId: deliveryRuns[0]._id,
      trackingNumber: 'TRK-001',
      status: 'delivered',
      shippedDate: new Date('2025-01-20'),
      deliveredDate: new Date('2025-01-20')
    },
    {
      orderId: orders[1]._id,
      deliveryRunId: deliveryRuns[1]._id,
      trackingNumber: 'TRK-002',
      status: 'out_for_delivery',
      shippedDate: new Date('2025-01-21')
    }
  ];

  await Shipment.deleteMany({});
  const createdShipments = await Shipment.insertMany(shipments);
  console.log(`Created ${createdShipments.length} shipments`);
  return createdShipments;
}

// Keep existing functions for attributes, promotions, and hubs
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
    console.log('Starting Comprehensive KeralGiftsOnline v3 database seeding...');

    // Seed in order with dependencies
    const roles = await seedRoles();
    const users = await seedUsers(roles);
    const categories = await seedCategories();
    const products = await seedProducts(categories);
    const attributes = await seedAttributes();
    const promotions = await seedPromotions();
    const hubs = await seedHubs();
    const orders = await seedOrders(users, products);
    const wishlists = await seedWishlists(users, products);
    const reviews = await seedReviews(users, products);
    const transactions = await seedTransactions(orders);
    const notifications = await seedNotifications(users);
    const activityLogs = await seedActivityLogs(users);
    const vendors = await seedVendors();
    const vendorProducts = await seedVendorProducts(vendors, products);
    const coupons = await seedCoupons();
    const supportTickets = await seedSupportTickets(users);
    const payouts = await seedPayouts(vendors);
    const ledgers = await seedLedgers(users);
    const dailyStats = await seedDailyStats();
    const pages = await seedPages();
    const deliveryRuns = await seedDeliveryRuns(hubs, users, orders);
    const shipments = await seedShipments(orders, deliveryRuns);

    console.log('Comprehensive seeding completed successfully!');
    console.log(`Created:`);
    console.log(`- ${roles.length} roles`);
    console.log(`- ${users.length} users`);
    console.log(`- ${categories.length} categories`);
    console.log(`- ${products.length} products`);
    console.log(`- ${attributes.length} attributes`);
    console.log(`- ${promotions.length} promotions`);
    console.log(`- ${hubs.length} hubs`);
    console.log(`- ${orders.length} orders`);
    console.log(`- ${wishlists.length} wishlist items`);
    console.log(`- ${reviews.length} reviews`);
    console.log(`- ${transactions.length} transactions`);
    console.log(`- ${notifications.length} notifications`);
    console.log(`- ${activityLogs.length} activity logs`);
    console.log(`- ${vendors.length} vendors`);
    console.log(`- ${vendorProducts.length} vendor products`);
    console.log(`- ${coupons.length} coupons`);
    console.log(`- ${supportTickets.length} support tickets`);
    console.log(`- ${payouts.length} payouts`);
    console.log(`- ${ledgers.length} ledger entries`);
    console.log(`- ${dailyStats.length} daily stats`);
    console.log(`- ${pages.length} pages`);
    console.log(`- ${deliveryRuns.length} delivery runs`);
    console.log(`- ${shipments.length} shipments`);

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
      console.log('Comprehensive seeder script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Comprehensive seeder script failed:', error);
      process.exit(1);
    });
}

module.exports = { runSeeder }; 