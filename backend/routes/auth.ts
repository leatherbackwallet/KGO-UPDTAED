import express from 'express';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models/index';
import { hashPassword, comparePassword } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';
const { validate, sanitizeInput, schemas } = require('../middleware/validation');

const router = express.Router();

// Register
router.post('/register', sanitizeInput, validate(schemas.register), async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    
    // Enhanced validation
    if (!firstName || !lastName || !email || !password || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'First name, last name, email, password, and phone are required', code: 'MISSING_FIELDS' } 
      });
    }

    // Trim and validate input
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (trimmedFirstName.length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'First name must be at least 2 characters long', code: 'INVALID_FIRST_NAME' }
      });
    }

    if (trimmedLastName.length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'Last name must be at least 2 characters long', code: 'INVALID_LAST_NAME' }
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please enter a valid email address', code: 'INVALID_EMAIL' }
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 6 characters long', code: 'INVALID_PASSWORD' }
      });
    }

    // Phone validation (basic)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please enter a valid phone number', code: 'INVALID_PHONE' }
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Email already in use. Please use a different email or try logging in.', code: 'EMAIL_EXISTS' } 
      });
    }

    // Get or create customer role
    let customerRole = await Role.findOne({ name: 'customer' });
    if (!customerRole) {
      console.log('Customer role not found, creating it...');
      customerRole = await Role.create({
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
      });
      console.log('Customer role created successfully');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create new user with proper error handling
    let user;
    try {
      user = await User.create({ 
        firstName: trimmedFirstName, 
        lastName: trimmedLastName, 
        email: trimmedEmail, 
        password: hashedPassword, 
        phone: trimmedPhone,
        roleId: customerRole._id,
        isActive: true
      });
      
      console.log(`New user created successfully: ${user.email} (${user._id})`);
    } catch (createError: any) {
      console.error('Error creating user:', createError);
      
      // Handle specific MongoDB errors
      if (createError.code === 11000) {
        return res.status(400).json({
          success: false,
          error: { message: 'Email already in use. Please use a different email.', code: 'EMAIL_EXISTS' }
        });
      }
      
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to create user account. Please try again.', code: 'USER_CREATION_FAILED' }
      });
    }

    // Generate JWT token
    const token = jwt.sign({ 
      id: user._id, 
      email: user.email,
      roleId: user.roleId,
      firstName: user.firstName,
      lastName: user.lastName
    }, process.env.JWT_SECRET || '', { expiresIn: '7d' });

    // Return success response
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
          roleName: 'customer'
        }
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Server error occurred. Please try again later.', code: 'SERVER_ERROR' } 
    });
  }
});

// Login
router.post('/login', sanitizeInput, validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Enhanced validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Email and password are required', code: 'MISSING_FIELDS' } 
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please enter a valid email address', code: 'INVALID_EMAIL' }
      });
    }

    // Find user with populated role
    const user = await User.findOne({ email: trimmedEmail, isActive: true, isDeleted: false })
      .populate<{ roleId: { name: string } }>('roleId');
      
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' } 
      });
    }

    // Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' } 
      });
    }

    // Generate JWT token
    const token = jwt.sign({ 
      id: user._id, 
      email: user.email,
      roleId: user.roleId,
      firstName: user.firstName,
      lastName: user.lastName
    }, process.env.JWT_SECRET || '', { expiresIn: '7d' });

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
          roleName: user.roleId?.name || 'customer'
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Server error occurred. Please try again later.', code: 'SERVER_ERROR' } 
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
      }, process.env.JWT_SECRET || '', { expiresIn: '7d' });

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
    }, process.env.JWT_SECRET || '', { expiresIn: '7d' });

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