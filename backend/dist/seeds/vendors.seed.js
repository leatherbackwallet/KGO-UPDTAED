"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedVendors = seedVendors;
const vendors_model_1 = require("../models/vendors.model");
async function seedVendors(users) {
    try {
        const existingVendors = await vendors_model_1.Vendor.countDocuments();
        if (existingVendors > 0) {
            console.log('   ⏭️  Vendors already exist, skipping...');
            return await vendors_model_1.Vendor.find();
        }
        const vendorUsers = users.slice(0, 3);
        const vendors = [
            {
                ownerId: vendorUsers[0]?._id,
                storeName: 'Sweet Dreams Bakery',
                status: vendors_model_1.VendorStatus.ACTIVE,
                address: {
                    street: '123 Baker Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    postalCode: '400001'
                },
                serviceablePincodes: ['400001', '400002', '400003', '400004'],
                averageRating: 4.5
            },
            {
                ownerId: vendorUsers[1]?._id,
                storeName: 'Artisan Cakes & Pastries',
                status: vendors_model_1.VendorStatus.ACTIVE,
                address: {
                    street: '456 Cake Avenue',
                    city: 'Delhi',
                    state: 'Delhi',
                    postalCode: '110001'
                },
                serviceablePincodes: ['110001', '110002', '110003'],
                averageRating: 4.8
            },
            {
                ownerId: vendorUsers[2]?._id,
                storeName: 'Royal Bakery',
                status: vendors_model_1.VendorStatus.PENDING_APPROVAL,
                address: {
                    street: '789 Sweet Lane',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    postalCode: '560001'
                },
                serviceablePincodes: ['560001', '560002'],
                averageRating: 0
            }
        ];
        const createdVendors = await vendors_model_1.Vendor.insertMany(vendors);
        console.log(`   ✅ Created ${createdVendors.length} vendors`);
        createdVendors.forEach(vendor => {
            console.log(`      - ${vendor.storeName} (${vendor.status}) - ${vendor.address.city}`);
        });
        return createdVendors;
    }
    catch (error) {
        console.error('   ❌ Error seeding vendors:', error);
        throw error;
    }
}
//# sourceMappingURL=vendors.seed.js.map