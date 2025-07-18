/**
 * Transactions Seed - Sample payment transactions
 */

import { Transaction, TransactionType, TransactionStatus } from '../models/transactions.model';

export async function seedTransactions(orders: any[], users: any[]) {
  try {
    const existing = await Transaction.countDocuments();
    if (existing > 0) {
      console.log('   ⏭️  Transactions already exist, skipping...');
      return;
    }

    const transactions = orders.map(order => ({
      orderId: order._id,
      userId: order.userId,
      amount: order.totalPrice,
      gatewayTransactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
      type: TransactionType.CAPTURE,
      status: TransactionStatus.SUCCESS
    }));

    await Transaction.insertMany(transactions);
    console.log(`   ✅ Created ${transactions.length} transactions`);
  } catch (error) {
    console.error('   ❌ Error seeding transactions:', error);
  }
} 