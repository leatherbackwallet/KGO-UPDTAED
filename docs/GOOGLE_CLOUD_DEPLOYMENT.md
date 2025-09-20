# Google Cloud Platform Deployment Guide

This guide covers deploying the OnYourBehlf application to Google Cloud Platform using Google App Engine.

## Prerequisites

1. **Google Cloud CLI** - Install and configure the Google Cloud CLI
2. **Google Cloud Project** - Create or use an existing Google Cloud project
3. **Billing** - Enable billing for your Google Cloud project
4. **APIs** - Enable required Google Cloud APIs

## Initial Setup

### 1. Install Google Cloud CLI

```bash
# macOS (using Homebrew)
brew install --cask google-cloud-sdk

# Or download from Google Cloud Console
curl https://sdk.cloud.google.com | bash
```

### 2. Initialize Google Cloud CLI

```bash
# Login to Google Cloud
gcloud auth login

# Initialize the project
gcloud init --project=onyourbehlf
```

### 3. Enable Required APIs

```bash
# Enable App Engine API
gcloud services enable appengine.googleapis.com

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Compute Engine API
gcloud services enable compute.googleapis.com
```

## Environment Configuration

### 1. Set Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
MONGODB_PASSWORD=your_mongodb_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=deojqbepy
CLOUDINARY_API_KEY=476938714454695
CLOUDINARY_API_SECRET=fQBjh1m4rF9ztey7u4FANZQUNhQ

# Email Configuration
EMAIL_HOST=your_email_host
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password

# Payment Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# WhatsApp Configuration
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
```

### 2. Set Google Cloud Environment Variables

```bash
# Set environment variables in Google Cloud
gcloud app deploy app.yaml --set-env-vars MONGODB_PASSWORD=your_password,JWT_SECRET=your_secret,CLOUDINARY_CLOUD_NAME=deojqbepy,CLOUDINARY_API_KEY=476938714454695,CLOUDINARY_API_SECRET=fQBjh1m4rF9ztey7u4FANZQUNhQ
gcloud app deploy frontend-app.yaml --set-env-vars MONGODB_PASSWORD=your_password,JWT_SECRET=your_secret,CLOUDINARY_CLOUD_NAME=deojqbepy,CLOUDINARY_API_KEY=476938714454695,CLOUDINARY_API_SECRET=fQBjh1m4rF9ztey7u4FANZQUNhQ
```

## Deployment

### Option 1: Using the Deployment Script

```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

### Option 2: Manual Deployment

```bash
# Build the applications
npm run build

# Deploy backend
gcloud app deploy app.yaml

# Deploy frontend
gcloud app deploy frontend-app.yaml
```

### Option 3: Using Docker

```bash
# Build and run with Docker Compose
docker-compose build
docker-compose up -d

# Or build individual services
docker build -f backend/Dockerfile -t onyourbehlf-backend .
docker build -f frontend/Dockerfile -t onyourbehlf-frontend .
```

## Project Structure

```
onyourbehlf/
├── app.yaml                 # Backend App Engine configuration
├── frontend-app.yaml        # Frontend App Engine configuration
├── cloudbuild.yaml          # Google Cloud Build configuration
├── docker-compose.yaml      # Docker Compose configuration
├── deploy.sh               # Deployment script
├── package.json            # Root package.json (monorepo)
├── backend/
│   ├── Dockerfile          # Backend Docker configuration
│   ├── package.json        # Backend dependencies
│   └── src/                # Backend source code
├── frontend/
│   ├── Dockerfile          # Frontend Docker configuration
│   ├── package.json        # Frontend dependencies
│   └── src/                # Frontend source code
└── .dockerignore           # Docker ignore file
```

## Configuration Files

### app.yaml (Backend)
- Runtime: Node.js 20
- Service: api
- Automatic scaling with 1-10 instances
- 1 CPU, 1GB memory, 10GB disk
- Security headers and HTTPS enforcement

### frontend-app.yaml (Frontend)
- Runtime: Node.js 20
- Service: frontend
- Automatic scaling with 1-10 instances
- 1 CPU, 2GB memory, 10GB disk
- Static file caching and security headers

### cloudbuild.yaml
- Multi-stage Docker builds
- Image pushing to Container Registry
- App Engine deployment
- 20-minute timeout with high-CPU machine

## Available Scripts

### Root Level Scripts
```bash
npm run dev              # Start both frontend and backend in development
npm run build            # Build both applications
npm run start            # Start both applications in production
npm run deploy           # Deploy to Google Cloud
npm run docker:build     # Build Docker images
npm run docker:up        # Start Docker containers
npm run docker:down      # Stop Docker containers
npm run clean            # Clean build artifacts
npm run test             # Run tests for both applications
npm run lint             # Run linting for both applications
```

### Individual Service Scripts
```bash
npm run dev:backend      # Start backend in development
npm run dev:frontend     # Start frontend in development
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only
npm run deploy:backend   # Deploy backend only
npm run deploy:frontend  # Deploy frontend only
```

## URLs and Domains

After deployment, your applications will be available at:

- **Frontend**: `https://onyourbehlf.uc.r.appspot.com`
- **Backend API**: `https://api-dot-onyourbehlf.uc.r.appspot.com`

### Custom Domain Setup

To set up a custom domain:

```bash
# Map a custom domain
gcloud app domain-mappings create your-domain.com

# Verify domain ownership in Google Cloud Console
# Update DNS records as instructed
```

## Monitoring and Logs

### View Application Logs
```bash
# View backend logs
gcloud app logs tail -s api

# View frontend logs
gcloud app logs tail -s frontend

# View all logs
gcloud app logs tail
```

### Monitor Application
```bash
# Open App Engine dashboard
gcloud app browse

# View application details
gcloud app describe
```

## Scaling and Performance

### Automatic Scaling
- **Target CPU Utilization**: 65%
- **Min Instances**: 1
- **Max Instances**: 10
- **Target Throughput**: 60%

### Manual Scaling (Optional)
To use manual scaling instead of automatic scaling, modify the app.yaml files:

```yaml
manual_scaling:
  instances: 2
```

## Security

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- Referrer-Policy: strict-origin-when-cross-origin

### HTTPS Enforcement
All traffic is automatically redirected to HTTPS.

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   gcloud app logs tail
   
   # Verify dependencies
   npm run install:all
   ```

2. **Environment Variables**
   ```bash
   # Check current environment variables
   gcloud app describe
   
   # Update environment variables
   gcloud app deploy app.yaml --set-env-vars VAR=value
   ```

3. **Docker Issues**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild images
   docker-compose build --no-cache
   ```

### Performance Optimization

1. **Enable CDN**
   ```bash
   # Configure Cloud CDN for static assets
   gcloud compute backend-buckets create static-assets
   ```

2. **Database Optimization**
   - Use MongoDB Atlas for production
   - Enable connection pooling
   - Implement proper indexing

3. **Caching**
   - Implement Redis for session storage
   - Use Cloud CDN for static assets
   - Enable browser caching

## Cost Optimization

### App Engine Pricing
- **F1 Instance**: $0.05/hour (1 CPU, 256MB RAM)
- **F2 Instance**: $0.10/hour (1 CPU, 512MB RAM)
- **F4 Instance**: $0.20/hour (1 CPU, 1GB RAM)

### Cost Reduction Tips
1. Use automatic scaling with appropriate min/max instances
2. Monitor resource usage with Cloud Monitoring
3. Set up billing alerts
4. Use Cloud CDN for static assets
5. Optimize database queries

## Support

For issues related to:
- **Google Cloud Platform**: [Google Cloud Support](https://cloud.google.com/support)
- **App Engine**: [App Engine Documentation](https://cloud.google.com/appengine/docs)
- **Application Code**: Check the project documentation or create an issue

## Next Steps

1. Set up monitoring and alerting
2. Configure custom domains
3. Set up CI/CD pipeline with Cloud Build
4. Implement backup strategies
5. Set up SSL certificates
6. Configure load balancing (if needed)
