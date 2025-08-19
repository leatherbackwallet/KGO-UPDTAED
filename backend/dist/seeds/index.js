"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const roles_seed_1 = require("./roles.seed");
const users_seed_1 = require("./users.seed");
const categories_seed_1 = require("./categories.seed");
const products_seed_1 = require("./products.seed");
const vendors_seed_1 = require("./vendors.seed");
const vendorProducts_seed_1 = require("./vendorProducts.seed");
const vendorDocuments_seed_1 = require("./vendorDocuments.seed");
const coupons_seed_1 = require("./coupons.seed");
const orders_seed_1 = require("./orders.seed");
const reviews_seed_1 = require("./reviews.seed");
const transactions_seed_1 = require("./transactions.seed");
const payouts_seed_1 = require("./payouts.seed");
const ledger_seed_1 = require("./ledger.seed");
const wishlists_seed_1 = require("./wishlists.seed");
const notifications_seed_1 = require("./notifications.seed");
const supportTickets_seed_1 = require("./supportTickets.seed");
const pages_seed_1 = require("./pages.seed");
const activityLogs_seed_1 = require("./activityLogs.seed");
const dailyStats_seed_1 = require("./dailyStats.seed");
const hubs_seed_1 = require("./hubs.seed");
const deliveryRuns_seed_1 = require("./deliveryRuns.seed");
const returns_seed_1 = require("./returns.seed");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI;
async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is required');
        }
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log('\n📝 Seeding roles...');
        const roles = await (0, roles_seed_1.seedRoles)();
        console.log('\n📝 Seeding users...');
        const users = await (0, users_seed_1.seedUsers)();
        console.log('\n📝 Seeding categories...');
        const categories = await (0, categories_seed_1.seedCategories)();
        console.log('\n📝 Seeding products...');
        const products = await (0, products_seed_1.seedProducts)(categories);
        console.log('\n📝 Seeding vendors...');
        const vendors = await (0, vendors_seed_1.seedVendors)(users);
        console.log('\n📝 Seeding vendor products...');
        await (0, vendorProducts_seed_1.seedVendorProducts)(vendors, products);
        console.log('\n📝 Seeding vendor documents...');
        await (0, vendorDocuments_seed_1.seedVendorDocuments)(vendors);
        console.log('\n📝 Seeding coupons...');
        await (0, coupons_seed_1.seedCoupons)();
        console.log('\n📝 Seeding orders...');
        const orders = await (0, orders_seed_1.seedOrders)(users, products, vendors);
        console.log('\n📝 Seeding reviews...');
        await (0, reviews_seed_1.seedReviews)(users, orders, products, vendors);
        console.log('\n📝 Seeding transactions...');
        await (0, transactions_seed_1.seedTransactions)(orders, users);
        console.log('\n📝 Seeding payouts...');
        await (0, payouts_seed_1.seedPayouts)(vendors, orders);
        console.log('\n📝 Seeding ledger...');
        await (0, ledger_seed_1.seedLedger)(users, orders);
        console.log('\n📝 Seeding wishlists...');
        await (0, wishlists_seed_1.seedWishlists)(users, products);
        console.log('\n📝 Seeding notifications...');
        await (0, notifications_seed_1.seedNotifications)(users);
        console.log('\n📝 Seeding support tickets...');
        await (0, supportTickets_seed_1.seedSupportTickets)(users, orders);
        console.log('\n📝 Seeding pages...');
        await (0, pages_seed_1.seedPages)();
        console.log('\n📝 Seeding activity logs...');
        await (0, activityLogs_seed_1.seedActivityLogs)(users);
        console.log('\n📝 Seeding hubs...');
        const hubs = await (0, hubs_seed_1.seedHubs)();
        console.log('\n📝 Seeding delivery runs...');
        await (0, deliveryRuns_seed_1.seedDeliveryRuns)(users, hubs, orders);
        console.log('\n📝 Seeding returns...');
        await (0, returns_seed_1.seedReturns)();
        console.log('\n📝 Seeding daily stats...');
        await (0, dailyStats_seed_1.seedDailyStats)(products, vendors);
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📊 Seeding Summary:');
        console.log(`   - Roles: ${roles.length}`);
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Categories: ${categories.length}`);
        console.log(`   - Products: ${products.length}`);
        console.log(`   - Vendors: ${vendors.length}`);
        console.log(`   - Orders: ${orders.length}`);
        console.log(`   - Hubs: ${hubs.length}`);
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}
async function clearDatabase() {
    console.log('🗑️  Clearing existing data...');
    const collections = await mongoose_1.default.connection.db.collections();
    for (const collection of collections) {
        await collection.deleteMany({});
    }
    console.log('✅ Database cleared');
}
if (require.main === module) {
    seedDatabase();
}
//# sourceMappingURL=index.js.map