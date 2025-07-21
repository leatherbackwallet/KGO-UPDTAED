/**
 * Orders Seed - Sample order data
 */

import { Order } from '../models/orders.model';

export async function seedOrders(users: any[], products: any[], vendors: any[]) {
  try {
    const existing = await Order.countDocuments();
    if (existing > 0) {
      console.log('   ⏭️  Orders already exist, skipping...');
      return [];
    }

    const customerUsers = users.filter(u => u.role === 'customer');
    const orders: any[] = [];

    for (let i = 0; i < Math.min(3, customerUsers.length); i++) {
      const order = {
        orderId: `ORD${Date.now()}${i}`,
        userId: customerUsers[i]._id,
        requestedDeliveryDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), // 1-3 days from now
        requestedDeliveryTimeSlot: i === 0 ? 'Morning (9am-1pm)' : i === 1 ? 'Afternoon (1pm-5pm)' : 'Evening (5pm-9pm)',
        shippingDetails: {
          recipientName: customerUsers[i].firstName + ' ' + customerUsers[i].lastName,
          recipientPhone: customerUsers[i].phone,
          address: {
            streetName: 'Sample Street',
            houseNumber: '123',
            postalCode: '400001',
            city: 'Mumbai',
            countryCode: 'IN'
          }
        },
        orderItems: [{
          productId: products[0]._id,
          price: 800,
          quantity: 1
        }],
        totalPrice: 800,
        orderStatus: 'delivered'
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