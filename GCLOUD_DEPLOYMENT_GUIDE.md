# Google Cloud CLI Deployment Guide

This guide explains how to deploy your KeralGiftsOnline website to Google Cloud Platform using the Google Cloud CLI (gcloud).

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Deployment Methods](#deployment-methods)
4. [Manual Deployment Steps](#manual-deployment-steps)
5. [Troubleshooting](#troubleshooting)
6. [Post-Deployment](#post-deployment)

---

## Prerequisites

### 1. Install Google Cloud SDK

**macOS:**
```bash
# Using Homebrew (recommended)
brew install --cask google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

**Linux:**
```bash
# Add Cloud SDK repository
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list

# Install
sudo apt-get update && sudo apt-get install google-cloud-sdk
```

**Windows:**
Download and run the installer from: https://cloud.google.com/sdk/docs/install

### 2. Verify Installation

```bash
gcloud --version
```

### 3. Required Tools

Ensure you have these installed:
- Node.js (>=18.0.0)
- npm (>=8.0.0)
- Python 3 (for JSON validation)
- curl (for health checks)

---

## Initial Setup

### 1. Authenticate with Google Cloud

```bash
# Login to your Google account
gcloud auth login

# This will open a browser window for authentication
```

### 2. Set Your Project

```bash
# Set the project ID
gcloud config set project onyourbehlf

# Verify the project is set correctly
gcloud config get-value project
```

### 3. Enable Required APIs

```bash
# Enable App Engine API
gcloud services enable appengine.googleapis.com

# Enable Cloud Build API (for custom runtime)
gcloud services enable cloudbuild.googleapis.com

# List enabled services
gcloud services list --enabled
```

### 4. Initialize App Engine (if not already done)

```bash
# Navigate to project root
cd /Users/firefly/Library/Mobile\ Documents/com~apple~CloudDocs/Projects/onYourBehlf

# Initialize App Engine (this creates .gcloudignore if needed)
gcloud app create --region=us-central
```

**Note:** If App Engine is already initialized, this command will show an error. That's fine - you can proceed.

---

## Deployment Methods

You have **two options** for deployment:

### Option 1: Automated Script (Recommended) ⚡

Use the provided deployment scripts for automated, validated deployments:

#### Deploy Both Frontend and Backend

```bash
# From project root directory
./deploy-full-stack.sh

# Or using npm script
npm run deploy
```

#### Deploy Only Backend

```bash
./deploy-full-stack.sh --backend-only

# Or
npm run deploy:backend
```

#### Deploy Only Frontend

```bash
./deploy-full-stack.sh --frontend-only

# Or
npm run deploy:frontend
```

#### Deploy with Custom Version Name

```bash
./deploy-full-stack.sh --name v1.0.0
```

### Option 2: Manual Deployment

Follow the [Manual Deployment Steps](#manual-deployment-steps) below for more control.

---

## Manual Deployment Steps

### Step 1: Prepare the Environment

```bash
# Navigate to project root
cd /Users/firefly/Library/Mobile\ Documents/com~apple~CloudDocs/Projects/onYourBehlf

# Verify you're in the correct directory
ls -la app.yaml frontend-app.yaml backend/ frontend/
```

### Step 2: Build Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm ci

# Build TypeScript
npm run build

# Verify build output
ls -la dist/server.js

# Return to project root
cd ..
```

### Step 3: Build Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm ci

# Build Next.js application
npm run build

# Verify build output
ls -la .next/

# Return to project root
cd ..
```

### Step 4: Deploy Backend API

```bash
# Deploy backend to App Engine
gcloud app deploy app.yaml --version=api-$(date +%Y%m%d%H%M%S) --quiet

# Or deploy without promoting (safer for testing)
gcloud app deploy app.yaml --version=api-$(date +%Y%m%d%H%M%S) --no-promote --quiet
```

**What this does:**
- Creates a new version of the `api` service
- Uses custom runtime (Docker) as specified in `app.yaml`
- Deploys to Google App Engine Flexible Environment

### Step 5: Deploy Frontend

```bash
# Deploy frontend to App Engine
gcloud app deploy frontend-app.yaml --version=$(date +%Y%m%d%H%M%S) --quiet

# Or deploy without promoting
gcloud app deploy frontend-app.yaml --version=$(date +%Y%m%d%H%M%S) --no-promote --quiet
```

**What this does:**
- Creates a new version of the `default` service
- Uses Node.js 20 runtime as specified in `frontend-app.yaml`
- Deploys to Google App Engine Standard Environment

### Step 6: Promote Versions to Production

After verifying the deployed versions work correctly:

```bash
# Promote backend API version
gcloud app services set-traffic api --splits=VERSION_NAME=1

# Promote frontend version
gcloud app services set-traffic default --splits=VERSION_NAME=1
```

**Replace `VERSION_NAME` with the actual version ID from the deployment output.**

### Step 7: Verify Deployment

```bash
# Check service status
gcloud app services list

# Check version status
gcloud app versions list

# Test backend health endpoint
curl https://api-dot-onyourbehlf.uc.r.appspot.com/api/health-status

# Test frontend
curl https://www.keralagiftsonline.in
```

---

## Advanced Deployment Commands

### View Deployment Logs

```bash
# View backend logs
gcloud app logs tail --service=api

# View frontend logs
gcloud app logs tail --service=default

# View logs for specific version
gcloud app logs tail --version=VERSION_NAME
```

### Manage Versions

```bash
# List all versions
gcloud app versions list

# List versions for specific service
gcloud app versions list --service=api
gcloud app versions list --service=default

# Delete old versions
gcloud app versions delete VERSION_NAME --service=api

# View traffic splitting
gcloud app services describe api
gcloud app services describe default
```

### Rollback to Previous Version

```bash
# 1. List versions to find the previous working version
gcloud app versions list --service=api

# 2. Route traffic to previous version
gcloud app services set-traffic api --splits=PREVIOUS_VERSION=1

# 3. Delete the problematic version (optional)
gcloud app versions delete PROBLEMATIC_VERSION --service=api
```

### Split Traffic Between Versions

```bash
# Route 80% to new version, 20% to old version
gcloud app services set-traffic api --splits=NEW_VERSION=0.8,OLD_VERSION=0.2
```

### Deploy to Specific Service

```bash
# Deploy backend only
gcloud app deploy app.yaml --service=api

# Deploy frontend only
gcloud app deploy frontend-app.yaml --service=default
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Error

```bash
# Re-authenticate
gcloud auth login

# Set application default credentials
gcloud auth application-default login
```

#### 2. Wrong Project Selected

```bash
# Check current project
gcloud config get-value project

# Set correct project
gcloud config set project onyourbehlf

# List all projects
gcloud projects list
```

#### 3. Build Failures

```bash
# Check build logs in Cloud Console
# Or view recent builds
gcloud builds list --limit=5

# View specific build logs
gcloud builds log BUILD_ID
```

#### 4. Deployment Timeout

```bash
# Increase timeout (default is 10 minutes)
gcloud app deploy app.yaml --timeout=20m
```

#### 5. Out of Memory Errors

Check your `app.yaml` resources configuration:
- Backend: `cpu: 2, memory_gb: 4`
- Frontend: `cpu: 1, memory_gb: 2`

You may need to increase these values.

#### 6. Port Conflicts

Ensure your application listens on the port specified by the `PORT` environment variable (App Engine sets this automatically).

#### 7. Environment Variables Not Set

Check `app.yaml` and `frontend-app.yaml` for `env_variables` section. All required environment variables should be defined there.

#### 8. Database Connection Issues

Verify:
- MongoDB Atlas URI is correct in `app.yaml`
- Network access rules in MongoDB Atlas allow Google Cloud IPs
- Database credentials are correct

---

## Post-Deployment

### 1. Verify Health Endpoints

```bash
# Backend health
curl https://api-dot-onyourbehlf.uc.r.appspot.com/api/health-status

# Frontend
curl https://www.keralagiftsonline.in
```

### 2. Test API Endpoints

```bash
# Products
curl https://api-dot-onyourbehlf.uc.r.appspot.com/api/products?limit=1

# Categories
curl https://api-dot-onyourbehlf.uc.r.appspot.com/api/categories

# Occasions
curl https://api-dot-onyourbehlf.uc.r.appspot.com/api/occasions
```

### 3. Monitor Application

```bash
# View real-time logs
gcloud app logs tail --service=api --follow

# View error logs only
gcloud app logs read --service=api --severity=ERROR --limit=50
```

### 4. Set Up Monitoring

- Visit [Google Cloud Console](https://console.cloud.google.com)
- Navigate to **App Engine** > **Services**
- Check **Monitoring** tab for metrics
- Set up alerts in **Cloud Monitoring**

### 5. Clean Up Old Versions

```bash
# List all versions
gcloud app versions list

# Delete old versions (keep only the current one)
gcloud app versions delete OLD_VERSION --service=api
gcloud app versions delete OLD_VERSION --service=default
```

---

## Quick Reference

### Essential Commands

```bash
# Deploy everything (automated)
npm run deploy

# Deploy backend only
npm run deploy:backend

# Deploy frontend only
npm run deploy:frontend

# Check status
gcloud app services list
gcloud app versions list

# View logs
gcloud app logs tail --service=api
gcloud app logs tail --service=default

# Rollback
gcloud app services set-traffic SERVICE --splits=OLD_VERSION=1
```

### Project URLs

- **Backend API**: `https://api-dot-onyourbehlf.uc.r.appspot.com`
- **Frontend**: `https://www.keralagiftsonline.in`
- **Health Check**: `https://api-dot-onyourbehlf.uc.r.appspot.com/api/health-status`

### Configuration Files

- **Backend Config**: `app.yaml`
- **Frontend Config**: `frontend-app.yaml`
- **Project ID**: `onyourbehlf`
- **Backend Service**: `api`
- **Frontend Service**: `default`

---

## Best Practices

1. **Always test before promoting**: Use `--no-promote` flag for initial deployments
2. **Use version names**: Use descriptive version names like `api-v1.0.0` instead of timestamps
3. **Monitor logs**: Check logs immediately after deployment
4. **Clean up old versions**: Delete unused versions to save costs
5. **Use automated scripts**: The provided scripts include validation and health checks
6. **Backup before major changes**: Keep a working version as backup
7. **Test endpoints**: Always verify endpoints work after deployment
8. **Monitor costs**: Keep an eye on App Engine usage and costs

---

## Additional Resources

- [Google Cloud App Engine Documentation](https://cloud.google.com/appengine/docs)
- [gcloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference)
- [App Engine Flexible Environment](https://cloud.google.com/appengine/docs/flexible)
- [App Engine Standard Environment](https://cloud.google.com/appengine/docs/standard)

---

## Need Help?

If you encounter issues:

1. Check the deployment logs: `gcloud app logs read --service=SERVICE_NAME`
2. Review the automated script output for validation errors
3. Check Google Cloud Console for detailed error messages
4. Verify all environment variables are set correctly
5. Ensure all dependencies are installed and builds succeed locally

---

**Last Updated**: Based on current project configuration
**Project**: KeralGiftsOnline
**Platform**: Google App Engine

