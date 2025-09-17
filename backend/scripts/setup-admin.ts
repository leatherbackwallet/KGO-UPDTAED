/**
 * One-time admin setup script
 * Run this script once to create the admin role and superuser
 * Usage: npx ts-node scripts/setup-admin.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/users.model';
import { Role } from '../models/roles.model';

dotenv.config();

// Ensure MongoDB Atlas is always used, never local MongoDB
if (!process.env.MONGODB_URI?.includes('mongodb+srv://') || 
    !process.env.MONGODB_URI?.includes('mongodb.net') ||
    process.env.MONGODB_URI?.includes('localhost') ||
    process.env.MONGODB_URI?.includes('127.0.0.1')) {
  console.error('❌ ERROR: This script requires MongoDB Atlas connection.');
  console.error('Please set MONGODB_URI to your Atlas connection string.');
  console.error('Example: mongodb+srv://username:password@cluster.mongodb.net/database');
  process.exit(1);
}

const setupAdmin = async (): Promise<void> => {
  try {
    console.log('🚀 Starting admin setup...');
    
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB Atlas');

    // Check if admin role already exists
    let adminRole = await Role.findOne({ name: 'admin' });
    
    if (!adminRole) {
      // Create admin role
      adminRole = new Role({
        name: 'admin',
        description: 'Administrator with full system access',
        permissions: [
          'users:read', 'users:write', 'users:delete',
          'products:read', 'products:write', 'products:delete',
          'orders:read', 'orders:write', 'orders:delete',
          'categories:read', 'categories:write', 'categories:delete',
          'analytics:read', 'analytics:write',
          'system:read', 'system:write', 'system:delete'
        ]
      });
      
      await adminRole.save();
      console.log('✅ Admin role created');
    } else {
      console.log('ℹ️  Admin role already exists');
    }

    // Check if superuser already exists
    const existingAdmin = await User.findOne({ email: 'admin@keralagiftsonline.com' });
    
    if (!existingAdmin) {
      // Create superuser
      const hashedPassword = await bcrypt.hash('Admin@123', 12);
      
      const superuser = new User({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@keralagiftsonline.com',
        password: hashedPassword,
        phone: '+91-9999999999',
        roleId: adminRole._id,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true
      });
      
      await superuser.save();
      console.log('✅ Superuser created');
      console.log('📧 Email: admin@keralagiftsonline.com');
      console.log('🔑 Password: Admin@123');
      console.log('⚠️  Please change the password after first login!');
    } else {
      console.log('ℹ️  Superuser already exists');
    }

    // Create additional roles if they don't exist
    const roles = [
      {
        name: 'vendor',
        description: 'Vendor with product management access',
        permissions: [
          'products:read', 'products:write',
          'orders:read', 'orders:write',
          'analytics:read'
        ]
      },
      {
        name: 'customer',
        description: 'Regular customer with basic access',
        permissions: [
          'products:read',
          'orders:read', 'orders:write'
        ]
      },
      {
        name: 'moderator',
        description: 'Moderator with content management access',
        permissions: [
          'users:read',
          'products:read', 'products:write',
          'orders:read', 'orders:write',
          'categories:read', 'categories:write',
          'analytics:read'
        ]
      }
    ];

    for (const roleData of roles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        const role = new Role(roleData);
        await role.save();
        console.log(`✅ ${roleData.name} role created`);
      } else {
        console.log(`ℹ️  ${roleData.name} role already exists`);
      }
    }

    console.log('🎉 Admin setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Admin setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the setup
setupAdmin();
