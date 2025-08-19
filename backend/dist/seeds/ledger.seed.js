"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedLedger = seedLedger;
const ledger_model_1 = require("../models/ledger.model");
async function seedLedger(users, orders) {
    try {
        const existing = await ledger_model_1.Ledger.countDocuments();
        if (existing > 0) {
            console.log('   ⏭️  Ledger entries already exist, skipping...');
            return;
        }
        const ledgerEntries = [
            {
                date: new Date(),
                type: ledger_model_1.LedgerType.INCOME,
                category: ledger_model_1.LedgerCategory.SALES_REVENUE,
                description: 'Sales revenue from orders',
                amount: orders.reduce((sum, order) => sum + order.totalPrice, 0),
                relatedDocument: {
                    modelName: 'Order',
                    docId: orders[0]._id
                },
                recordedBy: users.find(u => u.roleId?.name === 'admin')._id
            }
        ];
        await ledger_model_1.Ledger.insertMany(ledgerEntries);
        console.log(`   ✅ Created ${ledgerEntries.length} ledger entries`);
    }
    catch (error) {
        console.error('   ❌ Error seeding ledger:', error);
    }
}
//# sourceMappingURL=ledger.seed.js.map