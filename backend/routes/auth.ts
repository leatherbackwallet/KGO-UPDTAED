import express from 'express';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models/index';
import { hashPassword, comparePassword } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    if (!firstName || !lastName || !email || !password || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'First name, last name, email, password, and phone are required', code: 'MISSING_FIELDS' } 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Email already in use', code: 'EMAIL_EXISTS' } 
      });
    }

    // Get customer role
    const customerRole = await Role.findOne({ name: 'customer' });
    if (!customerRole) {
      return res.status(500).json({ 
        success: false, 
        error: { message: 'Customer role not found', code: 'ROLE_NOT_FOUND' } 
      });
    }

    // Create new user
    const hashed = await hashPassword(password);
    const user = await User.create({ 
      firstName, 
      lastName, 
      email, 
      password: hashed, 
      phone,
      roleId: customerRole._id
    });

    const token = jwt.sign({ 
      id: user._id, 
      roleId: user.roleId
    }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    return res.json({ 
      success: true,
      data: { 
        token, 
        user: { 
          id: user._id, 
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email, 
          phone: user.phone,
          roleId: user.roleId
        }
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Server error', code: 'SERVER_ERROR' } 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Email and password are required', code: 'MISSING_FIELDS' } 
      });
    }

    const user = await User.findOne({ email }).populate<{ roleId: { name: string } }>('roleId');
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' } 
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' } 
      });
    }

    const token = jwt.sign({ 
      id: user._id, 
      roleId: user.roleId
    }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    return res.json({ 
      success: true,
      data: { 
        token, 
        user: { 
          id: user._id, 
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email, 
          phone: user.phone,
          roleId: user.roleId,
          roleName: user.roleId?.name
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Server error', code: 'SERVER_ERROR' } 
    });
  }
});

// Guest Checkout - Creates a guest user with all details
router.post('/guest', async (req, res) => {
  try {
    const { name, email, phone, deliveryAddress, paymentMethod } = req.body;
    
    if (!name || !email || !phone || !deliveryAddress) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Name, email, phone, and delivery address are required', code: 'MISSING_FIELDS' } 
      });
    }

    // Check if user already exists with this email
    let user = await User.findOne({ email }).populate('roleId');
    
    if (user) {
      // If user exists, add delivery address if not already present
      const addressExists = user.recipientAddresses?.some(addr => 
        addr.address.streetName === deliveryAddress.street &&
        addr.address.houseNumber === deliveryAddress.houseNumber &&
        addr.address.city === deliveryAddress.city
      );

      if (!addressExists) {
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || name;
        const lastName = nameParts.slice(1).join(' ') || 'Guest';

        const newAddress = {
          name: `${firstName} ${lastName}`,
          phone: phone,
          address: {
            streetName: deliveryAddress.street,
            houseNumber: deliveryAddress.houseNumber,
            postalCode: deliveryAddress.zipCode,
            city: deliveryAddress.city,
            countryCode: deliveryAddress.country || 'IN'
          },
          isDefault: user.recipientAddresses?.length === 0
        };

        user.recipientAddresses = user.recipientAddresses || [];
        user.recipientAddresses.push(newAddress);
        await user.save();
      }

      // Return their token (they can complete checkout as existing user)
      const token = jwt.sign({ 
        id: user._id, 
        roleId: user.roleId
      }, process.env.JWT_SECRET!, { expiresIn: '7d' });

      return res.json({ 
        success: true,
        data: { 
          token, 
          user: { 
            id: user._id, 
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email, 
            phone: user.phone,
            roleId: user.roleId,
            roleName: (user.roleId as any)?.name
          }
        }
      });
    }

    // Get customer role for guest users
    let guestRole = await Role.findOne({ name: 'customer' });
    if (!guestRole) {
      guestRole = await Role.create({ 
        name: 'customer', 
        description: 'Customer user',
        permissions: ['read_products', 'create_orders']
      });
    }

    // Split name into firstName and lastName
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || 'Guest';

    // Generate a random password for guest user
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(randomPassword);
    
    // Create guest user with all details
    user = await User.create({ 
      firstName,
      lastName,
      email, 
      phone,
      password: hashedPassword,
      roleId: guestRole._id,
      recipientAddresses: [{
        name: `${firstName} ${lastName}`,
        phone: phone,
        address: {
          streetName: deliveryAddress.street,
          houseNumber: deliveryAddress.houseNumber,
          postalCode: deliveryAddress.zipCode,
          city: deliveryAddress.city,
          countryCode: deliveryAddress.country || 'IN'
        },
        isDefault: true
      }]
    });

    const token = jwt.sign({ 
      id: user._id, 
      roleId: user.roleId
    }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    return res.json({ 
      success: true,
      data: { 
        token, 
        user: { 
          id: user._id, 
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email, 
          phone: user.phone,
          roleId: user.roleId,
          roleName: (user.roleId as any)?.name,
          isGuest: true
        }
      }
    });
  } catch (err) {
    console.error('Guest checkout error:', err);
    console.error('Error details:', JSON.stringify(err, null, 2));
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Server error', code: 'SERVER_ERROR' } 
    });
  }
});

export default router; 