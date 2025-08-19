"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedOrders = seedOrders;
const orders_model_1 = require("../models/orders.model");
async function seedOrders(users, products, vendors) {
    try {
        const existing = await orders_model_1.Order.countDocuments();
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
                requestedDeliveryDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
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
        const createdOrders = await orders_model_1.Order.insertMany(orders);
        console.log(`   ✅ Created ${createdOrders.length} orders`);
        return createdOrders;
    }
    catch (error) {
        console.error('   ❌ Error seeding orders:', error);
        return [];
    }
}
//# sourceMappingURL=orders.seed.js.map