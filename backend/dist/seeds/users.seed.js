"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedUsers = seedUsers;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const users_model_1 = require("../models/users.model");
const roles_model_1 = require("../models/roles.model");
async function seedUsers() {
    try {
        const existingUsers = await users_model_1.User.countDocuments();
        if (existingUsers > 0) {
            console.log('   ⏭️  Users already exist, skipping...');
            return await users_model_1.User.find();
        }
        const adminRole = await roles_model_1.Role.findOne({ name: 'admin' });
        const customerRole = await roles_model_1.Role.findOne({ name: 'customer' });
        const vendorRole = await roles_model_1.Role.findOne({ name: 'vendor' });
        const supportRole = await roles_model_1.Role.findOne({ name: 'support_agent' });
        const deliveryRole = await roles_model_1.Role.findOne({ name: 'delivery_agent' });
        if (!adminRole || !customerRole || !vendorRole || !supportRole || !deliveryRole) {
            throw new Error('Required roles not found. Please seed roles first.');
        }
        const hashedPassword = await bcryptjs_1.default.hash('password123', 12);
        const users = [
            {
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@keralagiftsonline.com',
                password: hashedPassword,
                roleId: adminRole._id,
                phone: '+91-9876543210'
            },
            {
                firstName: 'John',
                lastName: 'Customer',
                email: 'customer@example.com',
                password: hashedPassword,
                roleId: customerRole._id,
                phone: '+91-9876543211'
            },
            {
                firstName: 'Sarah',
                lastName: 'Vendor',
                email: 'vendor@example.com',
                password: hashedPassword,
                roleId: vendorRole._id,
                phone: '+91-9876543212'
            },
            {
                firstName: 'Mike',
                lastName: 'Support',
                email: 'support@keralagiftsonline.com',
                password: hashedPassword,
                roleId: supportRole._id,
                phone: '+91-9876543213'
            },
            {
                firstName: 'Emma',
                lastName: 'Wilson',
                email: 'emma@example.com',
                password: hashedPassword,
                roleId: customerRole._id,
                phone: '+91-9876543214'
            },
            {
                firstName: 'David',
                lastName: 'Brown',
                email: 'david@example.com',
                password: hashedPassword,
                roleId: customerRole._id,
                phone: '+91-9876543215'
            },
            {
                firstName: 'Priya',
                lastName: 'Sharma',
                email: 'priya@vendor.com',
                password: hashedPassword,
                roleId: vendorRole._id,
                phone: '+91-9876543216'
            },
            {
                firstName: 'Raj',
                lastName: 'Kumar',
                email: 'raj@vendor.com',
                password: hashedPassword,
                roleId: vendorRole._id,
                phone: '+91-9876543217'
            },
            {
                firstName: 'Alex',
                lastName: 'Delivery',
                email: 'alex@delivery.com',
                password: hashedPassword,
                roleId: deliveryRole._id,
                phone: '+49-1234567890'
            },
            {
                firstName: 'Maria',
                lastName: 'Logistics',
                email: 'maria@delivery.com',
                password: hashedPassword,
                roleId: deliveryRole._id,
                phone: '+49-1234567891'
            }
        ];
        const createdUsers = await users_model_1.User.insertMany(users);
        console.log(`   ✅ Created ${createdUsers.length} users`);
        createdUsers.forEach(user => {
            console.log(`      - ${user.email} (${user.firstName} ${user.lastName})`);
        });
        return createdUsers;
    }
    catch (error) {
        console.error('   ❌ Error seeding users:', error);
        throw error;
    }
}
//# sourceMappingURL=users.seed.js.map