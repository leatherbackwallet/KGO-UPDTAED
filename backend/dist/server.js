"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const users_model_1 = require("./models/users.model");
const roles_model_1 = require("./models/roles.model");
const hash_1 = require("./utils/hash");
const fileUpload_1 = require("./utils/fileUpload");
const { generalLimiter, authLimiter, apiLimiter } = require('./middleware/rateLimit');
const { logger, errorLogger } = require('./middleware/logger');
dotenv_1.default.config();
const app = (0, express_1.default)();
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
if (process.env.NODE_ENV === 'production') {
    app.use(generalLimiter);
}
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
        else {
            console.log('Admin role already exists');
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
    console.error('❌ Current URI:', process.env.MONGODB_URI);
    console.error('✅ Expected format: mongodb+srv://username:password@cluster.mongodb.net/database');
    console.error('✅ Correct URI: mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/?retryWrites=true&w=majority&appName=KeralaGiftsOnline');
    process.exit(1);
}
const correctUri = 'mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/?retryWrites=true&w=majority&appName=KeralaGiftsOnline';
if (!process.env.MONGODB_URI.includes('castlebek') ||
    !process.env.MONGODB_URI.includes('keralagiftsonline.7oukp55.mongodb.net')) {
    console.error('❌ ERROR: Incorrect MongoDB Atlas URI detected!');
    console.error('❌ Current URI:', process.env.MONGODB_URI);
    console.error('✅ Correct URI:', correctUri);
    console.error('🔧 Please update your .env file with the correct URI');
    process.exit(1);
}
console.log('✅ MongoDB Atlas URI validated successfully');
console.log('✅ Connecting to: keralagiftsonline.7oukp55.mongodb.net');
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET environment variable is required');
    process.exit(1);
}
mongoose_1.default.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
}).then(async () => {
    console.log('MongoDB connected with connection pooling');
    (0, fileUpload_1.ensureProductImagesDir)();
    console.log('Product images directory initialized');
    await createSuperUser();
})
    .catch((err) => console.error('MongoDB connection error:', err));
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
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
if (process.env.NODE_ENV === 'production') {
    app.use('/api/auth', authLimiter, auth_1.default);
    app.use('/api/upload', apiLimiter, upload_1.default);
    app.use('/api/profile', apiLimiter, profile_1.default);
    app.use('/api/products', apiLimiter, productsRoutes);
    app.use('/api/categories', apiLimiter, categoriesRoutes);
    app.use('/api/vendors', apiLimiter, vendorsRoutes);
    app.use('/api/orders', apiLimiter, orders_1.default);
    app.use('/api/users', apiLimiter, usersRoutes);
    app.use('/api/wishlist', apiLimiter, wishlistRoutes);
    app.use('/api/cart', apiLimiter, cartRoutes);
    app.use('/api/finance', apiLimiter, financeRoutes);
    app.use('/api/hubs', apiLimiter, hubsRoutes);
    app.use('/api/delivery-runs', apiLimiter, deliveryRunsRoutes);
    app.use('/api/returns', apiLimiter, returnsRoutes);
    app.use('/api/health', healthRoutes);
    app.use('/api/personalization', apiLimiter, personalization_1.default);
    app.use('/api/analytics', apiLimiter, analytics_1.default);
    app.use('/api/subscriptions', apiLimiter, subscriptions_1.default);
    app.use('/api/content', apiLimiter, content_1.default);
}
else {
    app.use('/api/auth', auth_1.default);
    app.use('/api/upload', upload_1.default);
    app.use('/api/profile', profile_1.default);
    app.use('/api/products', productsRoutes);
    app.use('/api/categories', categoriesRoutes);
    app.use('/api/vendors', vendorsRoutes);
    app.use('/api/orders', orders_1.default);
    app.use('/api/users', usersRoutes);
    app.use('/api/wishlist', wishlistRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/finance', financeRoutes);
    app.use('/api/hubs', hubsRoutes);
    app.use('/api/delivery-runs', deliveryRunsRoutes);
    app.use('/api/returns', returnsRoutes);
    app.use('/api/health', healthRoutes);
    app.use('/api/personalization', personalization_1.default);
    app.use('/api/analytics', analytics_1.default);
    app.use('/api/subscriptions', subscriptions_1.default);
    app.use('/api/content', content_1.default);
}
app.use(errorLogger);
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//# sourceMappingURL=server.js.map