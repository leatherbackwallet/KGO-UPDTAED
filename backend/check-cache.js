const NodeCache = require('node-cache');

// Create cache instance with same configuration as middleware
const cache = new NodeCache({ 
  stdTTL: 300,
  checkperiod: 600,
  useClones: false
});

function checkCache() {
  console.log('🔍 Checking Cache...');
  
  const keys = cache.keys();
  console.log(`📊 Total cache keys: ${keys.length}`);
  
  if (keys.length > 0) {
    console.log('\n📋 Cache keys:');
    keys.forEach((key, index) => {
      console.log(`${index + 1}. ${key}`);
    });
  }
  
  // Check for product-related cache keys
  const productKeys = keys.filter(key => key.includes('products:'));
  console.log(`\n📦 Product cache keys: ${productKeys.length}`);
  
  if (productKeys.length > 0) {
    console.log('\n📋 Product cache keys:');
    productKeys.forEach((key, index) => {
      const cachedData = cache.get(key);
      console.log(`${index + 1}. ${key}`);
      if (cachedData && cachedData.data) {
        console.log(`   - Cached products: ${cachedData.data.length}`);
        if (cachedData.data.length > 0) {
          console.log(`   - First product: ${cachedData.data[0].name}`);
        }
      }
    });
  }
}

checkCache();
