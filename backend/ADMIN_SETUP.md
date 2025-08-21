# Admin User Setup Guide

## Problem
The superuser and admin role were being created every time the website was launched, which is not the desired behavior.

## Solution
We've implemented a controlled approach to admin user creation with multiple options.

## Option 1: One-Time Setup (Recommended)

### Step 1: Set Environment Variables
Add these to your `.env` file:
```bash
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

## Option 2: Automatic Creation on Startup

If you want the admin user to be created automatically when the server starts:

### Step 1: Set Environment Variables
```bash
ADMIN_EMAIL=admin@keralagiftsonline.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_PHONE=+49123456789
CREATE_SUPERUSER=true
```

### Step 2: Start the Server
```bash
npm run dev
```

The admin user will be created on the first startup only.

## Option 3: Manual Database Seeding

If you want to use the full seeding system:

```bash
cd backend
npm run seed
```

This will create all roles, users, and sample data.

## Security Best Practices

1. **Change Default Password**: Always change the default password after first login
2. **Use Strong Passwords**: Use passwords with at least 12 characters, including uppercase, lowercase, numbers, and symbols
3. **Environment Variables**: Never commit passwords to version control
4. **Regular Rotation**: Change admin passwords regularly
5. **Access Control**: Limit admin access to necessary personnel only

## Troubleshooting

### Admin User Not Created
1. Check if `CREATE_SUPERUSER=true` is set in your `.env` file
2. Verify MongoDB connection
3. Check server logs for errors
4. Run the setup script manually: `npm run setup-admin`

### Duplicate Admin Users
1. Check your database for existing admin users
2. Use the setup script which checks for existing users
3. Clear the database and re-seed if needed

### Permission Issues
1. Ensure the admin role has `['*']` permissions
2. Check if the user is properly linked to the admin role
3. Verify the role ID in the user document

## Database Queries

### Check Existing Admin Users
```javascript
// In MongoDB shell or Compass
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

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ADMIN_EMAIL` | Admin user email | `admin@keralagiftsonline.com` | No |
| `ADMIN_PASSWORD` | Admin user password | `SuperSecure123!` | No |
| `ADMIN_PHONE` | Admin user phone | `+49123456789` | No |
| `CREATE_SUPERUSER` | Enable automatic creation | `false` | No |

## Migration from Old System

If you're migrating from the old system where admin users were created automatically:

1. **Backup your database**
2. **Set `CREATE_SUPERUSER=false`** in your `.env` file
3. **Restart your server** - no new admin users will be created
4. **Use existing admin credentials** or run the setup script to create new ones
