# Database Management Guide

## Overview
This guide explains the simplified database setup for KeralGiftsOnline.

## Current Setup
- ✅ **No Automatic Seeding**: The application does not automatically seed any data
- ✅ **Superuser Only**: Only creates admin role and superuser when needed
- ✅ **Manual Data Management**: All products, categories, and other data must be added manually
- ✅ **Safe Operations**: No risk of data loss from seeding operations

## What's Available

### 1. Superuser Creation Only
The application will only create:
- **Admin Role**: System administrator with full access
- **Admin User**: Superuser account for system administration

### 2. No Automatic Data Seeding
The following will NOT be automatically created:
- ❌ Products
- ❌ Categories
- ❌ Sample users
- ❌ Sample orders
- ❌ Sample data of any kind

## Available Scripts

### 1. Admin Setup
```bash
npm run setup-admin
```
- ✅ **Safe**: Creates admin role and user if they don't exist
- ✅ **Smart**: Only creates if they don't exist
- ✅ **Idempotent**: Can run multiple times safely

### 2. Development Server
```bash
npm run dev
```
- Starts the development server
- Creates superuser if `CREATE_SUPERUSER=true`

## Environment Variables

### Required
```bash
MONGODB_URI=mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net
JWT_SECRET=your-super-secret-jwt-key-here
```

### Optional (Admin Setup)
```bash
# Admin user configuration
ADMIN_EMAIL=admin@keralagiftsonline.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_PHONE=+49123456789

# Enable automatic superuser creation
CREATE_SUPERUSER=false
```

## Database Operations

### Check Current Data
```bash
# Check products
curl -X GET "http://localhost:5001/api/products" -H "Content-Type: application/json"

# Check categories
curl -X GET "http://localhost:5001/api/categories" -H "Content-Type: application/json"

# Check users
curl -X GET "http://localhost:5001/api/users" -H "Content-Type: application/json"
```

### Add Data Manually

#### 1. Via API (Recommended)
```bash
# Add a product
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

# Add a category
curl -X POST "http://localhost:5001/api/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Your Category Name",
    "slug": "your-category-slug",
    "description": "Your category description"
  }'
```

#### 2. Via Admin Interface
- Use the web admin interface at `/admin`
- Login with admin credentials
- Add products, categories, and other data through the UI

#### 3. Via Database Directly
```bash
# Connect to MongoDB and add data directly
mongosh "mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/?retryWrites=true&w=majority&appName=KeralaGiftsOnline"
```

## Current Database State

### Products
- **0 products** (must be added manually)

### Categories  
- **0 categories** (must be added manually)

### Users
- **1 admin user** (created automatically if enabled)

### Roles
- **1 admin role** (created automatically if enabled)

## Data Management Best Practices

### 1. Use the Admin Interface
- Add products through the web admin interface
- Manage categories and other data via UI
- Use proper validation and error handling

### 2. API Management
- Use the REST API for bulk operations
- Implement proper authentication
- Validate data before adding

### 3. Database Backups
```bash
# Create regular backups
mongodump --uri="mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/?retryWrites=true&w=majority&appName=KeralaGiftsOnline" --out=./backup-$(date +%Y%m%d)

# Restore from backup if needed
mongorestore --uri="mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/?retryWrites=true&w=majority&appName=KeralaGiftsOnline" ./backup-folder
```

### 4. Data Validation
- Always validate data before adding
- Use proper data types and constraints
- Implement business logic validation

## Troubleshooting

### No Products Showing
1. **Check if products exist**: `curl http://localhost:5001/api/products`
2. **Add products manually**: Use admin interface or API
3. **Check frontend connection**: Verify API calls are working

### Admin User Issues
1. **Check if admin exists**: `curl http://localhost:5001/api/users`
2. **Create admin manually**: `npm run setup-admin`
3. **Verify permissions**: Check role assignments

### Database Connection Issues
1. **Verify MongoDB URI**: Check connection string
2. **Check network connectivity**: Ensure MongoDB is accessible
3. **Verify permissions**: Check database user permissions

## Migration from Old System

If you had seeded data before:

1. **Backup existing data** (if any)
2. **Start fresh**: The new system won't create sample data
3. **Add data manually**: Use admin interface or API
4. **Import existing data**: If you have backups, restore them

## Security Considerations

### 1. Admin Access
- Use strong passwords for admin accounts
- Limit admin access to necessary personnel
- Regularly rotate admin passwords

### 2. API Security
- Use proper authentication for API calls
- Implement rate limiting
- Validate all input data

### 3. Database Security
- Use secure MongoDB connections
- Implement proper access controls
- Regular security audits

## Future Considerations

### Planned Features
- [ ] Data import/export functionality
- [ ] Bulk data management tools
- [ ] Data validation framework
- [ ] Automated backup system

### Recommendations
- Set up automated daily backups
- Implement data validation
- Add monitoring and alerting
- Create data migration tools
