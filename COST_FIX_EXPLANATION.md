# 💰 Cost Optimization Fix - December 2024

## 🔴 Problem Identified

Your Google Cloud billing shows **~52.62€ per month** (36€ for Flex Core Hours + 12€ RAM + 4.61€ storage) instead of the expected **~10€**.

### Root Cause:
- **App Engine Flexible Environment** (`env: flex`) was being used
- Flexible environment **always runs at least 1 instance** (24/7)
- Flexible uses VMs (not containers), which are **much more expensive**
- **793 hours** of core usage = instance running continuously

## ✅ Solution Implemented

### Changes Made:

1. **Switched to App Engine Standard Environment**
   - Changed from `runtime: custom` + `env: flex` to `runtime: nodejs20`
   - Standard environment **scales to zero** (no cost when idle)
   - Much cheaper per hour when running

2. **Removed Unused Puppeteer/Chromium**
   - Puppeteer was configured but **never actually used** in the code
   - Removed from Dockerfile and app.yaml configuration
   - This was the reason for using Flexible (custom Docker), but it wasn't needed!

3. **Optimized Scaling Configuration**
   - `min_instances: 0` - **Scales to zero when idle** (major cost savings!)
   - `max_instances: 3` - Allows scaling for traffic
   - `instance_class: F2` - Smaller, cheaper instance class

4. **Updated Deployment**
   - Created `backend/app.yaml` for Standard environment
   - Updated `deploy.sh` to deploy from backend directory
   - Standard environment requires code and app.yaml in same directory

## 💵 Expected Cost Savings

### Before (Flexible Environment):
- **Flex Instance Core Hours**: 36.01€ (793 hours × 0.045€/hour)
- **Flex Instance RAM**: 12.00€ (1,957 GB-hours × 0.006€/GB-hour)
- **Artifact Registry**: 4.61€
- **Total**: **~52.62€/month**

### After (Standard Environment):
- **Instance Hours**: ~0-5€ (only when handling requests, scales to zero)
- **RAM**: Included in instance cost
- **Artifact Registry**: 4.61€ (same)
- **Total**: **~5-10€/month** (80-90% reduction!)

### Key Difference:
- **Flexible**: Always running = 24/7 costs
- **Standard**: Scales to zero = pay only for active requests

## 📋 What Changed

### Files Modified:
1. `backend/app.yaml` - New Standard environment configuration
2. `app.yaml` (root) - Updated to Standard (kept for reference)
3. `deploy.sh` - Updated to deploy from backend directory

### Files NOT Changed (but can be cleaned up):
- `Dockerfile` - No longer needed for Standard environment, but kept for reference
- `backend/Dockerfile` - Same as above

## 🚀 Deployment Instructions

### To Deploy with New Configuration:

```bash
# The deploy script has been updated automatically
./deploy.sh
```

The script will now:
1. Build backend in `backend/` directory
2. Deploy from `backend/` using `backend/app.yaml`
3. Use Standard environment (scales to zero)

### First Deployment Notes:
- First deployment may take longer (5-10 minutes)
- Cold starts: First request after idle period may take 2-5 seconds
- Subsequent requests are fast (instance stays warm for ~15 minutes)

## ⚠️ Important Notes

### Standard Environment Limitations:
1. **Request Timeout**: 60 seconds max
2. **Request Size**: 32MB max
3. **No Background Processes**: All work must complete within request
4. **File System**: Read-only (except `/tmp`)

### These Should NOT Affect Your API:
- Your API endpoints complete quickly
- File uploads go to Cloudinary (not local storage)
- No long-running background tasks

## 🔍 Monitoring Costs

### After Deployment:
1. Check Google Cloud Console → Billing
2. Wait 24-48 hours to see new costs
3. You should see **dramatic reduction** in App Engine costs
4. Instance hours should drop to near-zero during idle periods

### Expected Metrics:
- **Instance Hours**: Should be <100 hours/month (vs 793 hours before)
- **Cost**: Should be **~5-10€/month** (vs 52€ before)

## 🆘 If You Need Puppeteer Later

If you actually need PDF generation in the future:

### Option 1: Use Cloud Run (Recommended)
- Supports Docker (can use Puppeteer)
- Scales to zero (cheaper than Flex)
- Pay only for what you use

### Option 2: External Service
- Use a PDF generation service (e.g., PDFShift, PDF.co)
- Call from your API
- No need for Puppeteer in your backend

## ✅ Verification Checklist

After deployment, verify:
- [ ] API health endpoint works: `https://api-dot-onyourbehlf.uc.r.appspot.com/api/health-status`
- [ ] Products endpoint works
- [ ] Payments endpoint works
- [ ] Check billing after 24-48 hours
- [ ] Costs should be significantly lower

## 📞 Support

If you encounter any issues:
1. Check deployment logs: `gcloud app logs tail -s api`
2. Check instance status: `gcloud app instances list`
3. Verify app.yaml syntax: `gcloud app deploy backend/app.yaml --dry-run`

---

**Expected Result**: Monthly costs should drop from **~52€ to ~5-10€** (80-90% savings!)
