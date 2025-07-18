/**
 * Orders Seed - Sample order data
 */

import { Order, OrderStatus, ItemStatus } from '../models/orders.model';

export async function seedOrders(users: any[], products: any[], vendors: any[]) {
  try {
    const existing = await Order.countDocuments();
    if (existing > 0) {
      console.log('   ⏭️  Orders already exist, skipping...');
      return [];
    }

    const customerUsers = users.filter(u => u.role === 'customer');
    const orders = [];

    for (let i = 0; i < Math.min(3, customerUsers.length); i++) {
      const order = {
        orderId: `ORD${Date.now()}${i}`,
        userId: customerUsers[i]._id,
        shippingDetails: {
          name: customerUsers[i].firstName + ' ' + customerUsers[i].lastName,
          phone: customerUsers[i].phone,
          address: {
            street: 'Sample Address',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001'
          }
        },
        orderItems: [{
          productId: products[0]._id,
          name: products[0].name,
          price: 800,
          quantity: 1,
          vendorId: vendors[0]._id,
          itemStatus: ItemStatus.DELIVERED
        }],
        personalizationData: new Map([['Custom Message', 'Happy Birthday!']]),
        taxDetails: {
          taxableAmount: 800,
          cgst: 72,
          sgst: 72,
          igst: 0
        },
        totalPrice: 944,
        orderStatus: OrderStatus.DELIVERED
      };
      orders.push(order);
    }

    const createdOrders = await Order.insertMany(orders);
    console.log(`   ✅ Created ${createdOrders.length} orders`);
    return createdOrders;
  } catch (error) {
    console.error('   ❌ Error seeding orders:', error);
    return [];
  }
} 