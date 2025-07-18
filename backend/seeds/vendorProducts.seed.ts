/**
 * VendorProducts Seed - Sample vendor product pricing
 */

import { VendorProduct } from '../models/vendorProducts.model';

export async function seedVendorProducts(vendors: any[], products: any[]) {
  try {
    const existing = await VendorProduct.countDocuments();
    if (existing > 0) {
      console.log('   ⏭️  Vendor products already exist, skipping...');
      return;
    }

    const vendorProducts = [];
    
    // Create vendor products for first few products
    for (let i = 0; i < Math.min(5, products.length); i++) {
      for (let j = 0; j < Math.min(2, vendors.length); j++) {
        vendorProducts.push({
          vendorId: vendors[j]._id,
          productId: products[i]._id,
          price: Math.floor(Math.random() * 1000) + 500, // 500-1500
          hsnCode: '1905' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
          taxRate: [0, 5, 12, 18][Math.floor(Math.random() * 4)],
          isActive: true
        });
      }
    }

    await VendorProduct.insertMany(vendorProducts);
    console.log(`   ✅ Created ${vendorProducts.length} vendor products`);
  } catch (error) {
    console.error('   ❌ Error seeding vendor products:', error);
  }
} 