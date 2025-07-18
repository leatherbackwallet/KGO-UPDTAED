require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB using the same connection as the main app
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/onYourBehlf';
mongoose.connect(MONGODB_URI);

// Define all schemas to match our TypeScript models
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['customer', 'vendor', 'admin', 'support_agent'] },
  phone: String,
  profileImage: String,
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  lastLoginAt: Date
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  description: String,
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  image: String,
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  defaultImage: String,
  images: [String],
  tags: [String],
  personalizationOptions: [{
    type: { type: String },
    label: String,
    required: { type: Boolean, default: false },
    options: [String]
  }],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

const vendorSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  storeName: { type: String, unique: true },
  description: String,
  status: { type: String, enum: ['active', 'inactive', 'pending_approval', 'rejected'] },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'India' }
  },
  serviceablePincodes: [String],
  averageRating: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const vendorProductSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  price: { type: Number, required: true },
  stockQuantity: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 24 }, // hours
  customizations: [{
    name: String,
    price: Number,
    isRequired: { type: Boolean, default: false }
  }]
}, { timestamps: true });

const vendorDocumentSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  type: { type: String, enum: ['business_license', 'food_license', 'gst_certificate', 'pan_card', 'aadhar_card'] },
  documentNumber: String,
  documentUrl: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'] },
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    vendorProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProduct' },
    quantity: Number,
    price: Number,
    customizations: [{
      name: String,
      price: Number
    }],
    personalization: {
      message: String,
      colors: [String],
      specialInstructions: String
    },
    status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] }
  }],
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'] },
  totalAmount: Number,
  taxAmount: Number,
  deliveryFee: Number,
  finalAmount: Number,
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'] },
  paymentMethod: String,
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    phone: String
  },
  deliveryDate: Date,
  deliveryTime: String,
  specialInstructions: String
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  rating: { type: Number, min: 1, max: 5 },
  title: String,
  comment: String,
  images: [String],
  isVerified: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 },
  replies: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const couponSchema = new mongoose.Schema({
  code: { type: String, unique: true, uppercase: true },
  name: String,
  description: String,
  type: { type: String, enum: ['percentage', 'fixed'] },
  value: Number,
  minOrderAmount: Number,
  maxDiscount: Number,
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  validFrom: Date,
  validUntil: Date,
  isActive: { type: Boolean, default: true },
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }]
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  type: { type: String, enum: ['payment', 'refund', 'payout'] },
  amount: Number,
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'] },
  paymentMethod: String,
  transactionId: String,
  gatewayResponse: Object,
  description: String
}, { timestamps: true });

const payoutSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  amount: Number,
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'] },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String
  },
  processedAt: Date,
  failureReason: String,
  relatedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }]
}, { timestamps: true });

const ledgerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['credit', 'debit'] },
  amount: Number,
  balance: Number,
  category: { type: String, enum: ['order', 'refund', 'coupon', 'delivery_fee', 'tax'] },
  description: String,
  relatedDocument: {
    type: { type: String, enum: ['order', 'transaction', 'payout'] },
    id: { type: mongoose.Schema.Types.ObjectId }
  }
}, { timestamps: true });

const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  addedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  message: String,
  type: { type: String, enum: ['order_update', 'promotion', 'system', 'payment'] },
  isRead: { type: Boolean, default: false },
  data: Object,
  readAt: Date
}, { timestamps: true });

const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  subject: String,
  description: String,
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'] },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'] },
  category: { type: String, enum: ['order_issue', 'payment_issue', 'delivery_issue', 'product_issue', 'general'] },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  conversation: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    attachments: [String],
    createdAt: { type: Date, default: Date.now }
  }],
  resolvedAt: Date,
  resolution: String
}, { timestamps: true });

const pageSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },
  content: String,
  metaTitle: String,
  metaDescription: String,
  status: { type: String, enum: ['draft', 'published', 'archived'] },
  publishedAt: Date,
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  target: {
    type: { type: String, enum: ['user', 'order', 'product', 'vendor'] },
    id: { type: mongoose.Schema.Types.ObjectId }
  },
  details: Object,
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

const dailyStatsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  totalCustomers: { type: Number, default: 0 },
  totalVendors: { type: Number, default: 0 },
  topSellingProducts: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    revenue: Number
  }],
  topPerformingVendors: [{
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    storeName: String,
    orders: Number,
    revenue: Number
  }],
  averageOrderValue: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 }
}, { timestamps: true });

// Create models
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Vendor = mongoose.model('Vendor', vendorSchema);
const VendorProduct = mongoose.model('VendorProduct', vendorProductSchema);
const VendorDocument = mongoose.model('VendorDocument', vendorDocumentSchema);
const Order = mongoose.model('Order', orderSchema);
const Review = mongoose.model('Review', reviewSchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Payout = mongoose.model('Payout', payoutSchema);
const Ledger = mongoose.model('Ledger', ledgerSchema);
const Wishlist = mongoose.model('Wishlist', wishlistSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
const Page = mongoose.model('Page', pageSchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
const DailyStats = mongoose.model('DailyStats', dailyStatsSchema);

async function seedDatabase() {
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    
    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Vendor.deleteMany({});
    await VendorProduct.deleteMany({});
    await VendorDocument.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await Coupon.deleteMany({});
    await Transaction.deleteMany({});
    await Payout.deleteMany({});
    await Ledger.deleteMany({});
    await Wishlist.deleteMany({});
    await Notification.deleteMany({});
    await SupportTicket.deleteMany({});
    await Page.deleteMany({});
    await ActivityLog.deleteMany({});
    await DailyStats.deleteMany({});
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
        phone: '+91-9876543210',
        emailVerified: true
      },
      {
        firstName: 'John',
        lastName: 'Customer',
        email: 'customer@example.com',
        password: hashedPassword,
        role: 'customer',
        phone: '+91-9876543211',
        emailVerified: true
      },
      {
        firstName: 'Sarah',
        lastName: 'Vendor',
        email: 'vendor@example.com',
        password: hashedPassword,
        role: 'vendor',
        phone: '+91-9876543212',
        emailVerified: true
      },
      {
        firstName: 'Mike',
        lastName: 'Support',
        email: 'support@onyourbehlf.com',
        password: hashedPassword,
        role: 'support_agent',
        phone: '+91-9876543213',
        emailVerified: true
      }
    ]);
    console.log(`✅ Created ${users.length} users`);
    
    // Create categories
    const categories = await Category.insertMany([
      {
        name: 'Celebration Cakes',
        slug: 'celebration-cakes',
        description: 'Perfect cakes for all your celebrations',
        image: '/images/categories/celebration-cakes.jpg'
      },
      {
        name: 'Wedding Cakes',
        slug: 'wedding-cakes',
        description: 'Elegant wedding cakes for your special day',
        image: '/images/categories/wedding-cakes.jpg'
      },
      {
        name: 'Birthday Cakes',
        slug: 'birthday-cakes',
        description: 'Colorful and fun birthday cakes',
        image: '/images/categories/birthday-cakes.jpg'
      },
      {
        name: 'Cupcakes',
        slug: 'cupcakes',
        description: 'Delicious cupcakes for any occasion',
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
        description: 'Creating sweet memories with every bite',
        status: 'active',
        address: {
          street: '123 Baker Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001'
        },
        serviceablePincodes: ['400001', '400002', '400003'],
        averageRating: 4.5,
        totalOrders: 25,
        isVerified: true
      }
    ]);
    console.log(`✅ Created ${vendors.length} vendors`);
    
    // Create vendor products
    const vendorProducts = await VendorProduct.insertMany([
      {
        vendorId: vendors[0]._id,
        productId: products[0]._id,
        price: 1200,
        stockQuantity: 10,
        preparationTime: 24,
        customizations: [
          { name: 'Extra Chocolate', price: 100, isRequired: false },
          { name: 'Premium Frosting', price: 150, isRequired: false }
        ]
      },
      {
        vendorId: vendors[0]._id,
        productId: products[1]._id,
        price: 3500,
        stockQuantity: 5,
        preparationTime: 48,
        customizations: [
          { name: 'Gold Leaf Decoration', price: 300, isRequired: false },
          { name: 'Fresh Flowers', price: 200, isRequired: false }
        ]
      }
    ]);
    console.log(`✅ Created ${vendorProducts.length} vendor products`);
    
    // Create vendor documents
    const vendorDocuments = await VendorDocument.insertMany([
      {
        vendorId: vendors[0]._id,
        type: 'business_license',
        documentNumber: 'BL123456789',
        documentUrl: '/documents/business_license.pdf',
        status: 'approved',
        verifiedAt: new Date(),
        verifiedBy: users.find(u => u.role === 'admin')._id
      },
      {
        vendorId: vendors[0]._id,
        type: 'food_license',
        documentNumber: 'FL987654321',
        documentUrl: '/documents/food_license.pdf',
        status: 'approved',
        verifiedAt: new Date(),
        verifiedBy: users.find(u => u.role === 'admin')._id
      }
    ]);
    console.log(`✅ Created ${vendorDocuments.length} vendor documents`);
    
    // Create coupons
    const coupons = await Coupon.insertMany([
      {
        code: 'WELCOME10',
        name: 'Welcome Discount',
        description: 'Get 10% off on your first order',
        type: 'percentage',
        value: 10,
        minOrderAmount: 500,
        maxDiscount: 200,
        usageLimit: 100,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        applicableCategories: [categories[0]._id, categories[2]._id]
      },
      {
        code: 'FREEDELIVERY',
        name: 'Free Delivery',
        description: 'Free delivery on orders above ₹1000',
        type: 'fixed',
        value: 100,
        minOrderAmount: 1000,
        maxDiscount: 100,
        usageLimit: 50,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days
      }
    ]);
    console.log(`✅ Created ${coupons.length} coupons`);
    
    // Create pages
    const pages = await Page.insertMany([
      {
        title: 'About Us',
        slug: 'about-us',
        content: 'We are a leading cake marketplace connecting customers with talented bakers.',
        metaTitle: 'About OnYourBehlf - Cake Marketplace',
        metaDescription: 'Learn about OnYourBehlf, your trusted cake marketplace.',
        status: 'published',
        publishedAt: new Date(),
        authorId: users.find(u => u.role === 'admin')._id
      },
      {
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        content: 'Your privacy is important to us. This policy explains how we collect and use your information.',
        metaTitle: 'Privacy Policy - OnYourBehlf',
        metaDescription: 'Read our privacy policy to understand how we protect your data.',
        status: 'published',
        publishedAt: new Date(),
        authorId: users.find(u => u.role === 'admin')._id
      }
    ]);
    console.log(`✅ Created ${pages.length} pages`);
    
    // Create notifications
    const notifications = await Notification.insertMany([
      {
        userId: users.find(u => u.role === 'customer')._id,
        title: 'Welcome to OnYourBehlf!',
        message: 'Thank you for joining our cake marketplace. Start exploring delicious cakes!',
        type: 'system',
        data: { action: 'welcome' }
      },
      {
        userId: users.find(u => u.role === 'vendor')._id,
        title: 'Account Verified',
        message: 'Congratulations! Your vendor account has been verified.',
        type: 'system',
        data: { action: 'verification' }
      }
    ]);
    console.log(`✅ Created ${notifications.length} notifications`);
    
    // Create activity logs
    const activityLogs = await ActivityLog.insertMany([
      {
        userId: users.find(u => u.role === 'admin')._id,
        action: 'user_registered',
        target: {
          type: 'user',
          id: users.find(u => u.role === 'customer')._id
        },
        details: { email: 'customer@example.com' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      {
        userId: users.find(u => u.role === 'admin')._id,
        action: 'vendor_verified',
        target: {
          type: 'vendor',
          id: vendors[0]._id
        },
        details: { storeName: 'Sweet Dreams Bakery' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      }
    ]);
    console.log(`✅ Created ${activityLogs.length} activity logs`);
    
    // Create daily stats
    const dailyStats = await DailyStats.insertMany([
      {
        date: new Date(),
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 1,
        totalVendors: 1,
        averageOrderValue: 0,
        conversionRate: 0
      }
    ]);
    console.log(`✅ Created ${dailyStats.length} daily stats`);
    
    console.log('\n🎉 Comprehensive database seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Vendors: ${vendors.length}`);
    console.log(`   - Vendor Products: ${vendorProducts.length}`);
    console.log(`   - Vendor Documents: ${vendorDocuments.length}`);
    console.log(`   - Coupons: ${coupons.length}`);
    console.log(`   - Pages: ${pages.length}`);
    console.log(`   - Notifications: ${notifications.length}`);
    console.log(`   - Activity Logs: ${activityLogs.length}`);
    console.log(`   - Daily Stats: ${dailyStats.length}`);
    
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