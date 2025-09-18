/**
 * Combo Product Flow Test
 * Tests the complete combo product purchase flow including:
 * 1. Product creation with combo configuration
 * 2. Cart addition with combo configurations
 * 3. Order creation with combo pricing
 * 4. Payment processing with combo validation
 */

const axios = require('axios');
const { calculateComboPrice } = require('./utils/comboUtils');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!'
};

let authToken = '';
let testProductId = '';
let testOrderId = '';

// Test data
const comboProductData = {
  name: 'Test Combo Package',
  description: 'A test combo package with multiple items',
  price: 5000, // Base price
  categories: ['64f8b1234567890abcdef123'], // Replace with actual category ID
  stock: 100,
  isCombo: true,
  comboBasePrice: 3000,
  comboItems: [
    {
      name: 'Birthday Cake',
      unitPrice: 500,
      defaultQuantity: 1,
      unit: 'piece'
    },
    {
      name: 'Flowers',
      unitPrice: 200,
      defaultQuantity: 2,
      unit: 'dozen'
    },
    {
      name: 'Chocolates',
      unitPrice: 100,
      defaultQuantity: 1,
      unit: 'box'
    }
  ]
};

const comboConfiguration = [
  {
    name: 'Birthday Cake',
    unitPrice: 500,
    quantity: 2, // Increased from default 1
    unit: 'piece',
    defaultQuantity: 1
  },
  {
    name: 'Flowers',
    unitPrice: 200,
    quantity: 3, // Increased from default 2
    unit: 'dozen',
    defaultQuantity: 2
  },
  {
    name: 'Chocolates',
    unitPrice: 100,
    quantity: 1, // Same as default
    unit: 'box',
    defaultQuantity: 1
  }
];

// Helper functions
const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Request failed: ${method} ${endpoint}`, error.response?.data || error.message);
    throw error;
  }
};

const login = async () => {
  console.log('🔐 Logging in...');
  const response = await makeRequest('POST', '/auth/login', TEST_USER);
  authToken = response.data.accessToken;
  console.log('✅ Login successful');
};

const createComboProduct = async () => {
  console.log('📦 Creating combo product...');
  const response = await makeRequest('POST', '/products', comboProductData, {
    'Authorization': `Bearer ${authToken}`
  });
  testProductId = response.data._id;
  console.log('✅ Combo product created:', testProductId);
  return response.data;
};

const testComboPriceCalculation = () => {
  console.log('🧮 Testing combo price calculation...');
  
  // Expected calculation:
  // Base price: 3000
  // Birthday Cake: (2 - 1) * 500 = 500
  // Flowers: (3 - 2) * 200 = 200
  // Chocolates: (1 - 1) * 100 = 0
  // Total: 3000 + 500 + 200 + 0 = 3700
  
  const calculatedPrice = calculateComboPrice(comboProductData.comboBasePrice, comboConfiguration);
  const expectedPrice = 3700;
  
  if (calculatedPrice === expectedPrice) {
    console.log('✅ Combo price calculation correct:', calculatedPrice);
    return true;
  } else {
    console.error('❌ Combo price calculation incorrect:', calculatedPrice, 'Expected:', expectedPrice);
    return false;
  }
};

const testOrderCreation = async () => {
  console.log('📋 Testing order creation with combo product...');
  
  const orderData = {
    products: [
      {
        product: testProductId,
        quantity: 1,
        isCombo: true,
        comboBasePrice: comboProductData.comboBasePrice,
        comboItemConfigurations: comboConfiguration
      }
    ],
    recipientAddress: {
      name: 'Test Recipient',
      phone: '+1234567890',
      address: {
        streetName: 'Test Street',
        houseNumber: '123',
        postalCode: '12345',
        city: 'Test City',
        countryCode: 'US'
      }
    }
  };
  
  const response = await makeRequest('POST', '/orders', orderData, {
    'Authorization': `Bearer ${authToken}`
  });
  
  testOrderId = response.data._id;
  console.log('✅ Order created:', testOrderId);
  
  // Verify order contains combo data
  if (response.data.orderItems[0].isCombo && 
      response.data.orderItems[0].comboItemConfigurations.length > 0) {
    console.log('✅ Order contains combo configuration');
    return true;
  } else {
    console.error('❌ Order missing combo configuration');
    return false;
  }
};

const testPaymentOrderCreation = async () => {
  console.log('💳 Testing payment order creation...');
  
  const paymentData = {
    products: [
      {
        product: testProductId,
        quantity: 1,
        isCombo: true,
        comboBasePrice: comboProductData.comboBasePrice,
        comboItemConfigurations: comboConfiguration
      }
    ],
    recipientAddress: {
      name: 'Test Recipient',
      phone: '+1234567890',
      address: {
        streetName: 'Test Street',
        houseNumber: '123',
        postalCode: '12345',
        city: 'Test City',
        countryCode: 'US'
      }
    }
  };
  
  try {
    const response = await makeRequest('POST', '/payments/create-order', paymentData, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('✅ Payment order created');
    
    // Verify the amount matches our calculated combo price
    const expectedAmount = 3700; // Our calculated combo price
    if (response.data.amount === expectedAmount) {
      console.log('✅ Payment amount correct:', response.data.amount);
      return true;
    } else {
      console.error('❌ Payment amount incorrect:', response.data.amount, 'Expected:', expectedAmount);
      return false;
    }
  } catch (error) {
    console.error('❌ Payment order creation failed:', error.response?.data || error.message);
    return false;
  }
};

const testComboValidation = async () => {
  console.log('🔍 Testing combo validation...');
  
  // Test 1: Missing combo configuration
  try {
    await makeRequest('POST', '/payments/create-order', {
      products: [
        {
          product: testProductId,
          quantity: 1,
          isCombo: true,
          comboBasePrice: comboProductData.comboBasePrice
          // Missing comboItemConfigurations
        }
      ],
      recipientAddress: {
        name: 'Test Recipient',
        phone: '+1234567890',
        address: {
          streetName: 'Test Street',
          houseNumber: '123',
          postalCode: '12345',
          city: 'Test City',
          countryCode: 'US'
        }
      }
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.error('❌ Should have failed with missing combo configuration');
    return false;
  } catch (error) {
    if (error.response?.data?.error?.code === 'MISSING_COMBO_CONFIG') {
      console.log('✅ Correctly rejected missing combo configuration');
    } else {
      console.error('❌ Wrong error for missing combo configuration:', error.response?.data);
      return false;
    }
  }
  
  // Test 2: Wrong combo base price
  try {
    await makeRequest('POST', '/payments/create-order', {
      products: [
        {
          product: testProductId,
          quantity: 1,
          isCombo: true,
          comboBasePrice: 9999, // Wrong base price
          comboItemConfigurations: comboConfiguration
        }
      ],
      recipientAddress: {
        name: 'Test Recipient',
        phone: '+1234567890',
        address: {
          streetName: 'Test Street',
          houseNumber: '123',
          postalCode: '12345',
          city: 'Test City',
          countryCode: 'US'
        }
      }
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.error('❌ Should have failed with wrong combo base price');
    return false;
  } catch (error) {
    if (error.response?.data?.error?.code === 'COMBO_PRICE_MISMATCH') {
      console.log('✅ Correctly rejected wrong combo base price');
    } else {
      console.error('❌ Wrong error for wrong combo base price:', error.response?.data);
      return false;
    }
  }
  
  return true;
};

const cleanup = async () => {
  console.log('🧹 Cleaning up test data...');
  
  try {
    if (testProductId) {
      await makeRequest('DELETE', `/products/${testProductId}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
      console.log('✅ Test product deleted');
    }
    
    if (testOrderId) {
      await makeRequest('DELETE', `/orders/${testOrderId}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
      console.log('✅ Test order deleted');
    }
  } catch (error) {
    console.error('⚠️ Cleanup failed:', error.message);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Combo Product Flow Tests...\n');
  
  let allTestsPassed = true;
  
  try {
    // Test 1: Login
    await login();
    console.log('');
    
    // Test 2: Create combo product
    await createComboProduct();
    console.log('');
    
    // Test 3: Test price calculation
    if (!testComboPriceCalculation()) {
      allTestsPassed = false;
    }
    console.log('');
    
    // Test 4: Test order creation
    if (!(await testOrderCreation())) {
      allTestsPassed = false;
    }
    console.log('');
    
    // Test 5: Test payment order creation
    if (!(await testPaymentOrderCreation())) {
      allTestsPassed = false;
    }
    console.log('');
    
    // Test 6: Test combo validation
    if (!(await testComboValidation())) {
      allTestsPassed = false;
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    allTestsPassed = false;
  } finally {
    await cleanup();
  }
  
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 All combo product tests passed!');
    console.log('✅ Combo product implementation is working correctly');
  } else {
    console.log('❌ Some tests failed. Please check the implementation.');
  }
  console.log('='.repeat(50));
  
  process.exit(allTestsPassed ? 0 : 1);
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testComboPriceCalculation,
  testOrderCreation,
  testPaymentOrderCreation,
  testComboValidation
};
