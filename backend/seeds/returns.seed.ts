/**
 * Returns Seed - Populates returns collection with sample data
 * Creates realistic return scenarios for testing RMA workflows
 */

import mongoose from 'mongoose';
import { Return } from '../models/returns.model';
import { Order } from '../models/orders.model';
import { User } from '../models/users.model';
import { Product } from '../models/products.model';

const returnReasons = [
  'Product damaged during delivery',
  'Wrong item received',
  'Product not as described',
  'Size/fit issues',
  'Quality not satisfactory',
  'Changed mind',
  'Duplicate order',
  'Product expired'
];

const returnStatuses = [
  'requested',
  'approved',
  'rejected',
  'shipped_by_customer',
  'received_at_hub',
  'completed'
] as const;

const resolutions = [
  'refund',
  'replacement'
] as const;

export const seedReturns = async () => {
  try {
    console.log('🌱 Seeding returns...');

    // Get existing data for relationships
    const users = await User.find().limit(10);
    const orders = await Order.find({ orderStatus: 'delivered' }).limit(20);
    const products = await Product.find().limit(15);

    if (users.length === 0 || orders.length === 0 || products.length === 0) {
      console.log('⚠️  Skipping returns seed - insufficient related data');
      return;
    }

    const returns: any[] = [];

    // Create returns for different scenarios
    for (let i = 0; i < 15; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomOrder = orders[Math.floor(Math.random() * orders.length)];
      const randomStatus = returnStatuses[Math.floor(Math.random() * returnStatuses.length)];
      
      // Skip if no user or order found
      if (!randomUser || !randomOrder) continue;
      
      // Select random products from the order (simplified - in real scenario would match order items)
      const randomProducts = products.slice(0, Math.floor(Math.random() * 3) + 1);
      
      const returnItem = {
        orderId: randomOrder._id,
        userId: randomUser._id,
        orderItems: randomProducts.map(product => ({
          productId: product._id,
          quantity: Math.floor(Math.random() * 2) + 1
        })),
        reason: returnReasons[Math.floor(Math.random() * returnReasons.length)],
        status: randomStatus,
        resolution: randomStatus === 'completed' ? resolutions[Math.floor(Math.random() * resolutions.length)] : undefined,
        notes: randomStatus === 'rejected' ? 'Return request rejected due to policy violation' : 
               randomStatus === 'completed' ? 'Return processed successfully' : undefined,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        updatedAt: new Date()
      };

      returns.push(returnItem);
    }

    // Clear existing returns
    await Return.deleteMany({});

    // Insert new returns
    const createdReturns = await Return.insertMany(returns);

    console.log(`✅ Seeded ${createdReturns.length} returns`);
    
    // Log some statistics
    const statusCounts = await Return.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('📊 Return status distribution:');
    statusCounts.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

  } catch (error) {
    console.error('❌ Error seeding returns:', error);
    throw error;
  }
};

// Export for use in main seeder
export default seedReturns; 