import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { User } from './models/users.model';
import { Role } from './models/roles.model';
import { hashPassword } from './utils/hash';
import { ensureProductImagesDir } from './utils/fileUpload';
import { connectToDatabase } from './utils/database';
import { generalLimiter, authLimiter, apiLimiter } from './middleware/rateLimit';
import { logger, errorLogger } from './middleware/logger';

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy for production environments
app.set('trust proxy', 1);

// CORS Configuration - Enhanced for production reliability
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'https://onyourbehlf.uc.r.appspot.com',
      'https://keralagiftsonline.in',
      'https://www.keralagiftsonline.in'
    ];
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS: Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Cache-Control',
    'Pragma',
    'Expires'
  ],
  exposedHeaders: [
    'Content-Length', 
    'Content-Type',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  preflightContinue: false,
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware - MUST be before rate limiting
app.use(cors(corsOptions));

// Middleware
app.use(generalLimiter as any);
app.use(logger);
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

// Initialize database connection (non-blocking for serverless)
connectToDatabase().then(async () => {
  console.log('MongoDB connected with connection pooling');
  
  // Skip directory creation in production environments
  if (process.env.NODE_ENV !== 'production') {
    ensureProductImagesDir();
    console.log('Product images directory initialized');
  } else {
    console.log('Skipping local file system initialization in production');
  }
  
  await createSuperUser();
  
  // Initialize cache warming for frequently accessed data
  try {
    const { scheduleWarmCache } = await import('./middleware/cache');
    scheduleWarmCache();
    console.log('Cache warming scheduled');
  } catch (error) {
    console.log('Cache warming is disabled');
  }
}).catch((err: Error) => {
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

import productsRoutes from './routes/products';
import categoriesRoutes from './routes/categories';
import vendorsRoutes from './routes/vendors';
import usersRoutes from './routes/users';
import wishlistRoutes from './routes/wishlist';
import cartRoutes from './routes/cart';
import financeRoutes from './routes/finance';
import hubsRoutes from './routes/hubs';
import deliveryRunsRoutes from './routes/deliveryRuns';
import returnsRoutes from './routes/returns';
import healthRoutes from './routes/health';
import imagesRoutes from './routes/images';
import featureFlagsRoutes from './routes/featureFlags';
import monitoringRoutes from './routes/monitoring';
import occasionsRoutes from './routes/occasions';
import occasionsSeedRoutes from './routes/occasions-seed';
import paymentRoutes from './routes/payments';
import notificationRoutes from './routes/notifications';

// Apply health routes first
app.use('/api/health', apiLimiter as any, healthRoutes);

// Enhanced health check with database status (backup endpoint)
app.get('/api/health-status', async (req, res) => {
  try {
    const dbStatus = await connectToDatabase().then(() => 'connected').catch(() => 'disconnected');
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      version: '3.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'error',
      error: 'Database connection failed'
    });
  }
});

// CORS test endpoint for debugging
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS test successful',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    method: req.method,
    headers: {
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent'],
      'access-control-request-method': req.headers['access-control-request-method']
    }
  });
});

// Apply routes
app.use('/api/auth', authLimiter as any, authRoutes);
app.use('/api/upload', apiLimiter as any, uploadRoutes);
app.use('/api/profile', apiLimiter as any, profileRoutes);
app.use('/api/products', apiLimiter as any, productsRoutes);
app.use('/api/categories', apiLimiter as any, categoriesRoutes);
app.use('/api/vendors', apiLimiter as any, vendorsRoutes);
app.use('/api/orders', apiLimiter as any, ordersRoutes);
app.use('/api/payments', apiLimiter as any, paymentRoutes);
app.use('/api/users', apiLimiter as any, usersRoutes);
app.use('/api/wishlist', apiLimiter as any, wishlistRoutes);
app.use('/api/cart', apiLimiter as any, cartRoutes);
app.use('/api/finance', apiLimiter as any, financeRoutes);
app.use('/api/hubs', apiLimiter as any, hubsRoutes);
app.use('/api/delivery-runs', apiLimiter as any, deliveryRunsRoutes);
app.use('/api/returns', apiLimiter as any, returnsRoutes);
app.use('/api/personalization', apiLimiter as any, personalizationRoutes);
app.use('/api/analytics', apiLimiter as any, analyticsRoutes);
app.use('/api/subscriptions', apiLimiter as any, subscriptionRoutes);
app.use('/api/content', apiLimiter as any, contentRoutes);
app.use('/api/images', apiLimiter as any, imagesRoutes);
app.use('/api/feature-flags', apiLimiter as any, featureFlagsRoutes);
app.use('/api/monitoring', apiLimiter as any, monitoringRoutes);
app.use('/api/occasions', apiLimiter as any, occasionsRoutes);
app.use('/api/occasions', apiLimiter as any, occasionsSeedRoutes);
app.use('/api/notifications', apiLimiter as any, notificationRoutes);

// CORS error handler middleware
app.use((err: any, req: any, res: any, next: any) => {
  if (err.message === 'Not allowed by CORS') {
    console.log('CORS Error:', {
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent']
    });
    
    // Still send CORS headers even for rejected origins
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, Expires');
    
    return res.status(403).json({
      success: false,
      error: {
        message: 'CORS policy violation',
        code: 'CORS_ERROR'
      }
    });
  }
  next(err);
});

// Error logging middleware
app.use(errorLogger);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export for serverless environments
export default app; 