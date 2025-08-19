"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedWishlists = seedWishlists;
const wishlists_model_1 = require("../models/wishlists.model");
async function seedWishlists(users, products) {
    try {
        const existing = await wishlists_model_1.Wishlist.countDocuments();
        if (existing > 0) {
            console.log('   ⏭️  Wishlists already exist, skipping...');
            return;
        }
        if (!users.length || !products.length)
            return;
        await wishlists_model_1.Wishlist.create({ userId: users[0]._id, products: [products[0]._id] });
        console.log('   ✅ Created 1 wishlist');
    }
    catch (error) {
        console.error('   ❌ Error seeding wishlists:', error);
    }
}
//# sourceMappingURL=wishlists.seed.js.map