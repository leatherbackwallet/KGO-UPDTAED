# Single Consolidated Deployment for OnYourBehlf

This document explains the new single deployment system that replaces all previous deployment methods.

## 🎯 Problem Solved

Previously, you had multiple deployment configurations causing:
- 3+ concurrent builds running simultaneously
- 503 Service Unavailable errors
- Resource conflicts
- Deployment confusion

## ✅ New Single Deployment System

### Files Created:
1. **`cloudbuild-single.yaml`** - Single Cloud Build configuration
2. **`deploy-single.sh`** - Single deployment script
3. **`trigger-single.yaml`** - Single trigger configuration

### How It Works:
1. **Stops any running builds** first
2. **Builds backend and frontend** in parallel
3. **Deploys both services** with health checks
4. **Promotes to production** only after health checks pass
5. **Cleans up old versions** automatically

## 🚀 Usage

### Option 1: Manual Deployment (Recommended)
```bash
# Stop any running builds and deploy
npm run deploy
```

### Option 2: Direct Cloud Build
```bash
# Submit build directly
npm run deploy:single
```

### Option 3: Check/Stop Builds
```bash
# Check current builds
npm run deploy:check

# Stop all running builds
npm run deploy:stop
```

## 🔧 Setup Instructions

### 1. Clean Up Existing Triggers
In Google Cloud Console → Cloud Build → Triggers:
- **Delete or disable** all existing triggers
- Keep only one trigger for the main branch

### 2. Create New Single Trigger
```bash
gcloud builds triggers create github \
  --repo-name=onYourBehlf \
  --repo-owner=leatherbackwallet \
  --branch-pattern=^main$ \
  --build-config=cloudbuild-single.yaml \
  --name=onyourbehlf-single-deployment
```

### 3. Deploy Using New System
```bash
./deploy-single.sh
```

## 📊 Deployment Flow

```
┌─────────────────┐
│ Stop Running    │
│ Builds          │
└─────────┬───────┘
          │
┌─────────▼───────┐    ┌─────────────────┐
│ Build Backend   │    │ Build Frontend  │
│ (in parallel)   │    │ (in parallel)   │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
┌─────────▼───────┐    ┌─────────▼───────┐
│ Deploy Backend  │    │ Deploy Frontend │
│ (no promote)    │    │ (no promote)    │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
┌─────────▼───────┐    ┌─────────▼───────┐
│ Health Check    │    │ Health Check    │
│ Backend         │    │ Frontend        │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
┌─────────▼───────┐    ┌─────────▼───────┐
│ Promote Backend │    │ Promote Frontend│
│ to 100%         │    │ to 100%         │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
           ┌─────────▼───────┐
           │ Cleanup Old     │
           │ Versions        │
           └─────────────────┘
```

## 🔍 Monitoring

### Check Deployment Status
```bash
# View recent builds
gcloud builds list --limit=5

# View specific build logs
gcloud builds log <BUILD_ID>

# Check app status
gcloud app services list
```

### Health Checks
- Backend: `https://api-dot-onyourbehlf.uc.r.appspot.com/api/health`
- Frontend: `https://onyourbehlf.uc.r.appspot.com/health`

## 🚨 Troubleshooting

### If Deployment Fails:
1. **Check build logs** in Cloud Console
2. **Verify health endpoints** are working
3. **Run manual health checks**:
   ```bash
   curl https://api-dot-onyourbehlf.uc.r.appspot.com/api/health
   ```

### If Multiple Builds Are Running:
```bash
# Stop all builds immediately
npm run deploy:stop
```

### If Services Are Down:
1. Check Cloud Build logs
2. Verify environment variables in app.yaml
3. Check MongoDB connectivity
4. Review server startup logs

## 📝 Benefits

✅ **Single coordinated deployment**
✅ **Health checks before promotion**
✅ **Automatic cleanup of old versions**
✅ **Parallel builds for speed**
✅ **Proper error handling**
✅ **No more concurrent build conflicts**
✅ **Zero-downtime deployments**

## 🔄 Migration from Old System

1. **Stop using old scripts**: `deploy.sh`, `deploy-consolidated.sh`, etc.
2. **Use only**: `deploy-single.sh` or `npm run deploy`
3. **Remove old triggers** from Cloud Build
4. **Set up single trigger** using `trigger-single.yaml`

This single deployment system will resolve all your concurrent build issues and provide reliable, coordinated deployments.
