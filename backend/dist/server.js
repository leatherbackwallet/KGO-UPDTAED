"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const users_model_1 = require("./models/users.model");
const roles_model_1 = require("./models/roles.model");
const hash_1 = require("./utils/hash");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
async function createSuperUser() {
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
        const email = 'admin@keralagiftsonline.com';
        const password = 'SuperSecure123!';
        const existing = await users_model_1.User.findOne({ email });
        if (!existing) {
            const hashed = await (0, hash_1.hashPassword)(password);
            await users_model_1.User.create({
                firstName: 'Admin',
                lastName: 'User',
                email,
                password: hashed,
                roleId: adminRole._id,
                phone: '+49123456789'
            });
            console.log('Superuser created:', email, 'password:', password);
        }
        else {
            console.log('Superuser already exists:', email);
        }
    }
    catch (error) {
        console.error('Error creating superuser:', error);
    }
}
mongoose_1.default.connect(process.env.MONGODB_URI).then(async () => {
    console.log('MongoDB connected');
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
app.use('/api/auth', auth_1.default);
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/hubs', require('./routes/hubs'));
app.use('/api/delivery-runs', require('./routes/deliveryRuns'));
app.use('/api/returns', require('./routes/returns'));
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//# sourceMappingURL=server.js.map