# 🚀 KeralGiftsOnline Deployment Guide
## Deploying to GoDaddy Domain: keralagiftsonline.in

This guide will walk you through deploying your full-stack application to your GoDaddy domain.

## 📋 Prerequisites

1. **GoDaddy Domain**: `keralagiftsonline.in` (already purchased)
2. **MongoDB Atlas**: Cloud database (required per project rules)
3. **Cloudinary Account**: For image/CDN hosting
4. **Netlify Account**: For frontend deployment (recommended)
5. **Railway/Render/Heroku Account**: For backend deployment

## 🎯 Deployment Strategy

- **Frontend**: Deploy to Netlify (optimized for Next.js)
- **Backend**: Deploy to Railway/Render/Heroku
- **Database**: MongoDB Atlas (already configured)
- **CDN**: Cloudinary (for images)
- **Domain**: Point GoDaddy domain to deployed services

---

## 🔧 Step 1: Prepare Your Environment Variables

### Backend Environment Variables
Create `.env` file in `backend/` directory:

```env
# Database Configuration (MUST use MongoDB Atlas)
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/keralagiftsonline?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-token-secret-minimum-32-characters-long

# Admin Configuration
ADMIN_EMAIL=admin@keralagiftsonline.in
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_PHONE=+918075030919

# Server Configuration
PORT=5001
NODE_ENV=production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS Configuration (update with your domain)
CORS_ORIGIN=https://keralagiftsonline.in,https://www.keralagiftsonline.in

# Security Configuration
SESSION_SECRET=your-session-secret-minimum-32-characters-long
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
```

### Frontend Environment Variables
Create `.env.production` file in `frontend/` directory:

```env
# API Configuration (update with your backend URL)
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api

# Next.js Configuration
NEXT_PUBLIC_APP_NAME=KeralGiftsOnline
NEXT_PUBLIC_APP_VERSION=3.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false

# WhatsApp Business Integration
NEXT_PUBLIC_WHATSAPP_NUMBER=+918075030919
```

---

## 🌐 Step 2: Deploy Backend to Railway/Render/Heroku

### Option A: Railway (Recommended)

1. **Sign up** at [railway.app](https://railway.app)
2. **Connect your GitHub repository**
3. **Create new project** and select your repository
4. **Set environment variables** in Railway dashboard:
   - Copy all variables from your backend `.env` file
   - Update `CORS_ORIGIN` to include your domain
5. **Deploy** - Railway will automatically detect Node.js and deploy
6. **Get your backend URL** (e.g., `https://your-app-name.railway.app`)

### Option B: Render

1. **Sign up** at [render.com](https://render.com)
2. **Create new Web Service**
3. **Connect your GitHub repository**
4. **Configure settings**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. **Set environment variables** in Render dashboard
6. **Deploy** and get your backend URL

### Option C: Heroku

1. **Sign up** at [heroku.com](https://heroku.com)
2. **Install Heroku CLI**
3. **Create new app**:
   ```bash
   heroku create keralagiftsonline-backend
   ```
4. **Set environment variables**:
   ```bash
   heroku config:set MONGODB_URI="your-mongodb-uri"
   heroku config:set JWT_SECRET="your-jwt-secret"
   # ... set all other variables
   ```
5. **Deploy**:
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

---

## ⚡ Step 3: Deploy Frontend to Netlify

1. **Sign up** at [netlify.com](https://netlify.com)
2. **Import your GitHub repository**
3. **Configure project**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
4. **Set environment variables** in Netlify dashboard:
   - Copy all variables from your frontend `.env.production` file
   - Update `NEXT_PUBLIC_API_URL` with your backend URL
5. **Deploy** - Netlify will automatically deploy your Next.js app
6. **Get your frontend URL** (e.g., `https://your-app-name.netlify.app`)

---

## 🔗 Step 4: Configure GoDaddy Domain

### 4.1 Point Domain to Frontend (Netlify)

1. **Log into GoDaddy** and go to your domain management
2. **Navigate to DNS settings** for `keralagiftsonline.in`
3. **Add/Update DNS records**:

   **For Netlify (Frontend)**:
   ```
   Type: CNAME
   Name: @
   Value: your-app-name.netlify.app
   TTL: 600
   ```

   **For www subdomain**:
   ```
   Type: CNAME
   Name: www
   Value: your-app-name.netlify.app
   TTL: 600
   ```

4. **In Netlify dashboard**:
   - Go to your site settings
   - Add custom domain: `keralagiftsonline.in`
   - Add custom domain: `www.keralagiftsonline.in`
   - Follow Netlify's instructions to verify domain ownership

### 4.2 Point API Subdomain to Backend

**Option A: Using subdomain (Recommended)**
```
Type: CNAME
Name: api
Value: your-backend-domain.com
TTL: 600
```

**Option B: Using path-based routing**
- Configure your frontend to proxy API calls to backend
- Update `NEXT_PUBLIC_API_URL` to `/api`

---

## 🔧 Step 5: Configure Next.js for Production

### 5.1 Update next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
```

### 5.2 Update API Configuration

In your frontend code, ensure API calls use the correct URL:

```typescript
// utils/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.keralagiftsonline.in';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});
```

---

## 🛡️ Step 6: Security & SSL Configuration

### 6.1 SSL Certificates
- **Netlify**: Automatically provides SSL certificates
- **Railway/Render/Heroku**: Automatically provides SSL certificates
- **GoDaddy**: Ensure SSL is enabled for your domain

### 6.2 Security Headers
Add security headers to your Next.js app:

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

---

## 🧪 Step 7: Testing Your Deployment

### 7.1 Test Frontend
1. Visit `https://keralagiftsonline.in`
2. Verify all pages load correctly
3. Test responsive design on mobile
4. Check that images load from Cloudinary

### 7.2 Test Backend API
1. Test API endpoints: `https://api.keralagiftsonline.in/api/health`
2. Verify database connections
3. Test file uploads to Cloudinary
4. Check authentication flows

### 7.3 Test Integration
1. Test user registration/login
2. Test product browsing and search
3. Test cart and checkout flow
4. Test admin panel functionality

---

## 📊 Step 8: Monitoring & Analytics

### 8.1 Set up Monitoring
- **Netlify Analytics**: Enable in Netlify dashboard
- **Backend Monitoring**: Use Railway/Render/Heroku built-in monitoring
- **Error Tracking**: Consider Sentry for error monitoring

### 8.2 Performance Optimization
- Enable Next.js Image Optimization
- Configure Cloudinary transformations
- Set up CDN caching
- Monitor Core Web Vitals

---

## 🔄 Step 9: Continuous Deployment

### 9.1 GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          # Railway CLI commands
          # or use Railway's GitHub integration

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Netlify
        run: |
          # Netlify CLI commands
          # or use Netlify's GitHub integration
```

---

## 🚨 Troubleshooting Common Issues

### Domain Not Loading
1. Check DNS propagation (can take 24-48 hours)
2. Verify CNAME records are correct
3. Check SSL certificate status

### API Connection Issues
1. Verify CORS settings in backend
2. Check environment variables
3. Test API endpoints directly

### Image Loading Issues
1. Verify Cloudinary configuration
2. Check image URLs in database
3. Test Cloudinary uploads

### Database Connection Issues
1. Verify MongoDB Atlas connection string
2. Check IP whitelist in Atlas
3. Verify database user permissions

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Check error logs and performance
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Review and optimize database queries
4. **Annually**: Review and update SSL certificates

### Backup Strategy
1. **Database**: MongoDB Atlas provides automatic backups
2. **Code**: GitHub provides version control
3. **Images**: Cloudinary provides redundancy
4. **Environment Variables**: Store securely in deployment platforms

---

## ✅ Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Domain DNS configured correctly
- [ ] SSL certificates active
- [ ] Environment variables set
- [ ] Database connected and working
- [ ] File uploads working
- [ ] Authentication system tested
- [ ] Admin panel accessible
- [ ] Mobile responsiveness verified
- [ ] Performance optimized
- [ ] Monitoring configured
- [ ] Backup strategy in place

---

## 🎉 Congratulations!

Your KeralGiftsOnline website is now live at `https://keralagiftsonline.in`!

**Next Steps:**
1. Set up Google Analytics
2. Configure email notifications
3. Set up payment gateway integration
4. Plan marketing and SEO strategy
5. Monitor performance and user feedback

For ongoing support and updates, refer to your project documentation and deployment platform dashboards.
