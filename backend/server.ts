import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { User } from './models/users.model';
import { Role } from './models/roles.model';
import { Category } from './models/categories.model';
import { hashPassword } from './utils/hash';
import { initializeGridFS, getImageStream, getImageMetadata } from './utils/gridfs';
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
    'http://localhost:3003',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type']
};

// Apply rate limiting (disabled in development)
if (process.env.NODE_ENV === 'production') {
  app.use(generalLimiter);
}

// Apply logging
app.use(logger);

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory (for legacy images) with caching
app.use('/images', express.static(path.join(__dirname, '../public/images'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    res.setHeader('Expires', new Date(Date.now() + 31536000 * 1000).toUTCString());
  }
}));

// Create default superuser if not exists
async function createSuperUser() {
  try {
    // First, ensure we have an admin role
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

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

// Connect to MongoDB with connection pooling
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
}).then(async () => {
  console.log('MongoDB connected with connection pooling');
  
  // Initialize GridFS for image storage
  initializeGridFS();
  console.log('GridFS initialized for product images');
  
  await createSuperUser();
})
  .catch((err) => console.error('MongoDB connection error:', err));

// GridFS image serving route with caching
app.get('/api/images/:fileId', async (req, res): Promise<void> => {
  try {
    const { fileId } = req.params;
    
    if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
      res.status(400).json({ success: false, error: 'Invalid file ID' });
      return;
    }

    // Get image metadata for ETag generation
    const metadata = await getImageMetadata(fileId);
    if (!metadata) {
      res.status(404).json({ success: false, error: 'Image not found' });
      return;
    }

    // Generate ETag from file ID and last modified date
    const etag = `"${fileId}-${metadata.uploadDate.getTime()}"`;
    
    // Check if client has cached version
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end(); // Not Modified
      return;
    }

    const stream = getImageStream(fileId);
    
    // Set comprehensive cache headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    res.setHeader('Expires', new Date(Date.now() + 31536000 * 1000).toUTCString());
    res.setHeader('Last-Modified', metadata.uploadDate.toUTCString());
    
    // Set content type
    const contentType = metadata.contentType || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    
    stream.on('error', (error) => {
      console.error('Error streaming image:', error);
      if (!res.headersSent) {
        res.status(404).json({ success: false, error: 'Image not found' });
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error('Error serving image:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

// Helper function to determine content type from stream metadata
function getContentTypeFromStream(stream: any): string | null {
  try {
    // Try to get content type from stream metadata
    if (stream.options && stream.options.contentType) {
      return stream.options.contentType;
    }
    
    // Try to get from file metadata
    if (stream.file && stream.file.contentType) {
      return stream.file.contentType;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting content type:', error);
    return null;
  }
}

// Add error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Routes with rate limiting
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import ordersRoutes from './routes/orders';
import profileRoutes from './routes/profile';

// Strategic Enhancement Routes
import personalizationRoutes from './routes/personalization';
import analyticsRoutes from './routes/analytics';
import subscriptionRoutes from './routes/subscriptions';
import contentRoutes from './routes/content';

// Import other routes
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const vendorsRoutes = require('./routes/vendors');
const usersRoutes = require('./routes/users');
const wishlistRoutes = require('./routes/wishlist');
const cartRoutes = require('./routes/cart');
const financeRoutes = require('./routes/finance');
const hubsRoutes = require('./routes/hubs');
const deliveryRunsRoutes = require('./routes/deliveryRuns');
const returnsRoutes = require('./routes/returns');
const healthRoutes = require('./routes/health');

// Apply specific rate limiting to routes (disabled in development)
if (process.env.NODE_ENV === 'production') {
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
  app.use('/api/health', healthRoutes);
  app.use('/api/personalization', apiLimiter, personalizationRoutes);
  app.use('/api/analytics', apiLimiter, analyticsRoutes);
  app.use('/api/subscriptions', apiLimiter, subscriptionRoutes);
  app.use('/api/content', apiLimiter, contentRoutes);
} else {
  // Development mode - no rate limiting
  app.use('/api/auth', authRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/vendors', vendorsRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/finance', financeRoutes);
  app.use('/api/hubs', hubsRoutes);
  app.use('/api/delivery-runs', deliveryRunsRoutes);
  app.use('/api/returns', returnsRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/personalization', personalizationRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/content', contentRoutes);
}

// Apply error logging middleware
app.use(errorLogger);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 