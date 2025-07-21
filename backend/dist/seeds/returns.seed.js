"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedReturns = void 0;
const returns_model_1 = require("../models/returns.model");
const orders_model_1 = require("../models/orders.model");
const users_model_1 = require("../models/users.model");
const products_model_1 = require("../models/products.model");
const returnReasons = [
    'Product damaged during delivery',
    'Wrong item received',
    'Product not as described',
    'Size/fit issues',
    'Quality not satisfactory',
    'Changed mind',
    'Duplicate order',
    'Product expired'
];
const returnStatuses = [
    'requested',
    'approved',
    'rejected',
    'shipped_by_customer',
    'received_at_hub',
    'completed'
];
const resolutions = [
    'refund',
    'replacement'
];
const seedReturns = async () => {
    try {
        console.log('🌱 Seeding returns...');
        const users = await users_model_1.User.find().limit(10);
        const orders = await orders_model_1.Order.find({ orderStatus: 'delivered' }).limit(20);
        const products = await products_model_1.Product.find().limit(15);
        if (users.length === 0 || orders.length === 0 || products.length === 0) {
            console.log('⚠️  Skipping returns seed - insufficient related data');
            return;
        }
        const returns = [];
        for (let i = 0; i < 15; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const randomOrder = orders[Math.floor(Math.random() * orders.length)];
            const randomStatus = returnStatuses[Math.floor(Math.random() * returnStatuses.length)];
            if (!randomUser || !randomOrder)
                continue;
            const randomProducts = products.slice(0, Math.floor(Math.random() * 3) + 1);
            const returnItem = {
                orderId: randomOrder._id,
                userId: randomUser._id,
                orderItems: randomProducts.map(product => ({
                    productId: product._id,
                    quantity: Math.floor(Math.random() * 2) + 1
                })),
                reason: returnReasons[Math.floor(Math.random() * returnReasons.length)],
                status: randomStatus,
                resolution: randomStatus === 'completed' ? resolutions[Math.floor(Math.random() * resolutions.length)] : undefined,
                notes: randomStatus === 'rejected' ? 'Return request rejected due to policy violation' :
                    randomStatus === 'completed' ? 'Return processed successfully' : undefined,
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                updatedAt: new Date()
            };
            returns.push(returnItem);
        }
        await returns_model_1.Return.deleteMany({});
        const createdReturns = await returns_model_1.Return.insertMany(returns);
        console.log(`✅ Seeded ${createdReturns.length} returns`);
        const statusCounts = await returns_model_1.Return.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        console.log('📊 Return status distribution:');
        statusCounts.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count}`);
        });
    }
    catch (error) {
        console.error('❌ Error seeding returns:', error);
        throw error;
    }
};
exports.seedReturns = seedReturns;
exports.default = exports.seedReturns;
//# sourceMappingURL=returns.seed.js.map