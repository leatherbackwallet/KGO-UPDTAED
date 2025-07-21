"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedCoupons = seedCoupons;
const coupons_model_1 = require("../models/coupons.model");
async function seedCoupons() {
    try {
        const existing = await coupons_model_1.Coupon.countDocuments();
        if (existing > 0) {
            console.log('   ⏭️  Coupons already exist, skipping...');
            return;
        }
        const coupons = [
            {
                code: 'WELCOME10',
                description: 'Welcome discount for new customers',
                type: coupons_model_1.CouponType.PERCENTAGE,
                value: 10,
                minOrderAmount: 500,
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                isActive: true
            },
            {
                code: 'SAVE50',
                description: 'Flat discount on orders above 1000',
                type: coupons_model_1.CouponType.FIXED_AMOUNT,
                value: 50,
                minOrderAmount: 1000,
                validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                isActive: true
            }
        ];
        await coupons_model_1.Coupon.insertMany(coupons);
        console.log(`   ✅ Created ${coupons.length} coupons`);
    }
    catch (error) {
        console.error('   ❌ Error seeding coupons:', error);
    }
}
//# sourceMappingURL=coupons.seed.js.map