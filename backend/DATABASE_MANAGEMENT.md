# Database Management Guide

## Overview
This guide explains how database seeding works and how to prevent accidental data loss.

## ⚠️ Important: Data Protection

### What Happened to Your Previous Products
Your previously added products were **accidentally deleted** when we ran `npm run seed` because the v3-seeder.js was using `deleteMany()` calls that removed all existing data before creating new seed data.

### Current Status
- ✅ **Fixed**: v3-seeder.js now checks for existing data before seeding
- ✅ **Protected**: No automatic seeding on server startup
- ✅ **Safe**: Running `npm run seed` will not delete existing data

## Seeding Behavior

### Before (Dangerous)
```javascript
// OLD CODE - DELETED ALL DATA
await Product.deleteMany({}); // ❌ This deleted your products
await Product.insertMany(products);
```

### After (Safe)
```javascript
// NEW CODE - PROTECTS EXISTING DATA
const existingProducts = await Product.countDocuments();
if (existingProducts > 0) {
  console.log('Products already exist, skipping...');
  return await Product.find();
}
// Only creates new products if none exist
await Product.insertMany(products);
```

## Available Scripts

### 1. Safe Seeding (Recommended)
```bash
npm run seed
```
- ✅ **Safe**: Won't delete existing data
- ✅ **Smart**: Only creates data if it doesn't exist
- ✅ **Idempotent**: Can run multiple times safely

### 2. Admin Setup
```bash
npm run setup-admin
```
- Creates admin user and role if they don't exist
- Safe to run multiple times

### 3. Product Restoration
```bash
npm run restore-products
```
- Use this to restore products that were accidentally deleted
- Edit the script to add your specific products

## Database Operations

### Check Current Products
```bash
curl -X GET "http://localhost:5001/api/products" -H "Content-Type: application/json"
```

### Check Database Collections
```bash
# Connect to MongoDB and run:
db.products.find().pretty()
db.categories.find().pretty()
db.users.find().pretty()
```

### Backup Database
```bash
# Create a backup before any major operations
mongodump --uri="your-mongodb-uri" --out=./backup-$(date +%Y%m%d)
```

## Preventing Data Loss

### 1. Environment Variables
Set these in your `.env` file:
```bash
# Disable automatic superuser creation
CREATE_SUPERUSER=false

# Database connection
MONGODB_URI=your-mongodb-connection-string
```

### 2. Before Running Scripts
Always check what the script will do:
```bash
# Check current data
curl -X GET "http://localhost:5001/api/products"

# Review script contents
cat backend/scripts/restore-products.js
```

### 3. Use Safe Operations
- ✅ Use `npm run seed` (now safe)
- ✅ Use `npm run setup-admin` (safe)
- ❌ Don't manually run scripts with `deleteMany()`
- ❌ Don't clear database without backup

## Restoring Your Products

### Option 1: Manual Restoration
1. Edit `backend/scripts/restore-products.js`
2. Add your products to the `productsToRestore` array
3. Run: `npm run restore-products`

### Option 2: API Creation
Use the admin interface or API to recreate products:
```bash
curl -X POST "http://localhost:5001/api/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Your Product Name",
    "description": "Your product description",
    "price": 100,
    "stock": 10,
    "categories": ["category-id"],
    "isFeatured": true
  }'
```

### Option 3: Database Backup
If you have a backup:
```bash
# Restore from backup
mongorestore --uri="your-mongodb-uri" ./backup-folder
```

## Current Database State

### Products (4 total)
1. **Birthday Cake** - ₹50 (Featured)
2. **Wedding Cake** - ₹100 (Featured)
3. **Rose Bouquet** - ₹25 (Featured)
4. **Gift Basket Premium** - ₹75

### Categories (4 total)
1. **Celebration Cakes**
2. **Gift Baskets**
3. **Flowers**
4. **Chocolates**

### Users (3 total)
1. **Admin** - admin@keralagiftsonline.com
2. **Customer** - customer@example.com
3. **Vendor** - vendor@example.com

## Troubleshooting

### Products Not Showing
1. Check if backend is running: `curl http://localhost:5001/api/health`
2. Check if products exist: `curl http://localhost:5001/api/products`
3. Check frontend connection: `curl http://localhost:3000`

### Database Connection Issues
1. Verify MongoDB URI in `.env`
2. Check network connectivity
3. Verify database permissions

### Seeding Issues
1. Check if data already exists
2. Verify schema compatibility
3. Check for duplicate slugs/IDs

## Best Practices

### 1. Always Backup Before Changes
```bash
# Create backup
mongodump --uri="your-mongodb-uri" --out=./backup-$(date +%Y%m%d)
```

### 2. Test in Development First
- Use development database for testing
- Never test seeding on production data

### 3. Use Version Control
- Commit database schemas
- Document data migrations
- Keep backup scripts in version control

### 4. Monitor Database Size
```bash
# Check database size
db.stats()
db.products.stats()
```

## Emergency Recovery

### If Data is Lost
1. **Don't panic** - Check if it's just a connection issue
2. **Check backups** - Look for recent backups
3. **Use restoration script** - Add products back manually
4. **Contact support** - If you need help with recovery

### If Seeding Fails
1. Check MongoDB connection
2. Verify schema compatibility
3. Check for duplicate constraints
4. Review error logs

## Future Improvements

### Planned Features
- [ ] Automated backup system
- [ ] Data migration scripts
- [ ] Database health monitoring
- [ ] Rollback capabilities

### Recommendations
- Set up automated daily backups
- Implement data validation
- Add database monitoring
- Create data migration framework
