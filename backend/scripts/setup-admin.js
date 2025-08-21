/**
 * One-time admin setup script
 * Run this script once to create the admin role and superuser
 * Usage: node scripts/setup-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define schemas inline
const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  permissions: [String],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  phone: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);
const User = mongoose.model('User', userSchema);

async function setupAdmin() {
  try {
    console.log('🔧 Setting up admin user and role...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
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
    const email = process.env.ADMIN_EMAIL || 'admin@keralagiftsonline.com';
    const existingUser = await User.findOne({ email });
    
    if (!existingUser) {
      console.log('📝 Creating admin user...');
      const password = process.env.ADMIN_PASSWORD || 'SuperSecure123!';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: email,
        password: hashedPassword,
        roleId: adminRole._id,
        phone: process.env.ADMIN_PHONE || '+49123456789',
        isActive: true
      });
      console.log('✅ Admin user created:', email);
      console.log('🔑 Default password:', password);
    } else {
      console.log('✅ Admin user already exists:', email);
    }
    
    console.log('🎉 Admin setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Admin setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run setup if called directly
if (require.main === module) {
  setupAdmin()
    .then(() => {
      console.log('Setup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupAdmin };
