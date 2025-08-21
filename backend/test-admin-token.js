const jwt = require('jsonwebtoken');

// Generate admin token with correct JWT secret
const adminToken = jwt.sign(
  {
    id: 'admin',
    roleName: 'admin',
    email: 'admin@keralagiftsonline.com'
  },
  'your-super-secret-jwt-key-here',
  { expiresIn: '7d' }
);

console.log('Admin Token:', adminToken);
console.log('\nTest command:');
console.log(`curl -H "Authorization: Bearer ${adminToken}" http://localhost:5001/api/orders`);
