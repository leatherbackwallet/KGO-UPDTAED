# MongoDB URI Master Reference

## ⚠️ **CRITICAL: CORRECT MONGODB URI**

### ✅ **USE THIS URI ONLY**
```
mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net
```

### ❌ **NEVER USE THIS URI**
```
mongodb+srv://dev:JthEecxEt7J4BYN5@improov-dev.u8zpctx.mongodb.net/keralagiftsonline?retryWrites=true&w=majority
```

## 🚫 **ABSOLUTELY FORBIDDEN: LOCAL MONGODB**

### ❌ **NEVER USE LOCAL MONGODB**
```
mongodb://localhost:27017/keralagiftsonline
mongodb://127.0.0.1:27017/keralagiftsonline
mongodb://localhost:27017
mongodb://127.0.0.1:27017
```

### ⚠️ **WHY LOCAL MONGODB IS FORBIDDEN**
1. **Production Requirement**: This application must always use MongoDB Atlas
2. **Data Consistency**: All data must be in the cloud database
3. **Security**: Local databases are not secure for production
4. **Scalability**: Atlas provides better scalability and reliability
5. **Backup**: Atlas provides automatic backups and disaster recovery

### 🔒 **ENFORCEMENT**
- **Server Validation**: The server will exit if local MongoDB is detected
- **Setup Script Validation**: Admin setup script validates Atlas connection
- **Runtime Checks**: Application validates URI format on startup
- **Documentation**: All docs emphasize Atlas requirement

## 🔧 **Database Connection Details**

| Component | Value |
|-----------|-------|
| **Protocol** | `mongodb+srv://` |
| **Username** | `castlebek` |
| **Password** | `uJrTGo7E47HiEYpf` |
| **Cluster** | `keralagiftsonline.7oukp55.mongodb.net` |
| **Database** | `keralagiftsonline` |
| **Provider** | MongoDB Atlas |

## 📝 **Files That Must Use Correct URI**

### ✅ **Updated Files**
- `backend/.env` - Actual environment file
- `backend/env.example` - Example environment file
- `backend/DATABASE_MANAGEMENT.md` - Database management guide
- `backend/CRUD_OPERATIONS_GUIDE.md` - CRUD operations guide
- `backend/ADMIN_SETUP.md` - Admin setup guide
- `backend/SEEDING_REMOVAL_SUMMARY.md` - Seeding removal summary
- `backend/MONGODB_URI_MASTER_REFERENCE.md` - This file

### 🔍 **Files to Check**
- Any new documentation files
- Any new scripts
- Any deployment configurations
- Any CI/CD pipelines

## 🛡️ **Security Guidelines**

### ✅ **Do's**
- ✅ Use environment variables for the URI
- ✅ Keep `.env` files out of version control
- ✅ Use the correct URI in all documentation
- ✅ Rotate passwords regularly
- ✅ Use strong passwords
- ✅ **ALWAYS use MongoDB Atlas**

### ❌ **Don'ts**
- ❌ Never commit `.env` files to git
- ❌ Never use the old/incorrect URI
- ❌ Never hardcode the URI in source code
- ❌ Never share credentials publicly
- ❌ **NEVER use local MongoDB**
- ❌ Never use `localhost` or `127.0.0.1` for database

## 🔄 **Environment Variable Setup**

### **Required in .env file**
```bash
MONGODB_URI=mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net
```

### **Example .env file**
```bash
# Database Configuration
# ⚠️ CRITICAL: ONLY USE MONGODB ATLAS - NEVER USE LOCAL MONGODB
# ❌ DO NOT USE: mongodb://localhost:27017/keralagiftsonline
# ✅ ONLY USE: mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net
MONGODB_URI=mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Admin User Configuration
ADMIN_EMAIL=admin@keralagiftsonline.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_PHONE=+49123456789
CREATE_SUPERUSER=false

# Server Configuration
PORT=5001
NODE_ENV=development
```

## 🧪 **Testing the Connection**

### **Test with curl**
```bash
curl -X GET "http://localhost:5001/api/products" -H "Content-Type: application/json"
```

### **Test with MongoDB shell**
```bash
mongosh "mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net"
```

### **Test with MongoDB Compass**
- Paste the URI into the connection string field
- Test connection

## 📊 **Database Status**

### **Current Collections**
- `users` - User accounts
- `roles` - User roles and permissions
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Customer orders
- `reviews` - Product reviews
- `transactions` - Payment transactions
- `notifications` - System notifications

### **Current Data**
- **Users**: 1 admin user
- **Roles**: 1 admin role
- **Products**: 0 (must be added manually)
- **Categories**: 0 (must be added manually)

## 🚨 **Troubleshooting**

### **Connection Issues**
1. **Check URI**: Ensure you're using the correct Atlas URI
2. **Check credentials**: Verify username and password
3. **Check network**: Ensure MongoDB Atlas is accessible
4. **Check IP whitelist**: Ensure your IP is whitelisted in Atlas

### **Authentication Issues**
1. **Check username**: `castlebek`
2. **Check password**: `uJrTGo7E47HiEYpf`
3. **Check database**: `keralagiftsonline`

### **Common Mistakes**
1. **Wrong URI**: Using the old URI instead of the correct one
2. **Wrong credentials**: Using old username/password
3. **Wrong database**: Connecting to wrong database
4. **Network issues**: Firewall blocking connection
5. **Local MongoDB**: Trying to use localhost (FORBIDDEN)

### **Local MongoDB Detection**
If you see this error:
```
❌ ERROR: MongoDB Atlas must be used. Local MongoDB is not allowed.
❌ Current URI: mongodb://localhost:27017/keralagiftsonline
```

**Solution**: Update your `.env` file with the correct Atlas URI.

## 📋 **Checklist for New Developers**

### **Setup Checklist**
- [ ] Use correct MongoDB Atlas URI in `.env` file
- [ ] **NEVER use local MongoDB**
- [ ] Test database connection
- [ ] Verify admin user creation
- [ ] Check all API endpoints work
- [ ] Verify frontend can connect to backend

### **Documentation Checklist**
- [ ] Update all documentation with correct URI
- [ ] Remove any references to old URI
- [ ] Add security warnings about credentials
- [ ] Include connection testing instructions
- [ ] **Emphasize Atlas requirement**

## 🔄 **Migration Notes**

### **From Old URI to New URI**
1. **Update .env file**: Replace old URI with new Atlas URI
2. **Test connection**: Verify database connectivity
3. **Update documentation**: Fix all documentation files
4. **Verify functionality**: Test all features work

### **From Local MongoDB to Atlas**
1. **Stop using local MongoDB**: Remove any local MongoDB references
2. **Update .env file**: Use Atlas URI only
3. **Test connection**: Verify Atlas connectivity
4. **Migrate data**: If needed, export from local and import to Atlas

### **Data Migration**
- **No data loss**: All existing data is preserved
- **Same database**: Using the same MongoDB Atlas cluster
- **Same collections**: All collections remain intact
- **Same users**: All user accounts remain active

## 📞 **Support Information**

### **If You Need Help**
1. **Check this document first**: All answers are here
2. **Verify URI**: Ensure you're using the correct Atlas URI
3. **Test connection**: Use the testing commands above
4. **Check logs**: Look for connection errors in server logs

### **Emergency Contacts**
- **Database Admin**: castlebek
- **Cluster**: keralagiftsonline.7oukp55.mongodb.net
- **Provider**: MongoDB Atlas

## 🎯 **Key Takeaways**

1. **Always use the correct URI**: `mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net`
2. **Never use the old URI**: `mongodb+srv://dev:JthEecxEt7J4BYN5@improov-dev.u8zpctx.mongodb.net/keralagiftsonline?retryWrites=true&w=majority`
3. **NEVER use local MongoDB**: `mongodb://localhost:27017/keralagiftsonline` is FORBIDDEN
4. **Keep credentials secure**: Never commit `.env` files to version control
5. **Test connections**: Always test database connectivity after changes
6. **Update documentation**: Keep all documentation current with correct URI

---

**⚠️ REMEMBER: This is the ONLY correct MongoDB URI for this project!**
```
mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net
```

**🚫 NEVER USE LOCAL MONGODB!**
```
mongodb://localhost:27017/keralagiftsonline
```
