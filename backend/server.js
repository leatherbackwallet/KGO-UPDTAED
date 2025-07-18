require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const User = require('./models/User');
const Category = require('./models/Category');
const { hashPassword } = require('./utils/hash');

// Middleware
app.use(cors());
app.use(express.json());

// Create default superuser if not exists
async function createSuperUser() {
  const email = 'admin@onyourbehalf.com';
  const password = 'SuperSecure123!';
  const name = 'Super Admin';
  const existing = await User.findOne({ email });
  if (!existing) {
    const hashed = await hashPassword(password);
    await User.create({ name, email, password: hashed, role: 'Admin' });
    console.log('Superuser created:', email, 'password:', password);
  } else {
    console.log('Superuser already exists:', email);
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(async () => {
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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 