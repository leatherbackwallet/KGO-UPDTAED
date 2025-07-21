"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedVendorProducts = seedVendorProducts;
const vendorProducts_model_1 = require("../models/vendorProducts.model");
async function seedVendorProducts(vendors, products) {
    try {
        const existing = await vendorProducts_model_1.VendorProduct.countDocuments();
        if (existing > 0) {
            console.log('   ⏭️  Vendor products already exist, skipping...');
            return;
        }
        const vendorProducts = [];
        for (let i = 0; i < Math.min(5, products.length); i++) {
            for (let j = 0; j < Math.min(2, vendors.length); j++) {
                vendorProducts.push({
                    vendorId: vendors[j]._id,
                    productId: products[i]._id,
                    price: Math.floor(Math.random() * 1000) + 500,
                    hsnCode: '1905' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
                    taxRate: [0, 5, 12, 18][Math.floor(Math.random() * 4)],
                    isActive: true
                });
            }
        }
        await vendorProducts_model_1.VendorProduct.insertMany(vendorProducts);
        console.log(`   ✅ Created ${vendorProducts.length} vendor products`);
    }
    catch (error) {
        console.error('   ❌ Error seeding vendor products:', error);
    }
}
//# sourceMappingURL=vendorProducts.seed.js.map