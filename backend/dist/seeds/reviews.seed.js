"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedReviews = seedReviews;
const reviews_model_1 = require("../models/reviews.model");
async function seedReviews(users, orders, products, vendors) {
    try {
        const existing = await reviews_model_1.Review.countDocuments();
        if (existing > 0) {
            console.log('   ⏭️  Reviews already exist, skipping...');
            return;
        }
        const reviews = [
            {
                reviewType: reviews_model_1.ReviewType.PRODUCT,
                productId: products[0]._id,
                userId: users[0]._id,
                orderId: orders[0]._id,
                rating: 5,
                comment: 'Amazing cake! Very delicious and beautifully decorated.'
            }
        ];
        await reviews_model_1.Review.insertMany(reviews);
        console.log(`   ✅ Created ${reviews.length} reviews`);
    }
    catch (error) {
        console.error('   ❌ Error seeding reviews:', error);
    }
}
//# sourceMappingURL=reviews.seed.js.map