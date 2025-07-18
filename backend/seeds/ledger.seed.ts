/**
 * Ledger Seed - Sample financial records
 */

import { Ledger, LedgerType, LedgerCategory } from '../models/ledger.model';

export async function seedLedger(users: any[], orders: any[]) {
  try {
    const existing = await Ledger.countDocuments();
    if (existing > 0) {
      console.log('   ⏭️  Ledger entries already exist, skipping...');
      return;
    }

    const ledgerEntries = [
      {
        date: new Date(),
        type: LedgerType.INCOME,
        category: LedgerCategory.SALES_REVENUE,
        description: 'Sales revenue from orders',
        amount: orders.reduce((sum, order) => sum + order.totalPrice, 0),
        relatedDocument: {
          modelName: 'Order',
          docId: orders[0]._id
        },
        recordedBy: users.find(u => u.role === 'admin')._id
      }
    ];

    await Ledger.insertMany(ledgerEntries);
    console.log(`   ✅ Created ${ledgerEntries.length} ledger entries`);
  } catch (error) {
    console.error('   ❌ Error seeding ledger:', error);
  }
} 