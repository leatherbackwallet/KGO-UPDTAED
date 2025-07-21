# Production Deployment Guide

## 🚀 KeralGiftsOnline.com Production Setup

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Domain name
- SSL certificate
- Server/Cloud platform (AWS, Vercel, Railway, etc.)

### 1. Environment Variables

#### Backend (.env.production)
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/keralagiftsonline?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Server
PORT=5001
NODE_ENV=production

# CORS
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info

# Security
BCRYPT_ROUNDS=12

# Admin User
ADMIN_EMAIL=admin@keralagiftsonline.com
ADMIN_PASSWORD=SuperSecure123!
```

#### Frontend (.env.production)
```bash
# API URL
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

### 2. Backend Deployment

#### Build for Production
```bash
cd backend
npm install
npm run build:prod
```

#### Start Production Server
```bash
npm start
```

#### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start dist/server.js --name "keralagiftsonline-api"
pm2 save
pm2 startup
```

### 3. Frontend Deployment

#### Build for Production
```bash
cd frontend
npm install
npm run build:prod
```

#### Start Production Server
```bash
npm start
```

#### Using PM2
```bash
pm2 start npm --name "keralagiftsonline-frontend" -- start
pm2 save
```

### 4. Database Setup

#### MongoDB Atlas
1. Create a new cluster
2. Set up database access (username/password)
3. Configure network access (IP whitelist)
4. Get connection string
5. Update MONGODB_URI in environment variables

#### Seed Data
```bash
cd backend
npm run seed
```

### 5. Security Checklist

- [ ] Strong JWT secret
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Admin password changed
- [ ] Rate limiting enabled
- [ ] Input validation
- [ ] Error logging configured

### 6. Performance Optimization

#### Backend
- [ ] Enable compression
- [ ] Set up caching (Redis)
- [ ] Database indexing
- [ ] CDN for static assets
- [ ] Load balancing

#### Frontend
- [ ] Image optimization
- [ ] Code splitting
- [ ] Bundle analysis
- [ ] CDN for assets
- [ ] Service worker (PWA)

### 7. Monitoring & Logging

#### Backend Monitoring
```bash
# Install monitoring tools
npm install -g pm2
pm2 install pm2-logrotate
pm2 install pm2-server-monit
```

#### Frontend Monitoring
- Google Analytics
- Error tracking (Sentry)
- Performance monitoring

### 8. SSL/HTTPS Setup

#### Using Let's Encrypt
```bash
# Install certbot
sudo apt-get install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 9. Domain Configuration

#### DNS Records
```
A     @           your-server-ip
A     api         your-server-ip
CNAME www         yourdomain.com
```

#### Nginx Configuration (Optional)
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 10. Backup Strategy

#### Database Backup
```bash
# MongoDB Atlas provides automatic backups
# Manual backup
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/keralagiftsonline"
```

#### Application Backup
```bash
# Backup application files
tar -czf keralagiftsonline-backup-$(date +%Y%m%d).tar.gz /path/to/app
```

### 11. Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connected and seeded
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Security measures implemented
- [ ] Performance optimized
- [ ] Error handling tested
- [ ] Admin access verified

### 12. Post-Deployment

1. Test all functionality
2. Verify admin login
3. Check API endpoints
4. Monitor performance
5. Set up alerts
6. Document deployment

### Support

For deployment issues, check:
- Server logs: `pm2 logs`
- Application logs: `tail -f logs/app.log`
- Database connection
- Environment variables
- Network connectivity

---

**KeralGiftsOnline.com** - Enterprise-grade marketplace platform 