/**
 * Vendors Seed - Sample vendor data
 * Creates vendor profiles for the marketplace
 */

import { Vendor, IVendor, VendorStatus } from '../models/vendors.model';
import { IUser } from '../models/users.model';

/**
 * Seed vendors with user data
 */
export async function seedVendors(users: IUser[]): Promise<IVendor[]> {
  try {
    // Check if vendors already exist
    const existingVendors = await Vendor.countDocuments();
    if (existingVendors > 0) {
      console.log('   ⏭️  Vendors already exist, skipping...');
      return await Vendor.find();
    }

    // Get vendor users (for now, use first few users as vendors)
    const vendorUsers = users.slice(0, 3);

    const vendors = [
      {
        ownerId: vendorUsers[0]?._id,
        storeName: 'Sweet Dreams Bakery',
        status: VendorStatus.ACTIVE,
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
        status: VendorStatus.ACTIVE,
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
        status: VendorStatus.PENDING_APPROVAL,
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

    const createdVendors = await Vendor.insertMany(vendors);
    console.log(`   ✅ Created ${createdVendors.length} vendors`);

    // Log vendor details
    createdVendors.forEach(vendor => {
      console.log(`      - ${vendor.storeName} (${vendor.status}) - ${vendor.address.city}`);
    });

    return createdVendors as IVendor[];
  } catch (error) {
    console.error('   ❌ Error seeding vendors:', error);
    throw error;
  }
} 