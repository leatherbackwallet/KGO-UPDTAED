"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDailyStats = seedDailyStats;
const dailyStats_model_1 = require("../models/dailyStats.model");
async function seedDailyStats(products, vendors) {
    try {
        const existing = await dailyStats_model_1.DailyStats.countDocuments();
        if (existing > 0) {
            console.log('   ⏭️  Daily stats already exist, skipping...');
            return;
        }
        await dailyStats_model_1.DailyStats.create({ date: new Date(), totalSales: 1000, totalOrders: 5, newUsers: 2, topSellingProducts: [], topPerformingVendors: [] });
        console.log('   ✅ Created 1 daily stats entry');
    }
    catch (error) {
        console.error('   ❌ Error seeding daily stats:', error);
    }
}
//# sourceMappingURL=dailyStats.seed.js.map