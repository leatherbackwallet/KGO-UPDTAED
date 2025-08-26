# 🚀 GoDaddy Hosting Deployment Guide
## Deploying KeralGiftsOnline Directly on GoDaddy

This guide will walk you through deploying your full-stack application directly on GoDaddy hosting services.

## 📋 GoDaddy Hosting Requirements

### Required GoDaddy Services:
1. **Domain**: `keralagiftsonline.in` (already purchased)
2. **Web Hosting**: GoDaddy Web Hosting (Linux) with Node.js support
3. **Database**: GoDaddy MySQL Database OR MongoDB Atlas (recommended)
4. **SSL Certificate**: GoDaddy SSL Certificate (included with hosting)

### Recommended GoDaddy Plans:
- **Economy Plan**: Basic hosting (limited Node.js support)
- **Deluxe Plan**: Better performance and features
- **Ultimate Plan**: Best for Node.js applications
- **Business Plan**: Includes dedicated IP and better resources

---

## 🎯 Deployment Strategy for GoDaddy

### Option A: Full GoDaddy Hosting (Recommended for beginners)
- **Frontend**: GoDaddy Web Hosting (static files)
- **Backend**: GoDaddy Node.js Hosting
- **Database**: MongoDB Atlas (external - required per project rules)
- **CDN**: Cloudinary (external)

### Option B: Hybrid Approach
- **Frontend**: GoDaddy Web Hosting
- **Backend**: External service (Railway/Render) + GoDaddy domain
- **Database**: MongoDB Atlas
- **CDN**: Cloudinary

---

## 🔧 Step 1: Prepare Your Application for GoDaddy

### 1.1 Build Frontend for Static Hosting

Since GoDaddy's basic hosting doesn't support Next.js server-side rendering, we need to build a static version:

```bash
cd frontend
npm run build
npm run export  # This creates static files
```

### 1.2 Update Next.js Configuration

Update `frontend/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Static export
  trailingSlash: true,
  images: {
    unoptimized: true,  // Required for static export
    domains: ['res.cloudinary.com'],
  },
  // Remove server-side features
  experimental: {
    appDir: false,
  },
};

module.exports = nextConfig;
```

### 1.3 Update Package.json Scripts

Add export script to `frontend/package.json`:

```json
{
  "scripts": {
    "export": "next build && next export",
    "build:static": "next build && next export"
  }
}
```

---

## 🌐 Step 2: Set Up GoDaddy Hosting

### 2.1 Purchase GoDaddy Web Hosting

1. **Log into GoDaddy** and go to Web Hosting
2. **Choose a plan** (Deluxe or Ultimate recommended)
3. **Select Linux hosting** (required for Node.js)
4. **Complete purchase** and wait for setup

### 2.2 Access Your Hosting Control Panel

1. **Go to GoDaddy Hosting Control Panel**
2. **Access cPanel** or **Plesk** (depending on your plan)
3. **Note your hosting credentials**:
   - FTP/SFTP credentials
   - Database credentials
   - Control panel URL

### 2.3 Set Up Database (Optional - if not using MongoDB Atlas)

If you want to use GoDaddy's MySQL database:

1. **Go to cPanel → Databases**
2. **Create MySQL Database**
3. **Create Database User**
4. **Assign User to Database**
5. **Note the connection details**

---

## 📁 Step 3: Deploy Frontend to GoDaddy

### 3.1 Build Static Frontend

```bash
cd frontend
npm install
npm run build:static
```

This creates a `frontend/out` directory with static files.

### 3.2 Upload Frontend Files

**Option A: Using File Manager (cPanel)**
1. **Go to cPanel → File Manager**
2. **Navigate to `public_html`** (or `www`)
3. **Upload all files** from `frontend/out/` directory
4. **Set permissions**: 644 for files, 755 for directories

**Option B: Using FTP/SFTP**
```bash
# Using FTP client (FileZilla, etc.)
Host: your-domain.com or FTP server
Username: your-ftp-username
Password: your-ftp-password
Port: 21 (FTP) or 22 (SFTP)

# Upload all files from frontend/out/ to public_html/
```

### 3.3 Configure Frontend for GoDaddy

Create `.htaccess` file in `public_html/`:

```apache
# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle Next.js routing
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set Referrer-Policy "origin-when-cross-origin"
```

---

## ⚙️ Step 4: Deploy Backend to GoDaddy

### 4.1 Check Node.js Support

1. **Go to cPanel → Node.js**
2. **Check if Node.js is available** (version 18+ required)
3. **If not available**, contact GoDaddy support or upgrade plan

### 4.2 Prepare Backend for GoDaddy

Update `backend/server.ts` for GoDaddy hosting:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration for GoDaddy
app.use(cors({
  origin: [
    'https://keralagiftsonline.in',
    'https://www.keralagiftsonline.in',
    'http://localhost:3000' // for development
  ],
  credentials: true
}));

// ... rest of your server code

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 4.3 Upload Backend Files

1. **Create a subdirectory** in your hosting (e.g., `api` or `backend`)
2. **Upload backend files** to this directory
3. **Set up environment variables** in GoDaddy Node.js panel

### 4.4 Configure Node.js App in GoDaddy

1. **Go to cPanel → Node.js**
2. **Create Node.js App**:
   - **App Name**: `keralagiftsonline-api`
   - **App Root**: `/api` (or your backend directory)
   - **App URL**: `https://keralagiftsonline.in/api`
   - **Node.js Version**: 18.x or higher
   - **Startup File**: `server.js` (or `dist/server.js`)

3. **Set Environment Variables**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/keralagiftsonline
   JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters-long
   JWT_REFRESH_SECRET=your-refresh-token-secret-minimum-32-characters-long
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CORS_ORIGIN=https://keralagiftsonline.in,https://www.keralagiftsonline.in
   NODE_ENV=production
   ```

4. **Start the Node.js App**

---

## 🔗 Step 5: Configure Domain and DNS

### 5.1 Point Domain to GoDaddy Hosting

1. **Go to GoDaddy Domain Management**
2. **Navigate to DNS settings** for `keralagiftsonline.in`
3. **Update DNS records**:

   **For GoDaddy Hosting**:
   ```
   Type: A
   Name: @
   Value: [Your GoDaddy hosting IP address]
   TTL: 600
   ```

   **For www subdomain**:
   ```
   Type: CNAME
   Name: www
   Value: keralagiftsonline.in
   TTL: 600
   ```

### 5.2 Configure Subdomain for API (Optional)

If you want a separate subdomain for your API:

```
Type: A
Name: api
Value: [Your GoDaddy hosting IP address]
TTL: 600
```

Then configure your Node.js app to handle requests on `api.keralagiftsonline.in`.

---

## 🛡️ Step 6: SSL and Security Configuration

### 6.1 Enable SSL Certificate

1. **Go to cPanel → SSL/TLS**
2. **Install SSL Certificate** (usually included with hosting)
3. **Force HTTPS redirect** (see .htaccess above)

### 6.2 Security Headers

Add to your `.htaccess` file:

```apache
# Security Headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set Referrer-Policy "origin-when-cross-origin"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
```

---

## 🔧 Step 7: Update Frontend Configuration

### 7.1 Update API Configuration

Update your frontend environment variables:

```env
# .env.production
NEXT_PUBLIC_API_URL=https://keralagiftsonline.in/api
NEXT_PUBLIC_APP_NAME=KeralGiftsOnline
NEXT_PUBLIC_WHATSAPP_NUMBER=+918075030919
```

### 7.2 Update API Client

Ensure your API client points to the correct URL:

```typescript
// utils/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://keralagiftsonline.in/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});
```

---

## 🧪 Step 8: Testing Your GoDaddy Deployment

### 8.1 Test Frontend
1. Visit `https://keralagiftsonline.in`
2. Verify all pages load correctly
3. Test responsive design
4. Check that images load from Cloudinary

### 8.2 Test Backend API
1. Test API endpoints: `https://keralagiftsonline.in/api/health`
2. Verify database connections
3. Test file uploads to Cloudinary
4. Check authentication flows

### 8.3 Test Integration
1. Test user registration/login
2. Test product browsing and search
3. Test cart and checkout flow
4. Test admin panel functionality

---

## 🚨 Troubleshooting GoDaddy Hosting Issues

### Common Issues and Solutions

**Node.js App Not Starting**
- Check Node.js version compatibility
- Verify startup file path
- Check environment variables
- Review error logs in cPanel

**Frontend Not Loading**
- Verify files are in `public_html` directory
- Check file permissions (644 for files, 755 for directories)
- Verify .htaccess configuration
- Check SSL certificate status

**API Connection Issues**
- Verify CORS settings
- Check API URL configuration
- Test API endpoints directly
- Review Node.js app logs

**Database Connection Issues**
- Verify MongoDB Atlas connection string
- Check IP whitelist in Atlas
- Test database connection locally first

**SSL Certificate Issues**
- Wait 24-48 hours for certificate activation
- Check certificate installation in cPanel
- Verify domain DNS settings

---

## 📊 Step 9: Performance Optimization

### 9.1 Frontend Optimization
- Enable Gzip compression in .htaccess
- Optimize images for web
- Minify CSS and JavaScript
- Use CDN for static assets

### 9.2 Backend Optimization
- Enable Node.js clustering
- Implement caching strategies
- Optimize database queries
- Monitor resource usage

### 9.3 .htaccess Optimizations

```apache
# Enable Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

---

## 📞 GoDaddy Support and Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Check error logs in cPanel
2. **Monthly**: Update Node.js dependencies
3. **Quarterly**: Review hosting performance
4. **Annually**: Renew hosting and SSL certificates

### GoDaddy Support Resources
- **24/7 Phone Support**: Available with most plans
- **Live Chat**: Available in GoDaddy dashboard
- **Knowledge Base**: Extensive documentation
- **Community Forums**: User community support

---

## ✅ GoDaddy Deployment Checklist

- [ ] GoDaddy hosting plan purchased
- [ ] Frontend built and uploaded to public_html
- [ ] Backend uploaded and Node.js app configured
- [ ] Environment variables set in GoDaddy
- [ ] Domain DNS configured correctly
- [ ] SSL certificate installed and active
- [ ] .htaccess file configured
- [ ] Database connected and working
- [ ] File uploads working
- [ ] Authentication system tested
- [ ] Admin panel accessible
- [ ] Mobile responsiveness verified
- [ ] Performance optimized
- [ ] Monitoring configured

---

## 💰 Cost Comparison

### GoDaddy Hosting Costs (Monthly)
- **Economy Plan**: $5-10/month
- **Deluxe Plan**: $10-15/month
- **Ultimate Plan**: $15-25/month
- **Business Plan**: $25-40/month

### Additional Costs
- **Domain**: $10-15/year (already purchased)
- **SSL Certificate**: Usually included
- **MongoDB Atlas**: $0-57/month (depending on usage)
- **Cloudinary**: $0-89/month (depending on usage)

### Total Estimated Monthly Cost
- **Basic Setup**: $15-25/month
- **Professional Setup**: $30-50/month

---

## 🎉 Congratulations!

Your KeralGiftsOnline website is now live on GoDaddy hosting at:
**https://keralagiftsonline.in**

**Advantages of GoDaddy Hosting:**
- ✅ All-in-one solution
- ✅ 24/7 customer support
- ✅ Integrated domain management
- ✅ Easy SSL certificate setup
- ✅ Familiar interface

**Next Steps:**
1. Set up Google Analytics
2. Configure email hosting
3. Set up payment gateway integration
4. Plan marketing and SEO strategy
5. Monitor performance and user feedback

For ongoing support, use GoDaddy's 24/7 customer support and refer to your hosting control panel for monitoring and management tools.
