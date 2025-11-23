# KeralGiftsOnline Production Deployment

## 🚀 Quick Start

Deploy to production with a single command:

```bash
./deploy.sh
```

## 📋 What the Deployment Script Does

The `deploy.sh` script is a comprehensive, bulletproof deployment solution that:

### ✅ **Validation Phase**
- Validates environment and authentication
- Verifies all JSON files exist and have valid syntax
- Checks JSON content structure (products, categories, occasions)
- Compiles TypeScript and checks for build errors
- Runs linting (if configured)

### 🧹 **Pre-Deployment Cleanup**
- Stops traffic to old versions (if possible)
- Prepares environment for new deployment

### 🚀 **Deployment Phase**
- Deploys new backend and frontend versions to Google App Engine
- Waits for versions to be ready
- Tests all JSON data endpoints
- Promotes versions to production (100% traffic)

### 🧹 **Post-Deployment Cleanup**
- **Deletes ALL old versions** ensuring only the new one remains
- Verifies clean state

### 🔍 **Verification Phase**
- Verifies only one version is serving
- Tests all production endpoints
- Confirms JSON data is accessible
- Displays final comprehensive status table

## 📊 Features

- **Single Version Policy**: Automatically cleans up old versions after successful deployment
- **Full Stack**: Deploys both frontend and backend (or individually with flags)
- **JSON Data Guarantee**: Ensures products, categories, and occasions are served from JSON files
- **Build Validation**: Won't deploy if there are compilation or critical linting errors
- **Health Checks**: Comprehensive endpoint testing before and after deployment
- **Error Handling**: Automatic cleanup on failure
- **Detailed Logging**: Clear progress indicators and error messages

## 🛠️ Requirements

- Google Cloud SDK installed and authenticated
- Project set to `onyourbehlf`
- Run from project root directory
- Node.js and npm installed

## 📖 Usage

### Deploy Full Stack (Recommended)
```bash
./deploy.sh
```

### Deploy Backend Only
```bash
./deploy.sh --backend-only
```

### Deploy Frontend Only
```bash
./deploy.sh --frontend-only
```

### Get Help
```bash
./deploy.sh --help
```

## 🔧 Configuration

The script is configured for:
- **Project**: `onyourbehlf`
- **Backend Service**: `api`
- **Frontend Service**: `default`
- **JSON Files**: 
  - `backend/Products/keralagiftsonline.products.json`
  - `backend/Products/keralagiftsonline.categories.json`
  - `backend/Products/keralagiftsonline.occasions.json`

## 🚨 Important Notes

1. **Backup**: The script deletes ALL old versions after successful deployment.
2. **JSON Files**: Deployment will fail if JSON files are missing, invalid, or empty.
3. **Build Errors**: Deployment will fail if TypeScript compilation fails.
4. **Single Version**: Only one version serves traffic at any time.
5. **Health Checks**: Deployment verifies all endpoints work before promoting to production.

## 🔍 Troubleshooting

### Common Issues

**Authentication Error**
```bash
gcloud auth login
gcloud config set project onyourbehlf
```

**JSON File Errors**
- Ensure all 3 JSON files exist in `backend/Products/`
- Validate JSON syntax with: `python3 -m json.tool filename.json`

**Build Errors**
- Fix TypeScript compilation errors in the backend
- Run `cd backend && npm run build` to test locally

**Deployment Timeout**
- Check Google Cloud Console for detailed error logs
- Verify Docker build succeeds in Cloud Build logs

## 📈 Monitoring

After deployment, monitor:
- **API Health**: `https://api-dot-onyourbehlf.uc.r.appspot.com/api/health-status`
- **Products**: `https://api-dot-onyourbehlf.uc.r.appspot.com/api/products`
- **Categories**: `https://api-dot-onyourbehlf.uc.r.appspot.com/api/categories`
- **Occasions**: `https://api-dot-onyourbehlf.uc.r.appspot.com/api/occasions`

## 🎯 Success Criteria

A successful deployment:
- ✅ Compiles without errors
- ✅ Passes JSON validation
- ✅ Only one version serving
- ✅ All endpoints return HTTP 200
- ✅ JSON data is accessible
- ✅ No old versions remain

---

**This is the ONLY deployment script for production.**

