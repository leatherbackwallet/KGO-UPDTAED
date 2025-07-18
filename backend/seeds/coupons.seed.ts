/**
 * Coupons Seed - Sample promotional coupons
 */

import { Coupon, CouponType } from '../models/coupons.model';

export async function seedCoupons() {
  try {
    const existing = await Coupon.countDocuments();
    if (existing > 0) {
      console.log('   ⏭️  Coupons already exist, skipping...');
      return;
    }

    const coupons = [
      {
        code: 'WELCOME10',
        description: 'Welcome discount for new customers',
        type: CouponType.PERCENTAGE,
        value: 10,
        minOrderAmount: 500,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true
      },
      {
        code: 'SAVE50',
        description: 'Flat discount on orders above 1000',
        type: CouponType.FIXED_AMOUNT,
        value: 50,
        minOrderAmount: 1000,
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: true
      }
    ];

    await Coupon.insertMany(coupons);
    console.log(`   ✅ Created ${coupons.length} coupons`);
  } catch (error) {
    console.error('   ❌ Error seeding coupons:', error);
  }
} 