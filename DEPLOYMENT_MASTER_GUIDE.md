# 🚀 OnYourBehlf Deployment Master Guide

## 📋 Table of Contents
1. [Problem Analysis & Root Cause](#problem-analysis--root-cause)
2. [Current Working Configuration](#current-working-configuration)
3. [Deployment Process](#deployment-process)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🔍 Problem Analysis & Root Cause

### 🚨 The Main Issue: CORS Configuration Mismatch

The website was crashing due to **Cross-Origin Resource Sharing (CORS) errors** caused by domain mismatches:

#### Issue Chain:
1. **User Access**: Users accessing via `https://keralagiftsonline.in` (custom domain)
2. **Frontend Deployment**: Frontend deployed to `https://onyourbehlf.uc.r.appspot.com` (App Engine domain)
3. **Backend CORS**: Backend only allowed `https://onyourbehlf.uc.r.appspot.com`
4. **Result**: Browser blocked ALL API calls → Website appeared broken

#### Technical Root Cause:
```javascript
// BEFORE (Broken):
const allowedOrigins = [
  'https://onyourbehlf.uc.r.appspot.com'  // Only App Engine domain
];

// AFTER (Fixed):
const allowedOrigins = [
  'https://onyourbehlf.uc.r.appspot.com',
  'https://keralagiftsonline.in',          // Added custom domain
  'https://www.keralagiftsonline.in'       // Added www subdomain
];
```

### 🔧 What Was Fixed:

1. **Backend CORS Configuration** (`backend/server.ts`)
2. **API Security Middleware** (`backend/middleware/apiSecurity.ts`)
3. **Environment Variables** (`app.yaml`)
4. **Frontend Structure** (Pages moved from `src/pages` to `pages/`)

---

## ⚙️ Current Working Configuration

### Backend Configuration (`app.yaml`)
```yaml
runtime: nodejs20
service: api
entrypoint: bash -lc 'cd backend && node dist/server.js'

env_variables:
  NODE_ENV: production
  PORT: 8080
  
  # Database Configuration - MongoDB Atlas
  MONGODB_URI: "mongodb+srv://castlebek:uJrTGo7E47HiEYpf@keralagiftsonline.7oukp55.mongodb.net/keralagiftsonline?retryWrites=true&w=majority&appName=KeralaGiftsOnline"
  
  # JWT Configuration
  JWT_SECRET: "kerala-gifts-online-super-secure-jwt-secret-production-2024-minimum-32-chars"
  JWT_REFRESH_SECRET: "kerala-gifts-online-refresh-token-secret-production-2024-minimum-32-chars"
  JWT_ACCESS_TOKEN_EXPIRY: "15m"
  JWT_REFRESH_TOKEN_EXPIRY: "7d"
  JWT_EXPIRES_IN: "7d"
  
  # Session Configuration
  SESSION_SECRET: "kerala-gifts-online-session-secret-production-2024-minimum-32-chars"
  
  # Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: "deojqbepy"
  CLOUDINARY_API_KEY: "476938714454695"
  CLOUDINARY_API_SECRET: "fQBjh1m4rF9ztey7u4FANZQUNhQ"
  
  # CORS Configuration - Support both domains
  CORS_ORIGIN: "https://keralagiftsonline.in"
  FRONTEND_URL: "https://keralagiftsonline.in"
  API_URL: "https://api-dot-onyourbehlf.uc.r.appspot.com"
  
  # Razorpay Configuration
  RAZORPAY_KEY_ID: "rzp_live_RJUs4PJL0Hctlv"
  RAZORPAY_KEY_SECRET: "kgZuBvXrRs1JEbEiQdzG7MeN"
  RAZORPAY_WEBHOOK_SECRET: "esmeR2lda"
  PAYMENT_CURRENCY: "INR"
  
  # Puppeteer Configuration for PDF Generation
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: "true"
  PUPPETEER_EXECUTABLE_PATH: "/usr/bin/chromium-browser"

# Health Check Configuration
readiness_check:
  path: "/api/health-status"
  check_interval_sec: 5
  timeout_sec: 4
  failure_threshold: 2
  success_threshold: 2
  app_start_timeout_sec: 300

liveness_check:
  path: "/api/health-status"
  check_interval_sec: 30
  timeout_sec: 4
  failure_threshold: 2
  success_threshold: 2

# Conservative Scaling Configuration
automatic_scaling:
  target_cpu_utilization: 0.65
  min_instances: 1
  max_instances: 10
  target_throughput_utilization: 0.6

resources:
  cpu: 1
  memory_gb: 1
  disk_size_gb: 10

handlers:
  - url: /.*
    script: auto
    secure: always
```

### Frontend Configuration (`frontend-app.yaml`)
```yaml
runtime: nodejs20
service: default

env_variables:
  NODE_ENV: production
  PORT: 8080
  
  # Frontend Environment Variables
  NEXT_PUBLIC_API_URL: "https://api-dot-onyourbehlf.uc.r.appspot.com/api"
  NEXT_PUBLIC_APP_NAME: "OnYourBehlf"
  NEXT_PUBLIC_APP_VERSION: "3.0.0"
  NEXT_PUBLIC_ENABLE_ANALYTICS: "true"
  NEXT_PUBLIC_ENABLE_DEBUG_MODE: "false"
  NEXT_PUBLIC_WHATSAPP_NUMBER: "+918075030919"
  FAST_REFRESH: "false"
  
  # API Configuration for frontend server
  API_URL: "https://api-dot-onyourbehlf.uc.r.appspot.com"
  FRONTEND_URL: "https://onyourbehlf.uc.r.appspot.com"

# Conservative Scaling Configuration
automatic_scaling:
  target_cpu_utilization: 0.65
  min_instances: 1
  max_instances: 10
  target_throughput_utilization: 0.6

resources:
  cpu: 1
  memory_gb: 2
  disk_size_gb: 10

entrypoint: bash -lc 'cd frontend && node server.js'

handlers:
  # Health check endpoint
  - url: /health
    script: auto
    secure: always

  # All other requests go to the Next.js app
  - url: /.*
    script: auto
    secure: always
```

### CORS Configuration (`backend/server.ts`)
```typescript
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'https://onyourbehlf.uc.r.appspot.com',
      'https://keralagiftsonline.in',
      'https://www.keralagiftsonline.in'
    ];
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS: Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type']
};
```

---

## 🚀 Deployment Process

### Option 1: Quick Single Script (Recommended)
```bash
# Use the working configuration script
./deploy-working-config.sh
```

### Option 2: Manual Step-by-Step
```bash
# 1. Build backend
cd backend && npm run build && cd ..

# 2. Build frontend  
cd frontend && npm run build && cd ..

# 3. Deploy backend
gcloud app deploy app.yaml --quiet

# 4. Deploy frontend
gcloud app deploy frontend-app.yaml --quiet
```

### Pre-Deployment Checklist
- [ ] Backend builds successfully (`npm run build`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] CORS configuration includes both domains
- [ ] Environment variables are correct
- [ ] Database connection string is valid
- [ ] Cloudinary credentials are set

### Post-Deployment Verification
```bash
# 1. Test backend health
curl https://api-dot-onyourbehlf.uc.r.appspot.com/api/health-status

# 2. Test frontend health
curl https://onyourbehlf.uc.r.appspot.com/api/health

# 3. Test CORS for custom domain
curl -H "Origin: https://keralagiftsonline.in" \
     https://api-dot-onyourbehlf.uc.r.appspot.com/api/products

# 4. Test products API
curl https://api-dot-onyourbehlf.uc.r.appspot.com/api/products

# 5. Run comprehensive test
node test-internet-access.js
```

---

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### 1. CORS Errors
**Symptoms**: "blocked by CORS policy" in browser console
**Solution**: 
```bash
# Check allowed origins in backend/server.ts
# Ensure both domains are included:
# - https://onyourbehlf.uc.r.appspot.com
# - https://keralagiftsonline.in
```

#### 2. Frontend 404 Errors
**Symptoms**: Pages not found, routing issues
**Solution**:
```bash
# Ensure pages are in correct directory
ls frontend/pages/  # Should show index.tsx, _app.tsx, etc.

# If pages are in src/pages, move them:
cp -r frontend/src/pages/* frontend/pages/
rm -rf frontend/src/
```

#### 3. Build Failures
**Symptoms**: `npm run build` fails
**Solution**:
```bash
# Backend build issues
cd backend
npm install
npm run build

# Frontend build issues  
cd frontend
npm install
npm run build

# Check for missing dependencies
npm audit fix
```

#### 4. Database Connection Issues
**Symptoms**: "Database disconnected" in health check
**Solution**:
```bash
# Verify MongoDB URI in app.yaml
# Check MongoDB Atlas cluster status
# Ensure IP whitelist includes Google Cloud IPs
```

#### 5. Deployment Timeout
**Symptoms**: Deployment hangs or times out
**Solution**:
```bash
# Use smaller resource allocation
# Check for infinite loops in code
# Verify health check endpoints are working
```

### Diagnostic Commands
```bash
# Check deployment status
gcloud app versions list

# View backend logs
gcloud app logs read --service=api --limit=50

# View frontend logs  
gcloud app logs read --service=default --limit=50

# Monitor real-time logs
gcloud app logs tail -s api
gcloud app logs tail -s default

# Check service health
gcloud app browse -s api
gcloud app browse -s default
```

---

## 📊 Monitoring & Maintenance

### Health Check Endpoints
- **Backend**: `https://api-dot-onyourbehlf.uc.r.appspot.com/api/health-status`
- **Frontend**: `https://onyourbehlf.uc.r.appspot.com/api/health`

### Key Metrics to Monitor
1. **Response Time**: < 2 seconds for API calls
2. **Error Rate**: < 1% for all endpoints  
3. **Database Connections**: Should stay within pool limits
4. **Memory Usage**: Should not exceed 80% of allocated
5. **CPU Usage**: Should not exceed 70% consistently

### Regular Maintenance Tasks

#### Weekly:
- [ ] Check error logs for unusual patterns
- [ ] Verify database backup status
- [ ] Test all critical user flows
- [ ] Monitor resource usage trends

#### Monthly:
- [ ] Update dependencies (`npm audit`)
- [ ] Review and rotate secrets if needed
- [ ] Check SSL certificate expiration
- [ ] Performance optimization review

#### Quarterly:
- [ ] Review and update CORS origins
- [ ] Security audit of API endpoints
- [ ] Disaster recovery test
- [ ] Capacity planning review

### Emergency Procedures

#### If Website Goes Down:
1. **Check health endpoints** immediately
2. **Review recent deployments** in Cloud Console
3. **Check error logs** for immediate issues
4. **Rollback to previous version** if needed:
   ```bash
   gcloud app versions list
   gcloud app services set-traffic api --splits=PREVIOUS_VERSION=1
   gcloud app services set-traffic default --splits=PREVIOUS_VERSION=1
   ```

#### If Database Issues:
1. **Check MongoDB Atlas status**
2. **Verify connection strings** in environment variables
3. **Check IP whitelist** for Google Cloud ranges
4. **Monitor connection pool** usage

---

## 🎯 Key Deployment Rules

### ✅ DO's:
1. **Always use the working configuration** (based on commit `6ffd4ac`)
2. **Test CORS** for both domains before deployment
3. **Use conservative scaling** (min: 1, max: 10, CPU: 0.65)
4. **Build before deploy** (both frontend and backend)
5. **Deploy backend first**, then frontend
6. **Test thoroughly** after each deployment
7. **Monitor logs** during and after deployment

### ❌ DON'Ts:
1. **Don't use App Engine Flex** (causes Dockerfile issues)
2. **Don't remove CORS domains** (will break custom domain access)
3. **Don't use aggressive scaling** (causes resource issues)
4. **Don't skip builds** (will deploy stale code)
5. **Don't deploy without testing** locally first
6. **Don't ignore health check failures**
7. **Don't deploy during peak hours** without testing

---

## 📞 Support & Resources

### Useful Commands Quick Reference
```bash
# Deploy (recommended)
./deploy-working-config.sh

# Manual deploy
gcloud app deploy app.yaml --quiet
gcloud app deploy frontend-app.yaml --quiet

# Health checks
curl https://api-dot-onyourbehlf.uc.r.appspot.com/api/health-status
curl https://onyourbehlf.uc.r.appspot.com/api/health

# Logs
gcloud app logs tail -s api
gcloud app logs tail -s default

# Rollback
gcloud app services set-traffic api --splits=PREVIOUS_VERSION=1
gcloud app services set-traffic default --splits=PREVIOUS_VERSION=1
```

### Important URLs
- **Frontend**: https://onyourbehlf.uc.r.appspot.com
- **Custom Domain**: https://keralagiftsonline.in
- **Backend API**: https://api-dot-onyourbehlf.uc.r.appspot.com
- **Google Cloud Console**: https://console.cloud.google.com/appengine?project=onyourbehlf

---

**Last Updated**: September 23, 2025  
**Configuration Version**: Based on commit `6ffd4ac30f25a1be2009f5bcbceb841aee432475`  
**Status**: Production Ready ✅
