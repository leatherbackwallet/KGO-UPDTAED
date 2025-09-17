"use strict";
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
const { generalLimiter, authLimiter, apiLimiter } = require('./middleware/rateLimit');
const { logger, errorLogger } = require('./middleware/logger');
dotenv_1.default.config();
const app = (0, express_1.default)();
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
            'https://www.keralgiftsonline.in'
        ];
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
app.set('trust proxy', 1);
app.use(generalLimiter);
app.use(logger);
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
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
(0, database_1.connectToDatabase)().then(async () => {
    console.log('MongoDB connected with connection pooling');
    if (process.env.NODE_ENV !== 'production') {
        (0, fileUpload_1.ensureProductImagesDir)();
        console.log('Product images directory initialized');
    }
    else {
        console.log('Skipping local file system initialization in production');
    }
    await createSuperUser();
    try {
        const { scheduleWarmCache } = require('./middleware/cache');
        scheduleWarmCache();
        console.log('Cache warming scheduled');
    }
    catch (error) {
        console.log('Cache warming is disabled');
    }
}).catch((err) => {
    console.error('MongoDB connection error:', err);
    if (process.env.NODE_ENV === 'production') {
        console.log('Continuing without MongoDB connection in production');
    }
});
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
const auth_1 = __importDefault(require("./routes/auth"));
const upload_1 = __importDefault(require("./routes/upload"));
const orders_1 = __importDefault(require("./routes/orders"));
const profile_1 = __importDefault(require("./routes/profile"));
const personalization_1 = __importDefault(require("./routes/personalization"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const content_1 = __importDefault(require("./routes/content"));
const productsRoutes = require('./routes/products');
const categories_1 = __importDefault(require("./routes/categories"));
const vendorsRoutes = require('./routes/vendors');
const usersRoutes = require('./routes/users');
const wishlistRoutes = require('./routes/wishlist');
const cartRoutes = require('./routes/cart');
const financeRoutes = require('./routes/finance');
const hubsRoutes = require('./routes/hubs');
const deliveryRunsRoutes = require('./routes/deliveryRuns');
const returnsRoutes = require('./routes/returns');
const healthRoutes = require('./routes/health');
const imagesRoutes = require('./routes/images');
const featureFlagsRoutes = require('./routes/featureFlags');
const monitoringRoutes = require('./routes/monitoring');
const payments_1 = __importDefault(require("./routes/payments"));
app.use('/api/health', apiLimiter, healthRoutes);
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
app.use('/api/auth', authLimiter, auth_1.default);
app.use('/api/upload', apiLimiter, upload_1.default);
app.use('/api/profile', apiLimiter, profile_1.default);
app.use('/api/products', apiLimiter, productsRoutes);
app.use('/api/categories', apiLimiter, categories_1.default);
app.use('/api/vendors', apiLimiter, vendorsRoutes);
app.use('/api/orders', apiLimiter, orders_1.default);
app.use('/api/payments', apiLimiter, payments_1.default);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/wishlist', apiLimiter, wishlistRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);
app.use('/api/finance', apiLimiter, financeRoutes);
app.use('/api/hubs', apiLimiter, hubsRoutes);
app.use('/api/delivery-runs', apiLimiter, deliveryRunsRoutes);
app.use('/api/returns', apiLimiter, returnsRoutes);
app.use('/api/personalization', apiLimiter, personalization_1.default);
app.use('/api/analytics', apiLimiter, analytics_1.default);
app.use('/api/subscriptions', apiLimiter, subscriptions_1.default);
app.use('/api/content', apiLimiter, content_1.default);
app.use('/api/images', apiLimiter, imagesRoutes);
app.use('/api/feature-flags', apiLimiter, featureFlagsRoutes);
app.use('/api/monitoring', apiLimiter, monitoringRoutes);
app.use(errorLogger);
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map