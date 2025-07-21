"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPayouts = seedPayouts;
const payouts_model_1 = require("../models/payouts.model");
async function seedPayouts(vendors, orders) {
    try {
        const existing = await payouts_model_1.Payout.countDocuments();
        if (existing > 0) {
            console.log('   ⏭️  Payouts already exist, skipping...');
            return;
        }
        const payouts = vendors.map(vendor => ({
            vendorId: vendor._id,
            amount: Math.floor(Math.random() * 5000) + 1000,
            periodStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            periodEndDate: new Date(),
            orderIds: orders.map(o => o._id).slice(0, 2),
            status: payouts_model_1.PayoutStatus.COMPLETED,
            transactionReference: `PAY${Date.now()}${Math.random().toString(36).substr(2, 5)}`
        }));
        await payouts_model_1.Payout.insertMany(payouts);
        console.log(`   ✅ Created ${payouts.length} payouts`);
    }
    catch (error) {
        console.error('   ❌ Error seeding payouts:', error);
    }
}
//# sourceMappingURL=payouts.seed.js.map