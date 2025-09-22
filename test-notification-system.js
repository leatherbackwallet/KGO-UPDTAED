/**
 * Test Script for Notification System
 * This script tests the notification system by creating a test order and checking if notifications are created
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:8080/api';
const ADMIN_EMAIL = 'admin@keralagiftsonline.com';
const ADMIN_PASSWORD = 'Admin@123';

// Test data
const testOrderData = {
  products: [
    {
      product: '507f1f77bcf86cd799439011', // Replace with actual product ID
      quantity: 2
    }
  ],
  recipientAddress: {
    recipientName: 'Test Customer',
    recipientPhone: '+49123456789',
    address: {
      streetName: 'Test Street',
      houseNumber: '123',
      postalCode: '12345',
      city: 'Test City',
      countryCode: 'DE'
    },
    specialInstructions: 'Test order for notification system'
  },
  paymentMethod: 'cod-test'
};

async function testNotificationSystem() {
  try {
    console.log('🧪 Starting Notification System Test...\n');

    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (!loginResponse.data.success) {
      throw new Error('Admin login failed');
    }

    const adminToken = loginResponse.data.data.accessToken;
    console.log('✅ Admin login successful\n');

    // Step 2: Check initial notification count
    console.log('2️⃣ Checking initial notification count...');
    const initialNotificationsResponse = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const initialCount = initialNotificationsResponse.data.data.unreadCount;
    console.log(`📊 Initial unread notifications: ${initialCount}\n`);

    // Step 3: Create a test order (this should trigger notifications)
    console.log('3️⃣ Creating test order...');
    
    // First, we need to login as a customer to create an order
    // For this test, we'll create a customer account first
    const customerEmail = `test-customer-${Date.now()}@example.com`;
    const customerPassword = 'TestPassword123!';
    
    try {
      // Try to register a new customer
      await axios.post(`${API_BASE_URL}/auth/register`, {
        firstName: 'Test',
        lastName: 'Customer',
        email: customerEmail,
        password: customerPassword,
        phone: '+49123456789'
      });
      console.log('✅ Test customer created');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Test customer already exists, using existing account');
      } else {
        throw error;
      }
    }

    // Login as customer
    const customerLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: customerEmail,
      password: customerPassword
    });

    if (!customerLoginResponse.data.success) {
      throw new Error('Customer login failed');
    }

    const customerToken = customerLoginResponse.data.data.accessToken;
    console.log('✅ Customer login successful');

    // Create order
    const orderResponse = await axios.post(`${API_BASE_URL}/orders`, testOrderData, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    if (!orderResponse.data.success) {
      throw new Error('Order creation failed');
    }

    console.log('✅ Test order created successfully\n');

    // Step 4: Check notification count after order creation
    console.log('4️⃣ Checking notification count after order creation...');
    
    // Wait a moment for the notification to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newNotificationsResponse = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const newCount = newNotificationsResponse.data.data.unreadCount;
    console.log(`📊 New unread notifications: ${newCount}\n`);

    // Step 5: Verify notification was created
    if (newCount > initialCount) {
      console.log('✅ SUCCESS: Notification was created for new order!');
      
      // Fetch the actual notifications
      const notificationsResponse = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (notificationsResponse.data.success) {
        const notifications = notificationsResponse.data.data.notifications;
        const latestNotification = notifications[0];
        
        console.log('📋 Latest notification details:');
        console.log(`   Title: ${latestNotification.title}`);
        console.log(`   Message: ${latestNotification.message}`);
        console.log(`   Link: ${latestNotification.link}`);
        console.log(`   Created: ${latestNotification.createdAt}`);
      }
    } else {
      console.log('❌ FAILED: No new notification was created');
    }

    // Step 6: Test marking notifications as read
    console.log('\n5️⃣ Testing mark all as read...');
    const markReadResponse = await axios.put(`${API_BASE_URL}/notifications/mark-all-read`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (markReadResponse.data.success) {
      console.log('✅ All notifications marked as read');
      
      // Check count again
      const finalCountResponse = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const finalCount = finalCountResponse.data.data.unreadCount;
      console.log(`📊 Final unread notifications: ${finalCount}`);
    }

    console.log('\n🎉 Notification system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testNotificationSystem();
