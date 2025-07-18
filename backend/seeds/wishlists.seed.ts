/**
 * Wishlists Seed - Minimal
 */
import { Wishlist } from '../models/wishlists.model';
export async function seedWishlists(users: any[], products: any[]) {
  try {
    const existing = await Wishlist.countDocuments();
    if (existing > 0) { console.log('   ⏭️  Wishlists already exist, skipping...'); return; }
    if (!users.length || !products.length) return;
    await Wishlist.create({ userId: users[0]._id, products: [products[0]._id] });
    console.log('   ✅ Created 1 wishlist');
  } catch (error) { console.error('   ❌ Error seeding wishlists:', error); }
} 