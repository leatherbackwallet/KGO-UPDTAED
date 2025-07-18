/**
 * Users Seed - Sample user data for all user types
 * Creates customers, vendors, admins, and support agents
 */

import bcrypt from 'bcryptjs';
import { User, UserRole, IUser } from '../models/users.model';

/**
 * Seed users with different roles
 */
export async function seedUsers(): Promise<IUser[]> {
  try {
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('   ⏭️  Users already exist, skipping...');
      return await User.find();
    }

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 12);

    const users = [
      // Admin User
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@onyourbehlf.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
        phone: '+91-9876543210'
      },
      // Customer User
      {
        firstName: 'John',
        lastName: 'Customer',
        email: 'customer@example.com',
        password: hashedPassword,
        role: UserRole.CUSTOMER,
        phone: '+91-9876543211'
      },
      // Vendor User
      {
        firstName: 'Sarah',
        lastName: 'Vendor',
        email: 'vendor@example.com',
        password: hashedPassword,
        role: UserRole.VENDOR,
        phone: '+91-9876543212'
      },
      // Support Agent User
      {
        firstName: 'Mike',
        lastName: 'Support',
        email: 'support@onyourbehlf.com',
        password: hashedPassword,
        role: UserRole.SUPPORT_AGENT,
        phone: '+91-9876543213'
      },
      // Additional Customer Users
      {
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma@example.com',
        password: hashedPassword,
        role: UserRole.CUSTOMER,
        phone: '+91-9876543214'
      },
      {
        firstName: 'David',
        lastName: 'Brown',
        email: 'david@example.com',
        password: hashedPassword,
        role: UserRole.CUSTOMER,
        phone: '+91-9876543215'
      },
      // Additional Vendor Users
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya@vendor.com',
        password: hashedPassword,
        role: UserRole.VENDOR,
        phone: '+91-9876543216'
      },
      {
        firstName: 'Raj',
        lastName: 'Kumar',
        email: 'raj@vendor.com',
        password: hashedPassword,
        role: UserRole.VENDOR,
        phone: '+91-9876543217'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`   ✅ Created ${createdUsers.length} users`);
    
    // Log user details
    createdUsers.forEach(user => {
      console.log(`      - ${user.role}: ${user.email} (${user.firstName} ${user.lastName})`);
    });

    return createdUsers;
  } catch (error) {
    console.error('   ❌ Error seeding users:', error);
    throw error;
  }
} 