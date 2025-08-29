# 🌟 Kerala Gifts Online - MASTER DEPLOYMENT DOCUMENT
## Complete Environment Variables & Deployment Guide for keralagiftsonline.in

> **⚠️ CRITICAL SECURITY NOTE**: This document contains sensitive information. Keep secure and never commit to version control.

---

## 📊 **PRODUCTION DATABASE - MongoDB Atlas**

### **Live Database Connection**
```bash
# Primary MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline

# Database Details
Database Name: keralagiftsonline
Cluster: keralagiftsonline.7oukp55.mongodb.net
Username: castlebek
Password: uJrTGo7E47HiEYpf
Collections: 32 active collections
Current Products: 4 items
Current Categories: 5 items
Current Vendors: 2 items
```

### **Database Validation**
```bash
# Connection Test Command
mongosh "mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline"

# Quick Connection Verification
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

---

## 🔧 **COMPLETE ENVIRONMENT VARIABLES**

### **Backend Environment Variables (.env)**
```bash
# ================================
# DATABASE CONFIGURATION
# ================================
# ⚠️ CRITICAL: ONLY USE MONGODB ATLAS - NEVER LOCAL MONGODB
MONGODB_URI=mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline

# ================================
# SERVER CONFIGURATION
# ================================
NODE_ENV=production
PORT=5001
LOG_LEVEL=info

# ================================
# JWT & AUTHENTICATION
# ================================
# JWT secrets must be minimum 32 characters
JWT_SECRET=kerala-gifts-online-super-secure-jwt-secret-production-2024-minimum-32-chars
JWT_REFRESH_SECRET=kerala-gifts-online-refresh-token-secret-production-2024-minimum-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
SESSION_SECRET=kerala-gifts-online-session-secret-production-2024-minimum-32-chars

# ================================
# ADMIN CONFIGURATION
# ================================
CREATE_SUPERUSER=true
ADMIN_EMAIL=admin@keralagiftsonline.in
ADMIN_PASSWORD=KeralaGifts2024!SecureAdmin
ADMIN_PHONE=+918075030919

# ================================
# CORS CONFIGURATION
# ================================
# Development
CORS_ORIGIN=http://localhost:3000
# Production (update these for your deployed domains)
# CORS_ORIGIN=https://keralagiftsonline.in,https://www.keralagiftsonline.in,https://api.keralagiftsonline.in

# ================================
# CLOUDINARY CDN CONFIGURATION
# ================================
# Get these from https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# ================================
# FILE UPLOAD CONFIGURATION
# ================================
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# ================================
# SECURITY & RATE LIMITING
# ================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# ================================
# EMAIL CONFIGURATION (Optional)
# ================================
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# EMAIL_FROM=noreply@keralagiftsonline.in

# ================================
# PAYMENT GATEWAY (Future)
# ================================
# RAZORPAY_KEY_ID=your_razorpay_key_id
# RAZORPAY_KEY_SECRET=your_razorpay_key_secret
# STRIPE_SECRET_KEY=your_stripe_secret_key
```

### **Frontend Environment Variables (.env.local)**
```bash
# ================================
# API CONFIGURATION
# ================================
# Development
NEXT_PUBLIC_API_URL=http://localhost:5001/api
# Production
# NEXT_PUBLIC_API_URL=https://api.keralagiftsonline.in/api
# OR if using same domain with reverse proxy
# NEXT_PUBLIC_API_URL=https://keralagiftsonline.in/api

# ================================
# APPLICATION CONFIGURATION
# ================================
NEXT_PUBLIC_APP_NAME=KeralGiftsOnline
NEXT_PUBLIC_APP_VERSION=3.0.0
NEXT_PUBLIC_SITE_URL=https://keralagiftsonline.in

# ================================
# DEVELOPMENT SETTINGS
# ================================
FAST_REFRESH=false

# ================================
# FEATURE FLAGS
# ================================
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false

# ================================
# ANALYTICS & MONITORING
# ================================
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxx@xxxxxxxxx.ingest.sentry.io/xxxxxxxxx

# ================================
# COMMUNICATION
# ================================
NEXT_PUBLIC_WHATSAPP_NUMBER=+918075030919
NEXT_PUBLIC_SUPPORT_EMAIL=support@keralagiftsonline.in

# ================================
# SEO & SOCIAL
# ================================
NEXT_PUBLIC_SITE_DESCRIPTION=Kerala's premier online gift store offering flowers, cakes, chocolates, and more with same-day delivery
NEXT_PUBLIC_SITE_KEYWORDS=kerala gifts, online flowers, cakes delivery, chocolates, plants, gift hampers
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
NEXT_PUBLIC_TWITTER_HANDLE=@keralagiftsonline

# ================================
# CDN & ASSETS
# ================================
NEXT_PUBLIC_CDN_URL=https://res.cloudinary.com/your_cloud_name
```

---

## 🚀 **DEPLOYMENT CONFIGURATIONS**

### **1. Netlify Configuration (Recommended for Frontend)**

#### **netlify.toml (Frontend)**
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "https://api.keralagiftsonline.in/api/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

### **2. Package.json Scripts**

#### **Backend package.json**
```json
{
  "name": "keralagiftsonline-backend",
  "version": "3.0.0",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "nodemon server.ts",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

#### **Frontend package.json**
```json
{
  "name": "keralagiftsonline-frontend",
  "version": "3.0.0",
  "scripts": {
    "dev": "FAST_REFRESH=false next dev",
    "build": "next build",
    "start": "next start -p $PORT",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "build:analyze": "ANALYZE=true npm run build"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

---

## 🔒 **SECURITY CONFIGURATION**

### **1. Security Headers**
```javascript
// next.config.js - Frontend
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

### **2. CORS Configuration**
```typescript
// server.ts - Backend
const corsOptions = {
  origin: [
    'https://keralagiftsonline.in',
    'https://www.keralagiftsonline.in',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type']
};
```

### **3. Rate Limiting**
```typescript
// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};
```

---

## 🌐 **DOMAIN & DNS CONFIGURATION**

### **DNS Records for GoDaddy (keralagiftsonline.in)**
```bash
# Main Domain
Type: A
Name: @
Value: [Your server IP or use CNAME to Netlify]
TTL: 600

# WWW Subdomain
Type: CNAME
Name: www
Value: keralagiftsonline.in
TTL: 600

# API Subdomain (if using separate backend)
Type: CNAME
Name: api
Value: [Your backend domain]
TTL: 600

# For Netlify Frontend
Type: CNAME
Name: @
Value: your-app-name.netlify.app
TTL: 600

Type: CNAME
Name: www
Value: your-app-name.netlify.app
TTL: 600
```

---



---

## 🛠️ **DEVELOPMENT WORKFLOW**

### **Local Development Setup**
```bash
# 1. Clone and install dependencies
git clone [your-repo]
cd onYourBehlf
npm install

# 2. Setup environment files
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env.local

# 3. Update environment variables with production values
# Edit backend/.env and frontend/.env.local

# 4. Start development servers
npm run dev
# OR individually:
cd backend && npm run dev
cd frontend && npm run dev

# 5. Verify connections
curl http://localhost:5001/api/health
curl http://localhost:3000/api/products
```

### **Build & Test Commands**
```bash
# Backend
cd backend
npm run build          # TypeScript compilation
npm run lint           # ESLint checking
npm run test           # Run tests
npm start              # Production start

# Frontend
cd frontend
npm run build          # Next.js build
npm run lint           # ESLint checking
npm run type-check     # TypeScript checking
npm start              # Production start
```

---

## 📊 **MONITORING & ANALYTICS**

### **Health Check Endpoints**
```bash
# Backend Health
GET https://api.keralagiftsonline.in/api/health
# Response: { status: 'ok', timestamp: '...', database: 'connected' }

# Frontend Health
GET https://keralagiftsonline.in/api/health
# Response: { status: 'ok', build: 'success' }
```

### **Key Metrics to Monitor**
```bash
# Performance Metrics
- Page load time < 3 seconds
- API response time < 500ms
- Database query time < 200ms
- Image load time < 2 seconds

# Business Metrics
- User registration rate
- Order conversion rate
- Cart abandonment rate
- Customer satisfaction score

# Technical Metrics
- Server uptime > 99.9%
- Error rate < 1%
- Security incidents: 0
- Failed deployments < 5%
```

---

## 🚨 **EMERGENCY PROCEDURES**

### **Rollback Procedures**
```bash
# Netlify Rollback
netlify rollback [deployment-id]

# Manual Rollback
git revert [commit-hash]
git push origin main

# Database Rollback (if needed)
# Use MongoDB Atlas point-in-time restore
```

### **Incident Response**
```bash
# 1. Identify Issue
- Check monitoring dashboards
- Review error logs
- Test critical paths

# 2. Immediate Response
- Scale down traffic if needed
- Enable maintenance mode
- Notify stakeholders

# 3. Fix & Recovery
- Deploy hotfix
- Verify functionality
- Monitor for stability

# 4. Post-Incident
- Document issue
- Update procedures
- Implement preventive measures
```

---

## 📞 **SUPPORT CONTACTS & RESOURCES**

### **Technical Support**
```bash
# Database Issues
MongoDB Atlas Support: support.mongodb.com
Atlas Dashboard: cloud.mongodb.com

# CDN Issues
Cloudinary Support: support.cloudinary.com
Cloudinary Dashboard: cloudinary.com/console

# Domain Issues
GoDaddy Support: godaddy.com/help
DNS Management: dcc.godaddy.com

# Deployment Issues
Netlify Support: netlify.com/support
Netlify Dashboard: app.netlify.com
```

### **External Services**
```bash
# Required Accounts
1. MongoDB Atlas (Database)
2. Cloudinary (CDN/Images)
3. Netlify (Deployment)
4. GoDaddy (Domain)

# Optional Services
5. Google Analytics (Analytics)
6. Sentry (Error Monitoring)
7. Stripe/Razorpay (Payments)
```

---

## 🎯 **PRE-DEPLOYMENT CHECKLIST**

### **Environment Preparation**
- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] Cloudinary account setup
- [ ] Domain DNS configured
- [ ] SSL certificates ready

### **Code Preparation**
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Performance optimized
- [ ] Error handling implemented
- [ ] Logging configured

### **Deployment Preparation**
- [ ] Backup procedures tested
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] Team notified
- [ ] Documentation updated

---

## 🎉 **POST-DEPLOYMENT VERIFICATION**

### **Functional Testing**
```bash
# Test Core Functionality
1. User registration/login
2. Product browsing
3. Search functionality
4. Cart operations
5. Order placement
6. Admin panel access
7. File uploads
8. API endpoints

# Test Performance
1. Page load speeds
2. API response times
3. Database queries
4. Image loading
5. Mobile responsiveness

# Test Security
1. Authentication flows
2. Authorization checks
3. Input validation
4. XSS protection
5. CSRF protection
```

### **Success Criteria**
```bash
✅ All pages load without errors
✅ All API endpoints respond correctly
✅ Database queries execute successfully
✅ File uploads work properly
✅ Authentication system functional
✅ Admin panel accessible
✅ Mobile site responsive
✅ SSL certificate active
✅ Monitoring systems operational
✅ Backup systems verified
```

---

## 📝 **MAINTENANCE SCHEDULE**

### **Daily Tasks**
- Monitor server health
- Check error logs
- Verify backup completion
- Review security alerts

### **Weekly Tasks**
- Update dependencies
- Performance optimization
- Security patches
- User feedback review

### **Monthly Tasks**
- Full security audit
- Database optimization
- Backup verification
- Documentation updates

### **Quarterly Tasks**
- Disaster recovery test
- Performance benchmarking
- Security penetration testing
- Business metrics review

---

**Document Version**: 3.0.0  
**Last Updated**: December 19, 2024  
**Next Review**: January 19, 2025  
**Status**: ✅ Ready for Production Deployment  

**⚠️ REMEMBER**: Keep this document secure, update regularly, and never commit sensitive data to version control.
