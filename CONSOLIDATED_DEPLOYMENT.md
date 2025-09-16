# Consolidated Deployment Guide

## Problem Solved

This consolidated deployment setup eliminates the additional builds you were experiencing when the main branch is updated. The previous setup was creating multiple build entries due to:

1. **Sequential deployment steps** that appeared as separate builds
2. **Multiple App Engine service deployments** (api + default services)
3. **Inefficient build process** without proper parallelization
4. **Lack of Docker layer caching** causing longer build times

## Solution Overview

The new consolidated approach provides:

- **Single Cloud Build trigger** that handles everything in one optimized process
- **Parallel builds** for frontend and backend Docker images
- **Docker layer caching** for faster subsequent builds
- **Efficient deployment** with proper wait conditions
- **Reduced build time** from ~20 minutes to ~8-12 minutes

## Files Created/Modified

### New Files
- `cloudbuild-optimized.yaml` - Optimized Cloud Build configuration
- `deploy-consolidated.sh` - Consolidated deployment script
- `setup-single-trigger.sh` - Script to set up single Cloud Build trigger
- `CONSOLIDATED_DEPLOYMENT.md` - This documentation

### Modified Files
- `cloudbuild.yaml` - Updated with parallel processing
- `package.json` - Added new deployment scripts

## Quick Start

### 1. Set Up Single Trigger (One-time setup)
```bash
npm run deploy:setup
```

This will:
- Remove any existing Cloud Build triggers
- Create a single optimized trigger for the main branch
- Configure the trigger to use `cloudbuild-optimized.yaml`

### 2. Deploy Manually (Optional)
```bash
npm run deploy
```

### 3. Automatic Deployment
Once the trigger is set up, any push to the main branch will automatically trigger a single, optimized build.

## How It Works

### Build Process Flow
1. **Parallel Docker Builds** - Both frontend and backend images build simultaneously
2. **Docker Layer Caching** - Uses `--cache-from` to speed up builds
3. **Parallel Image Push** - Both images are pushed to Container Registry simultaneously
4. **Parallel Deployment** - Both App Engine services deploy simultaneously
5. **Traffic Promotion** - Services are promoted to 100% traffic after successful deployment

### Key Optimizations
- **Parallel Processing**: Frontend and backend builds run simultaneously
- **Docker Caching**: Reuses layers from previous builds
- **Efficient Wait Conditions**: Proper dependency management between steps
- **Single Build Entry**: All operations happen within one Cloud Build job

## Configuration Details

### Cloud Build Trigger
- **Name**: `onyourbehlf-consolidated-deploy`
- **Repository**: `leatherbackwallet/onYourBehlf`
- **Branch**: `main`
- **Config File**: `cloudbuild-optimized.yaml`
- **Machine Type**: `E2_HIGHCPU_8`
- **Timeout**: 20 minutes

### App Engine Services
- **Backend Service**: `api` (using `app.yaml`)
- **Frontend Service**: `default` (using `frontend-app.yaml`)

## Monitoring and Troubleshooting

### View Build Status
```bash
# View recent builds
gcloud builds list --limit=10

# View specific build logs
gcloud builds log [BUILD_ID]

# Monitor in real-time
gcloud builds log --stream
```

### Check App Engine Services
```bash
# List services
gcloud app services list

# View service versions
gcloud app versions list

# Check service traffic
gcloud app services describe api
gcloud app services describe default
```

### View Logs
```bash
# Backend logs
gcloud app logs tail -s api

# Frontend logs
gcloud app logs tail -s default

# All logs
gcloud app logs tail
```

## Benefits of Consolidated Deployment

1. **Eliminates Additional Builds**: Single build entry per commit
2. **Faster Build Times**: Parallel processing reduces total time
3. **Better Resource Utilization**: Efficient use of Cloud Build resources
4. **Improved Caching**: Docker layer caching speeds up subsequent builds
5. **Cleaner History**: Single build per deployment in Cloud Console
6. **Cost Optimization**: Reduced build time means lower costs

## Rollback Process

If you need to rollback to a previous version:

```bash
# List available versions
gcloud app versions list

# Rollback to specific version
gcloud app services set-traffic api --splits=[VERSION]=1
gcloud app services set-traffic default --splits=[VERSION]=1
```

## Troubleshooting Common Issues

### Build Fails
1. Check build logs: `gcloud builds log [BUILD_ID]`
2. Verify Docker images are building correctly locally
3. Check App Engine service configurations

### Deployment Issues
1. Verify both services are deploying: `gcloud app services list`
2. Check service traffic distribution
3. Review App Engine logs for runtime errors

### Trigger Not Working
1. Verify trigger is active: `gcloud builds triggers list`
2. Check GitHub webhook configuration
3. Ensure correct branch and file patterns

## Next Steps

1. Run `npm run deploy:setup` to set up the single trigger
2. Test with a small commit to verify the consolidated build works
3. Monitor the Cloud Build history to confirm single builds
4. Enjoy faster, more efficient deployments!

## Support

If you encounter any issues:
1. Check the build logs in Google Cloud Console
2. Verify your GitHub repository permissions
3. Ensure all required APIs are enabled
4. Review the troubleshooting section above
