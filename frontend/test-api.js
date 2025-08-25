const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API connection...');
    
    const response = await axios.get('http://localhost:5001/api/products');
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', response.data);
    console.log('Products count:', response.data.data?.length || 0);
    
    if (response.data.data && response.data.data.length > 0) {
      const firstProduct = response.data.data[0];
      console.log('First product:', {
        name: firstProduct.name,
        images: firstProduct.images,
        defaultImage: firstProduct.defaultImage
      });
    }
    
  } catch (error) {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();
