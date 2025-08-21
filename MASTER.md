# 🌟 Kerala Gifts Online - Master Configuration Guide

> **Critical Reference Document** - Keep this secure and up-to-date

## 🔐 Essential Credentials & Configuration

### 📊 **MongoDB Atlas Database**
```
Connection URI: mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline

Database Name: keralagiftsonline
Cluster: keralagiftsonline.7oukp55.mongodb.net
Username: castlebek
Password: uJrTGo7E47HiEYpf
App Name: KeralaGiftsOnline
```

⚠️ **CRITICAL**: Always include `/keralagiftsonline` in the URI to connect to the correct database!

### 👨‍💼 **Super Admin Account**
```
Email: admin@keralagiftsonline.com
Password: SuperSecure123!
Phone: +49123456789
Role: admin
```

### 🗄️ **Database Collections**
The `keralagiftsonline` database contains **32 collections**:

**Core Collections:**
- `products` (4 products currently)
- `categories` (5 categories: Flowers, Cakes, Gifts, Chocolates, Plants)
- `vendors` (2 vendors: Artisan Cakes & Pastries, Sweet Dreams Bakery)
- `users`
- `orders`
- `reviews`

**Product Management:**
- `productattributes`
- `vendorproducts`
- `wishlists`
- `product-images.files`
- `product-images.chunks`

**Business Operations:**
- `subscriptions`
- `analytics`
- `notifications`
- `transactions`
- `ledgers`
- `payouts`

**Support & Admin:**
- `supporttickets`
- `activitylogs`
- `roles`
- `userpreferences`

## 🚀 **Quick Start Guide**

### 1. **Environment Setup**

**Backend (.env):**
```bash
# Database Configuration
MONGODB_URI=mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline

# Server Configuration
PORT=5001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Admin Configuration
CREATE_SUPERUSER=true
ADMIN_EMAIL=admin@keralagiftsonline.com
ADMIN_PASSWORD=SuperSecure123!
ADMIN_PHONE=+49123456789

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-complex
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
```

**Frontend (.env.local):**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001/api

# Next.js Configuration
NEXT_PUBLIC_APP_NAME=KeralGiftsOnline
NEXT_PUBLIC_APP_VERSION=3.0.0

# Disable Fast Refresh/HMR
FAST_REFRESH=false

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
```

### 2. **Starting the Application**

**Method 1: Start Both (Recommended)**
```bash
npm run dev
```

**Method 2: Start Individually**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api
- Products API: http://localhost:5001/api/products

### 3. **Database Verification**

**Check Connection:**
```bash
cd backend
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline')
.then(() => {
  console.log('✅ Connected to:', mongoose.connection.db.databaseName);
  mongoose.connection.close();
})
.catch(err => console.error('❌ Connection failed:', err.message));
"
```

## 📦 **Current Database Content**

### Products (4 items):
1. **P cake** (ID: `687e1e48ccfb59b85d4f8355`)
2. **Test 2** (ID: `687e222a4f5f12b5c68367ff`)
3. **50 Yellow Roses** (ID: `687e2e9412fc229f584b98ce`)
4. **1 KG Black Forest Cake with Mixed Roses** (ID: `6880f59fee4b03cff6a3b9e1`)

### Categories (5 items):
- Flowers
- Cakes
- Gifts
- Chocolates
- Plants

### Vendors (2 items):
- Artisan Cakes & Pastries
- Sweet Dreams Bakery

## 🔧 **Common Issues & Solutions**

### ❌ **"Products not showing in UI"**
**Cause**: Connecting to wrong database (usually `test` instead of `keralagiftsonline`)
**Solution**: Ensure MongoDB URI includes `/keralagiftsonline`:
```bash
mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline
```

### ❌ **"Port 5001 already in use"**
**Solution**: Kill existing process and restart:
```bash
lsof -ti:5001 | xargs kill -9
cd backend && npm run dev
```

### ❌ **"Cannot connect to MongoDB"**
**Solution**: Check network and credentials:
```bash
# Test connection
mongosh "mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline"
```

### ❌ **"CORS errors in browser"**
**Solution**: Ensure backend CORS_ORIGIN matches frontend URL:
```bash
CORS_ORIGIN=http://localhost:3000
```

## 🛠️ **Development Tools**

### **API Testing**
```bash
# Get all products
curl "http://localhost:5001/api/products"

# Get categories
curl "http://localhost:5001/api/categories"

# Health check
curl "http://localhost:5001/api/health"
```

### **Database Tools**
```bash
# Connect via MongoDB Shell
mongosh "mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline"

# Backup database
mongodump --uri="mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline" --out=./backup-$(date +%Y%m%d)
```

## 🔒 **Security Notes**

- ⚠️ **Never commit .env files to version control**
- 🔐 **Rotate JWT_SECRET in production**
- 🛡️ **Use strong admin passwords**
- 🔑 **MongoDB credentials are read-only in this config**
- 🌐 **Update CORS_ORIGIN for production domains**

## 📞 **Support & Maintenance**

### **Log Files**
- Backend logs: Console output from `npm run dev`
- Frontend logs: Browser console and terminal
- MongoDB logs: Available in Atlas dashboard

### **Monitoring**
- API endpoints: http://localhost:5001/api/health
- Database status: MongoDB Atlas dashboard
- Frontend status: http://localhost:3000

---

## ⚡ **Quick Commands Reference**

```bash
# Start everything
npm run dev

# Backend only
cd backend && npm run dev

# Frontend only  
cd frontend && npm run dev

# Test API
curl "http://localhost:5001/api/products" | jq '.'

# Check database
node -e "console.log(process.env.MONGODB_URI)" 

# Kill servers
pkill -f "nodemon|next"
```

---

*Last Updated: August 21, 2025*
*Version: 3.0.0*
*Database: keralagiftsonline (4 products, 32 collections)*
