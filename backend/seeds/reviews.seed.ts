/**
 * Reviews Seed - Sample product and vendor reviews
 */

import { Review, ReviewType } from '../models/reviews.model';

export async function seedReviews(users: any[], orders: any[], products: any[], vendors: any[]) {
  try {
    const existing = await Review.countDocuments();
    if (existing > 0) {
      console.log('   ⏭️  Reviews already exist, skipping...');
      return;
    }

    const reviews = [
      {
        reviewType: ReviewType.PRODUCT,
        productId: products[0]._id,
        userId: users[0]._id,
        orderId: orders[0]._id,
        rating: 5,
        comment: 'Amazing cake! Very delicious and beautifully decorated.'
      }
    ];

    await Review.insertMany(reviews);
    console.log(`   ✅ Created ${reviews.length} reviews`);
  } catch (error) {
    console.error('   ❌ Error seeding reviews:', error);
  }
} 