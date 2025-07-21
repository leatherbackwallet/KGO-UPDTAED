"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTransactions = seedTransactions;
const transactions_model_1 = require("../models/transactions.model");
async function seedTransactions(orders, users) {
    try {
        const existing = await transactions_model_1.Transaction.countDocuments();
        if (existing > 0) {
            console.log('   ⏭️  Transactions already exist, skipping...');
            return;
        }
        const transactions = orders.map(order => ({
            orderId: order._id,
            userId: order.userId,
            amount: order.totalPrice,
            gatewayTransactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
            type: transactions_model_1.TransactionType.CAPTURE,
            status: transactions_model_1.TransactionStatus.SUCCESS
        }));
        await transactions_model_1.Transaction.insertMany(transactions);
        console.log(`   ✅ Created ${transactions.length} transactions`);
    }
    catch (error) {
        console.error('   ❌ Error seeding transactions:', error);
    }
}
//# sourceMappingURL=transactions.seed.js.map