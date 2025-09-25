/**
 * Product Update Test Script
 * Tests the enhanced product update functionality
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

// Test configuration
const testConfig = {
  adminToken: process.env.ADMIN_TOKEN || 'your-admin-token-here',
  testProductId: process.env.TEST_PRODUCT_ID || 'your-test-product-id-here'
};

// Test data for product update
const testUpdateData = {
  name: 'Updated Test Product',
  description: 'This is an updated test product description',
  price: 299,
  categories: ['category-id-1', 'category-id-2'],
  stock: 150,
  costPrice: 200,
  isFeatured: true,
  isCombo: false,
  comboBasePrice: 0,
  comboItems: []
};

// Test data for combo product update
const testComboUpdateData = {
  name: 'Updated Combo Test Product',
  description: 'This is an updated combo test product',
  price: 599,
  categories: ['category-id-1'],
  stock: 100,
  costPrice: 400,
  isFeatured: false,
  isCombo: true,
  comboBasePrice: 50,
  comboItems: [
    {
      name: 'Item 1',
      unitPrice: 100,
      defaultQuantity: 2,
      unit: 'piece'
    },
    {
      name: 'Item 2',
      unitPrice: 150,
      defaultQuantity: 1,
      unit: 'kg'
    }
  ]
};

// Test data with validation errors
const testInvalidData = {
  name: '', // Invalid: empty name
  description: '', // Invalid: empty description
  price: -10, // Invalid: negative price
  categories: [], // Invalid: empty categories
  stock: -5, // Invalid: negative stock
  isCombo: true,
  comboItems: [
    {
      name: '', // Invalid: empty name
      unitPrice: -10, // Invalid: negative price
      defaultQuantity: -1, // Invalid: negative quantity
      unit: '' // Invalid: empty unit
    }
  ]
};

async function testProductUpdate() {
  console.log('🧪 Starting Product Update Tests...\n');
  
  try {
    // Test 1: Valid product update
    console.log('📝 Test 1: Valid Product Update');
    console.log('Data:', JSON.stringify(testUpdateData, null, 2));
    
    const response1 = await axios.put(
      `${API_BASE}/products/${testConfig.testProductId}`,
      testUpdateData,
      {
        headers: {
          'Authorization': `Bearer ${testConfig.adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Response:', response1.status, response1.data);
    console.log('✅ Test 1 PASSED: Valid product update successful\n');
    
  } catch (error) {
    console.error('❌ Test 1 FAILED:', error.response?.data || error.message);
    console.log('');
  }
  
  try {
    // Test 2: Combo product update
    console.log('📝 Test 2: Combo Product Update');
    console.log('Data:', JSON.stringify(testComboUpdateData, null, 2));
    
    const response2 = await axios.put(
      `${API_BASE}/products/${testConfig.testProductId}`,
      testComboUpdateData,
      {
        headers: {
          'Authorization': `Bearer ${testConfig.adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Response:', response2.status, response2.data);
    console.log('✅ Test 2 PASSED: Combo product update successful\n');
    
  } catch (error) {
    console.error('❌ Test 2 FAILED:', error.response?.data || error.message);
    console.log('');
  }
  
  try {
    // Test 3: Invalid data validation
    console.log('📝 Test 3: Invalid Data Validation');
    console.log('Data:', JSON.stringify(testInvalidData, null, 2));
    
    const response3 = await axios.put(
      `${API_BASE}/products/${testConfig.testProductId}`,
      testInvalidData,
      {
        headers: {
          'Authorization': `Bearer ${testConfig.adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('❌ Test 3 FAILED: Should have returned validation errors');
    console.log('Response:', response3.status, response3.data);
    
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Test 3 PASSED: Validation errors caught as expected');
      console.log('Validation errors:', error.response.data.error);
    } else {
      console.error('❌ Test 3 FAILED: Unexpected error:', error.response?.data || error.message);
    }
    console.log('');
  }
  
  try {
    // Test 4: Non-existent product
    console.log('📝 Test 4: Non-existent Product');
    
    const response4 = await axios.put(
      `${API_BASE}/products/507f1f77bcf86cd799439011`, // Non-existent ID
      testUpdateData,
      {
        headers: {
          'Authorization': `Bearer ${testConfig.adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('❌ Test 4 FAILED: Should have returned 404');
    console.log('Response:', response4.status, response4.data);
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Test 4 PASSED: 404 error for non-existent product');
      console.log('Error:', error.response.data.error);
    } else {
      console.error('❌ Test 4 FAILED: Unexpected error:', error.response?.data || error.message);
    }
    console.log('');
  }
  
  try {
    // Test 5: Unauthorized access
    console.log('📝 Test 5: Unauthorized Access');
    
    const response5 = await axios.put(
      `${API_BASE}/products/${testConfig.testProductId}`,
      testUpdateData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('❌ Test 5 FAILED: Should have returned 401');
    console.log('Response:', response5.status, response5.data);
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Test 5 PASSED: 401 error for unauthorized access');
      console.log('Error:', error.response.data);
    } else {
      console.error('❌ Test 5 FAILED: Unexpected error:', error.response?.data || error.message);
    }
    console.log('');
  }
  
  console.log('🏁 Product Update Tests Completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  testProductUpdate().catch(console.error);
}

module.exports = { testProductUpdate };
