/**
 * DailyStats Seed - Minimal
 */
import { DailyStats } from '../models/dailyStats.model';
export async function seedDailyStats(products: any[], vendors: any[]) {
  try {
    const existing = await DailyStats.countDocuments();
    if (existing > 0) { console.log('   ⏭️  Daily stats already exist, skipping...'); return; }
    await DailyStats.create({ date: new Date(), totalSales: 1000, totalOrders: 5, newUsers: 2, topSellingProducts: [], topPerformingVendors: [] });
    console.log('   ✅ Created 1 daily stats entry');
  } catch (error) { console.error('   ❌ Error seeding daily stats:', error); }
} 