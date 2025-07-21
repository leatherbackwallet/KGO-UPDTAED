/**
 * Users Seed - Sample user data for all user types
 * Creates customers, vendors, admins, and support agents
 */

import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/users.model';
import { Role } from '../models/roles.model';

/**
 * Seed users with different roles
 */
export async function seedUsers(): Promise<any[]> {
  try {
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('   ⏭️  Users already exist, skipping...');
      return await User.find();
    }

    // Get role IDs
    const adminRole = await Role.findOne({ name: 'admin' });
    const customerRole = await Role.findOne({ name: 'customer' });
    const vendorRole = await Role.findOne({ name: 'vendor' });
    const supportRole = await Role.findOne({ name: 'support_agent' });
    const deliveryRole = await Role.findOne({ name: 'delivery_agent' });

    if (!adminRole || !customerRole || !vendorRole || !supportRole || !deliveryRole) {
      throw new Error('Required roles not found. Please seed roles first.');
    }

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 12);

    const users = [
      // Admin User
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@keralagiftsonline.com',
        password: hashedPassword,
        roleId: adminRole._id,
        phone: '+91-9876543210'
      },
      // Customer User
      {
        firstName: 'John',
        lastName: 'Customer',
        email: 'customer@example.com',
        password: hashedPassword,
        roleId: customerRole._id,
        phone: '+91-9876543211'
      },
      // Vendor User
      {
        firstName: 'Sarah',
        lastName: 'Vendor',
        email: 'vendor@example.com',
        password: hashedPassword,
        roleId: vendorRole._id,
        phone: '+91-9876543212'
      },
      // Support Agent User
      {
        firstName: 'Mike',
        lastName: 'Support',
        email: 'support@keralagiftsonline.com',
        password: hashedPassword,
        roleId: supportRole._id,
        phone: '+91-9876543213'
      },
      // Additional Customer Users
      {
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma@example.com',
        password: hashedPassword,
        roleId: customerRole._id,
        phone: '+91-9876543214'
      },
      {
        firstName: 'David',
        lastName: 'Brown',
        email: 'david@example.com',
        password: hashedPassword,
        roleId: customerRole._id,
        phone: '+91-9876543215'
      },
      // Additional Vendor Users
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya@vendor.com',
        password: hashedPassword,
        roleId: vendorRole._id,
        phone: '+91-9876543216'
      },
      {
        firstName: 'Raj',
        lastName: 'Kumar',
        email: 'raj@vendor.com',
        password: hashedPassword,
        roleId: vendorRole._id,
        phone: '+91-9876543217'
      },
      // Delivery Agent Users
      {
        firstName: 'Alex',
        lastName: 'Delivery',
        email: 'alex@delivery.com',
        password: hashedPassword,
        roleId: deliveryRole._id,
        phone: '+49-1234567890'
      },
      {
        firstName: 'Maria',
        lastName: 'Logistics',
        email: 'maria@delivery.com',
        password: hashedPassword,
        roleId: deliveryRole._id,
        phone: '+49-1234567891'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`   ✅ Created ${createdUsers.length} users`);
    
    // Log user details
    createdUsers.forEach(user => {
      console.log(`      - ${user.email} (${user.firstName} ${user.lastName})`);
    });

    return createdUsers;
  } catch (error) {
    console.error('   ❌ Error seeding users:', error);
    throw error;
  }
} 