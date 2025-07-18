/**
 * Payouts Seed - Sample vendor payouts
 */

import { Payout, PayoutStatus } from '../models/payouts.model';

export async function seedPayouts(vendors: any[], orders: any[]) {
  try {
    const existing = await Payout.countDocuments();
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
      status: PayoutStatus.COMPLETED,
      transactionReference: `PAY${Date.now()}${Math.random().toString(36).substr(2, 5)}`
    }));

    await Payout.insertMany(payouts);
    console.log(`   ✅ Created ${payouts.length} payouts`);
  } catch (error) {
    console.error('   ❌ Error seeding payouts:', error);
  }
} 