# KeralGiftsOnline Production Deployment

## 🚀 Quick Start

Deploy to production with a single command:

```bash
npm run deploy
```

## 📋 What the Deployment Script Does

The `deploy-production.sh` script is a comprehensive, bulletproof deployment solution that:

### ✅ **Validation Phase**
- Validates environment and authentication
- Verifies all JSON files exist and have valid syntax
- Checks JSON content structure (products, categories, occasions)
- Compiles TypeScript and checks for build errors
- Runs linting (if configured)

### 🧹 **Cleanup Phase**
- Stops traffic to all existing versions
- Deletes ALL old API versions
- Ensures only the new version will serve traffic

### 🚀 **Deployment Phase**
- Deploys new version to Google App Engine
- Waits for version to be ready
- Tests all JSON data endpoints
- Promotes version to production (100% traffic)

### 🔍 **Verification Phase**
- Verifies only one version is serving
- Tests all production endpoints
- Confirms JSON data is accessible

## 📊 Features

- **Single Version Policy**: Only one API version serves at a time
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

### Deploy to Production
```bash
npm run deploy
```

### Get Help
```bash
npm run deploy:help
```

### Manual Script Execution
```bash
./deploy-production.sh
./deploy-production.sh --help
```

## 🔧 Configuration

The script is configured for:
- **Project**: `onyourbehlf`
- **Service**: `api`
- **JSON Files**: 
  - `backend/Products/keralagiftsonline.products.json`
  - `backend/Products/keralagiftsonline.categories.json`
  - `backend/Products/keralagiftsonline.occasions.json`

## 🚨 Important Notes

1. **Backup**: The script deletes ALL old versions. The deployment creates a new version with timestamp.
2. **JSON Files**: Deployment will fail if JSON files are missing, invalid, or empty.
3. **Build Errors**: Deployment will fail if TypeScript compilation fails.
4. **Single Version**: Only one API version serves traffic at any time.
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

**This is the ONLY deployment script for production. All other deployment methods have been removed.**

