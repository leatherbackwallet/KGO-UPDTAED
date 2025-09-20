"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const users_model_1 = require("./models/users.model");
const roles_model_1 = require("./models/roles.model");
const hash_1 = require("./utils/hash");
const fileUpload_1 = require("./utils/fileUpload");
const database_1 = require("./utils/database");
const rateLimit_1 = require("./middleware/rateLimit");
const logger_1 = require("./middleware/logger");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.CORS_ORIGIN || 'http://localhost:3000',
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3003',
            'https://onyourbehlf.uc.r.appspot.com',
            'https://keralgiftsonline.in',
            'https://keralagiftsonline.in',
            'https://www.keralgiftsonline.in',
            'https://www.keralagiftsonline.in',
            'https://keralagiftsonline.in',
            'https://www.keralagiftsonline.in'
        ];
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            console.log('CORS: Origin not allowed:', origin);
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'Content-Type']
};
// Trust proxy for production environments
app.set('trust proxy', 1);
// Middleware
app.use(rateLimit_1.generalLimiter);
app.use(logger_1.logger);
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Serve static files
app.use('/images', express_1.default.static(path_1.default.join(__dirname, '../public/images'), {
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
        let adminRole = await roles_model_1.Role.findOne({ name: 'admin' });
        if (!adminRole) {
            adminRole = await roles_model_1.Role.create({
                name: 'admin',
                description: 'System administrator with full access',
                permissions: ['*'],
                isActive: true
            });
            console.log('Admin role created');
        }
        const email = process.env.ADMIN_EMAIL || 'admin@keralagiftsonline.com';
        const password = process.env.ADMIN_PASSWORD || 'SuperSecure123!';
        const existing = await users_model_1.User.findOne({ email });
        if (!existing) {
            const hashed = await (0, hash_1.hashPassword)(password);
            await users_model_1.User.create({
                firstName: 'Admin',
                lastName: 'User',
                email,
                password: hashed,
                roleId: adminRole._id,
                phone: process.env.ADMIN_PHONE || '+49123456789'
            });
            console.log('Superuser created:', email);
        }
        else {
            console.log('Superuser already exists:', email);
        }
    }
    catch (error) {
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
(0, database_1.connectToDatabase)().then(async () => {
    console.log('MongoDB connected with connection pooling');
    // Skip directory creation in production environments
    if (process.env.NODE_ENV !== 'production') {
        (0, fileUpload_1.ensureProductImagesDir)();
        console.log('Product images directory initialized');
    }
    else {
        console.log('Skipping local file system initialization in production');
    }
    await createSuperUser();
    // Initialize cache warming for frequently accessed data
    try {
        const { scheduleWarmCache } = await Promise.resolve().then(() => __importStar(require('./middleware/cache')));
        scheduleWarmCache();
        console.log('Cache warming scheduled');
    }
    catch (error) {
        console.log('Cache warming is disabled');
    }
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
const auth_1 = __importDefault(require("./routes/auth"));
const upload_1 = __importDefault(require("./routes/upload"));
const orders_1 = __importDefault(require("./routes/orders"));
const profile_1 = __importDefault(require("./routes/profile"));
const personalization_1 = __importDefault(require("./routes/personalization"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const content_1 = __importDefault(require("./routes/content"));
const products_1 = __importDefault(require("./routes/products"));
const categories_1 = __importDefault(require("./routes/categories"));
const vendors_1 = __importDefault(require("./routes/vendors"));
const users_1 = __importDefault(require("./routes/users"));
const wishlist_1 = __importDefault(require("./routes/wishlist"));
const cart_1 = __importDefault(require("./routes/cart"));
const finance_1 = __importDefault(require("./routes/finance"));
const hubs_1 = __importDefault(require("./routes/hubs"));
const deliveryRuns_1 = __importDefault(require("./routes/deliveryRuns"));
const returns_1 = __importDefault(require("./routes/returns"));
const health_1 = __importDefault(require("./routes/health"));
const images_1 = __importDefault(require("./routes/images"));
const featureFlags_1 = __importDefault(require("./routes/featureFlags"));
const monitoring_1 = __importDefault(require("./routes/monitoring"));
const occasions_1 = __importDefault(require("./routes/occasions"));
const occasions_seed_1 = __importDefault(require("./routes/occasions-seed"));
const payments_1 = __importDefault(require("./routes/payments"));
// Apply health routes first
app.use('/api/health', rateLimit_1.apiLimiter, health_1.default);
// Enhanced health check with database status (backup endpoint)
app.get('/api/health-status', async (req, res) => {
    try {
        const dbStatus = await (0, database_1.connectToDatabase)().then(() => 'connected').catch(() => 'disconnected');
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: dbStatus,
            version: '3.0.0'
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: 'error',
            error: 'Database connection failed'
        });
    }
});
// Apply routes
app.use('/api/auth', rateLimit_1.authLimiter, auth_1.default);
app.use('/api/upload', rateLimit_1.apiLimiter, upload_1.default);
app.use('/api/profile', rateLimit_1.apiLimiter, profile_1.default);
app.use('/api/products', rateLimit_1.apiLimiter, products_1.default);
app.use('/api/categories', rateLimit_1.apiLimiter, categories_1.default);
app.use('/api/vendors', rateLimit_1.apiLimiter, vendors_1.default);
app.use('/api/orders', rateLimit_1.apiLimiter, orders_1.default);
app.use('/api/payments', rateLimit_1.apiLimiter, payments_1.default);
app.use('/api/users', rateLimit_1.apiLimiter, users_1.default);
app.use('/api/wishlist', rateLimit_1.apiLimiter, wishlist_1.default);
app.use('/api/cart', rateLimit_1.apiLimiter, cart_1.default);
app.use('/api/finance', rateLimit_1.apiLimiter, finance_1.default);
app.use('/api/hubs', rateLimit_1.apiLimiter, hubs_1.default);
app.use('/api/delivery-runs', rateLimit_1.apiLimiter, deliveryRuns_1.default);
app.use('/api/returns', rateLimit_1.apiLimiter, returns_1.default);
app.use('/api/personalization', rateLimit_1.apiLimiter, personalization_1.default);
app.use('/api/analytics', rateLimit_1.apiLimiter, analytics_1.default);
app.use('/api/subscriptions', rateLimit_1.apiLimiter, subscriptions_1.default);
app.use('/api/content', rateLimit_1.apiLimiter, content_1.default);
app.use('/api/images', rateLimit_1.apiLimiter, images_1.default);
app.use('/api/feature-flags', rateLimit_1.apiLimiter, featureFlags_1.default);
app.use('/api/monitoring', rateLimit_1.apiLimiter, monitoring_1.default);
app.use('/api/occasions', rateLimit_1.apiLimiter, occasions_1.default);
app.use('/api/occasions', rateLimit_1.apiLimiter, occasions_seed_1.default);
// Error logging middleware
app.use(logger_1.errorLogger);
// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
// Export for serverless environments
exports.default = app;
