import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { User } from './models/users.model';
import { Role } from './models/roles.model';
import { Category } from './models/categories.model';
import { hashPassword } from './utils/hash';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create default superuser if not exists
async function createSuperUser() {
  try {
    // First, ensure we have an admin role
    let adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'admin',
        description: 'System administrator with full access',
        permissions: ['*'],
        isActive: true
      });
      console.log('Admin role created');
    }

    const email = 'admin@keralagiftsonline.com';
    const password = 'SuperSecure123!';
    const existing = await User.findOne({ email });
    
    if (!existing) {
      const hashed = await hashPassword(password);
      await User.create({ 
        firstName: 'Admin', 
        lastName: 'User', 
        email, 
        password: hashed, 
        roleId: adminRole._id, 
        phone: '+49123456789' 
      });
      console.log('Superuser created:', email, 'password:', password);
    } else {
      console.log('Superuser already exists:', email);
    }
  } catch (error) {
    console.error('Error creating superuser:', error);
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI!).then(async () => {
  console.log('MongoDB connected');
  await createSuperUser();
})
  .catch((err) => console.error('MongoDB connection error:', err));

// Add error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Routes
import authRoutes from './routes/auth';
app.use('/api/auth', authRoutes);
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/hubs', require('./routes/hubs'));
app.use('/api/delivery-runs', require('./routes/deliveryRuns'));
app.use('/api/returns', require('./routes/returns'));

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 