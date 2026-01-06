# 🔐 Authentication Fix for Deployment

## Issue
The deployment is stopping because Google Cloud authentication tokens have expired.

## Quick Fix

Run this command to re-authenticate:

```bash
gcloud auth login
```

This will open a browser window where you can sign in with your Google account (sales@keralagiftsonline.com).

## After Authentication

Once authenticated, run the deployment again:

```bash
./deploy.sh
```

## What Was Fixed

1. ✅ **Dockerfile renamed** - `backend/Dockerfile` → `backend/Dockerfile.backup.flexible`
   - This prevents App Engine from using Flexible environment
   - Now it will use Standard environment (cost-optimized)

2. ✅ **Build verified** - Both backend and frontend build successfully

3. ⚠️ **Authentication needed** - You need to run `gcloud auth login`

## Expected Deployment Time

- Backend deployment: 5-10 minutes (Standard environment)
- Frontend deployment: 3-5 minutes
- Total: ~10-15 minutes

## After Deployment

The deployment will:
1. Deploy new versions without promoting (zero downtime)
2. Test all endpoints
3. Only then switch traffic to new versions
4. Your website stays accessible throughout!

## Cost Savings

Once deployed to Standard environment:
- **Current cost**: ~52€/month (Flexible, always running)
- **New cost**: ~7-12€/month (Standard, scales to zero)
- **Savings**: 75-85% reduction! 🎉
