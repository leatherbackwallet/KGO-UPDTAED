# Admin User Setup Guide

## Overview
This guide explains how to set up the admin user for your KeralGiftsOnline application.

## Current Setup
- ✅ **No Automatic Seeding**: The application does not automatically seed any data
- ✅ **Superuser Only**: Only creates admin role and superuser when needed
- ✅ **Safe Operations**: No risk of data loss from seeding operations

## ⚠️ IMPORTANT: Correct MongoDB URI

### ✅ **CORRECT DATABASE URI**
```
mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net
```

### ❌ **INCORRECT DATABASE URI (DO NOT USE)**
```
mongodb+srv://dev:JthEecxEt7J4BYN5@improov-dev.u8zpctx.mongodb.net/keralagiftsonline?retryWrites=true&w=majority
```

### 🔧 **Database Connection Details**
- **Protocol**: `mongodb+srv://`
- **Username**: `castlebek`
- **Password**: `uJrTGo7E47HiEYpf`
- **Cluster**: `keralagiftsonline.7oukp55.mongodb.net`
- **Database**: `keralagiftsonline`

## Option 1: Automatic Creation on Startup (Recommended)

### Step 1: Set Environment Variables
Add these to your `.env` file:
```bash
MONGODB_URI=mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net
ADMIN_EMAIL=admin@keralagiftsonline.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_PHONE=+49123456789
CREATE_SUPERUSER=true
```

### Step 2: Start the Server
```bash
cd backend
npm run dev
```

The admin user will be created on the first startup only.

## Option 2: Manual Setup

### Step 1: Set Environment Variables
```bash
MONGODB_URI=mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net
ADMIN_EMAIL=admin@keralagiftsonline.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_PHONE=+49123456789
CREATE_SUPERUSER=false
```

### Step 2: Run Setup Script
```bash
cd backend
npm run setup-admin
```

This will:
- Create the admin role if it doesn't exist
- Create the admin user if it doesn't exist
- Show you the credentials
- Only run once

## Option 3: Disable Automatic Creation

If you want to manage admin users manually:

```bash
# Set in your .env file
MONGODB_URI=mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net
CREATE_SUPERUSER=false
```

Then create admin users through your application's admin interface or API.

## Security Best Practices

1. **Change Default Password**: Always change the default password after first login
2. **Use Strong Passwords**: Use passwords with at least 12 characters, including uppercase, lowercase, numbers, and symbols
3. **Environment Variables**: Never commit passwords to version control
4. **Regular Rotation**: Change admin passwords regularly
5. **Access Control**: Limit admin access to necessary personnel only

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/?retryWrites=true&w=majority&appName=KeralaGiftsOnline` | **YES** |
| `ADMIN_EMAIL` | Admin user email | `admin@keralagiftsonline.com` | No |
| `ADMIN_PASSWORD` | Admin user password | `SuperSecure123!` | No |
| `ADMIN_PHONE` | Admin user phone | `+49123456789` | No |
| `CREATE_SUPERUSER` | Enable automatic creation | `false` | No |

## Available Scripts

### Setup Admin User
```bash
npm run setup-admin
```
- Creates admin role and user if they don't exist
- Safe to run multiple times
- No other data seeding

### Development Server
```bash
npm run dev
```
- Starts the development server
- Creates superuser if `CREATE_SUPERUSER=true`

## Database State

The application will only create:
- **Admin Role**: System administrator with full access
- **Admin User**: Superuser account for system administration

No other data (products, categories, users, etc.) will be automatically created.

## Troubleshooting

### Admin User Not Created
1. Check if `CREATE_SUPERUSER=true` is set in your `.env` file
2. Verify MongoDB connection using the correct URI
3. Check server logs for errors
4. Run the setup script manually: `npm run setup-admin`

### Permission Issues
1. Ensure the admin role has `['*']` permissions
2. Check if the user is properly linked to the admin role
3. Verify the role ID in the user document

### Database Connection Issues
1. **Verify MongoDB URI**: Ensure you're using the correct URI
2. **Check network connectivity**: Ensure MongoDB Atlas is accessible
3. **Verify credentials**: Check username and password
4. **Check IP whitelist**: Ensure your IP is whitelisted in MongoDB Atlas

## Database Queries

### Check Existing Admin Users
```javascript
// In MongoDB shell or Compass
mongosh "mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/?retryWrites=true&w=majority&appName=KeralaGiftsOnline"
db.users.find({email: "admin@keralagiftsonline.com"})
```

### Check Admin Role
```javascript
db.roles.find({name: "admin"})
```

### Delete Admin User (if needed)
```javascript
db.users.deleteOne({email: "admin@keralagiftsonline.com"})
```

## ⚠️ **CRITICAL REMINDER**

**ALWAYS USE THE CORRECT MONGODB URI:**
```
mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net
```

**NEVER USE THE OLD URI:**
```
mongodb+srv://dev:JthEecxEt7J4BYN5@improov-dev.u8zpctx.mongodb.net/keralagiftsonline?retryWrites=true&w=majority
```
