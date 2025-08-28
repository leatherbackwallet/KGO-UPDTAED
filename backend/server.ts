import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { User } from './models/users.model';
import { Role } from './models/roles.model';
import { hashPassword } from './utils/hash';
import { ensureProductImagesDir } from './utils/fileUpload';
const { generalLimiter, authLimiter, apiLimiter } = require('./middleware/rateLimit');
const { logger, errorLogger } = require('./middleware/logger');

dotenv.config();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type']
};

// Middleware
app.use(generalLimiter);
app.use(logger);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/images', express.static(path.join(__dirname, '../public/images'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 31536000 * 1000).toUTCString());
  }
}));

// Create default superuser if not exists
async function createSuperUser() {
  if (process.env.CREATE_SUPERUSER !== 'true') {
    console.log('Superuser creation skipped (CREATE_SUPERUSER not set to true)');
    return;
  }

  try {
    let adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'admin',
        description: 'System administrator with full access',
        permissions: ['*'],
        isActive: true
      });
      console.log('Admin role created');
    }

    const email = process.env.ADMIN_EMAIL || 'admin@keralagiftsonline.com';
    const password = process.env.ADMIN_PASSWORD || 'SuperSecure123!';
    const existing = await User.findOne({ email });
    
    if (!existing) {
      const hashed = await hashPassword(password);
      await User.create({ 
        firstName: 'Admin', 
        lastName: 'User', 
        email, 
        password: hashed, 
        roleId: adminRole._id, 
        phone: process.env.ADMIN_PHONE || '+49123456789' 
      });
      console.log('Superuser created:', email);
    } else {
      console.log('Superuser already exists:', email);
    }
  } catch (error) {
    console.error('Error creating superuser:', error);
  }
}

// Validate environment variables
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

if (!process.env.MONGODB_URI.includes('mongodb+srv://') || 
    !process.env.MONGODB_URI.includes('mongodb.net') ||
    process.env.MONGODB_URI.includes('localhost') ||
    process.env.MONGODB_URI.includes('127.0.0.1')) {
  console.error('❌ ERROR: MongoDB Atlas must be used. Local MongoDB is not allowed.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long for security');
  process.exit(1);
}

console.log('✅ Environment variables validated successfully');

// Connect to MongoDB (non-blocking for serverless)
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
}).then(async () => {
  console.log('MongoDB connected with connection pooling');
  
  // Skip directory creation in production (Vercel serverless environment)
  if (process.env.NODE_ENV !== 'production') {
    ensureProductImagesDir();
    console.log('Product images directory initialized');
  } else {
    console.log('Skipping local file system initialization in production');
  }
  
  await createSuperUser();
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  // Don't exit process in serverless environment
  if (process.env.NODE_ENV === 'production') {
    console.log('Continuing without MongoDB connection in production');
  }
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Import routes
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import ordersRoutes from './routes/orders';
import profileRoutes from './routes/profile';
import personalizationRoutes from './routes/personalization';
import analyticsRoutes from './routes/analytics';
import subscriptionRoutes from './routes/subscriptions';
import contentRoutes from './routes/content';

const productsRoutes = require('./routes/products');
import categoriesRoutes from './routes/categories';
const vendorsRoutes = require('./routes/vendors');
const usersRoutes = require('./routes/users');
const wishlistRoutes = require('./routes/wishlist');
const cartRoutes = require('./routes/cart');
const financeRoutes = require('./routes/finance');
const hubsRoutes = require('./routes/hubs');
const deliveryRunsRoutes = require('./routes/deliveryRuns');
const returnsRoutes = require('./routes/returns');
const healthRoutes = require('./routes/health');

// Simple health check (no dependencies)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Apply routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/upload', apiLimiter, uploadRoutes);
app.use('/api/profile', apiLimiter, profileRoutes);
app.use('/api/products', apiLimiter, productsRoutes);
app.use('/api/categories', apiLimiter, categoriesRoutes);
app.use('/api/vendors', apiLimiter, vendorsRoutes);
app.use('/api/orders', apiLimiter, ordersRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/wishlist', apiLimiter, wishlistRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);
app.use('/api/finance', apiLimiter, financeRoutes);
app.use('/api/hubs', apiLimiter, hubsRoutes);
app.use('/api/delivery-runs', apiLimiter, deliveryRunsRoutes);
app.use('/api/returns', apiLimiter, returnsRoutes);
app.use('/api/personalization', apiLimiter, personalizationRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/subscriptions', apiLimiter, subscriptionRoutes);
app.use('/api/content', apiLimiter, contentRoutes);

// Error logging middleware
app.use(errorLogger);

// Start server (only in development)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for Vercel serverless
export default app; 