/**
 * One-time admin setup script
 * Run this script once to create the admin role and superuser
 * Usage: node scripts/setup-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Ensure MongoDB Atlas is always used, never local MongoDB
if (!process.env.MONGODB_URI.includes('mongodb+srv://') || 
    !process.env.MONGODB_URI.includes('mongodb.net') ||
    process.env.MONGODB_URI.includes('localhost') ||
    process.env.MONGODB_URI.includes('127.0.0.1')) {
  console.error('❌ ERROR: MongoDB Atlas must be used. Local MongoDB is not allowed.');
  console.error('❌ Current URI format is invalid');
  console.error('✅ Expected format: mongodb+srv://username:password@cluster.mongodb.net/database');
  process.exit(1);
}

// Validate JWT secret
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

// Validate JWT secret strength
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long for security');
  process.exit(1);
}

// Validate JWT refresh secret
if (!process.env.JWT_REFRESH_SECRET) {
  console.error('JWT_REFRESH_SECRET environment variable is required');
  process.exit(1);
}

// Validate JWT refresh secret strength
if (process.env.JWT_REFRESH_SECRET.length < 32) {
  console.error('JWT_REFRESH_SECRET must be at least 32 characters long for security');
  process.exit(1);
}

// Role schema
const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// User schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Role = mongoose.model('Role', roleSchema);
const User = mongoose.model('User', userSchema);

async function setupAdmin() {
  try {
    console.log('🔧 Setting up admin user and role...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Check if admin role exists
    let adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      console.log('📝 Creating admin role...');
      adminRole = await Role.create({
        name: 'admin',
        description: 'System administrator with full access',
        permissions: ['*'],
        isActive: true
      });
      console.log('✅ Admin role created');
    } else {
      console.log('✅ Admin role already exists');
    }
    
    // Check if admin user exists
    const email = process.env.ADMIN_EMAIL || 'admin@yourdomain.com';
    const existingUser = await User.findOne({ email });
    
    if (!existingUser) {
      console.log('📝 Creating admin user...');
      const password = process.env.ADMIN_PASSWORD || 'YourSecurePassword123!';
      
      // Validate password complexity
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        console.error('❌ Admin password does not meet complexity requirements');
        console.error('Password must contain at least 8 characters including uppercase, lowercase, number, and special character');
        process.exit(1);
      }
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: email,
        password: hashedPassword,
        roleId: adminRole._id,
        phone: process.env.ADMIN_PHONE || '+1234567890',
        isActive: true
      });
      console.log('✅ Admin user created:', email);
      console.log('🔑 Default password:', password);
      console.log('⚠️  Please change the default password after first login');
    } else {
      console.log('✅ Admin user already exists:', email);
    }
    
    console.log('🎉 Admin setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Admin setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}

// Run setup if called directly
if (require.main === module) {
  setupAdmin();
}

module.exports = setupAdmin;
