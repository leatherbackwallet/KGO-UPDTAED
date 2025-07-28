/**
 * Roles Seed - Creates all required roles for the application
 * Ensures customer, admin, vendor, and other roles exist
 */

import { Role, IRole } from '../models/roles.model';

/**
 * Seed roles for the application
 */
export async function seedRoles(): Promise<IRole[]> {
  try {
    // Check if roles already exist
    const existingRoles = await Role.countDocuments();
    if (existingRoles > 0) {
      console.log('   ⏭️  Roles already exist, skipping...');
      return await Role.find();
    }

    const roles = [
      {
        name: 'admin',
        description: 'System administrator with full access',
        permissions: ['*'],
        isActive: true
      },
      {
        name: 'customer',
        description: 'Regular customer with basic permissions',
        permissions: [
          'view_products',
          'place_orders',
          'view_own_orders',
          'manage_wishlist',
          'manage_profile',
          'view_categories'
        ],
        isActive: true
      },
      {
        name: 'vendor',
        description: 'Product vendor with product management permissions',
        permissions: [
          'manage_own_products',
          'view_own_orders',
          'manage_own_vendor_profile',
          'view_analytics'
        ],
        isActive: true
      },
      {
        name: 'support_agent',
        description: 'Customer support agent',
        permissions: [
          'view_orders',
          'manage_support_tickets',
          'view_users',
          'update_order_status'
        ],
        isActive: true
      },
      {
        name: 'delivery_agent',
        description: 'Delivery personnel',
        permissions: [
          'view_assigned_deliveries',
          'update_delivery_status',
          'view_delivery_routes'
        ],
        isActive: true
      }
    ];

    const createdRoles = await Role.insertMany(roles);
    console.log(`   ✅ Created ${createdRoles.length} roles`);
    
    // Log role details
    createdRoles.forEach(role => {
      console.log(`      - ${role.name} (${role.description})`);
    });

    return createdRoles;
  } catch (error) {
    console.error('   ❌ Error seeding roles:', error);
    throw error;
  }
} 