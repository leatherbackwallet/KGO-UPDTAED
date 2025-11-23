# Quick Deployment Checklist

## 🚀 Fast Track Deployment

### Prerequisites Check (One-Time Setup)

```bash
# 1. Install Google Cloud SDK (if not installed)
brew install --cask google-cloud-sdk  # macOS
# OR download from: https://cloud.google.com/sdk/docs/install

# 2. Authenticate
gcloud auth login

# 3. Set project
gcloud config set project onyourbehlf

# 4. Enable APIs
gcloud services enable appengine.googleapis.com cloudbuild.googleapis.com
```

### Quick Deploy (Recommended)

```bash
# From project root - Deploy everything
./deploy.sh

# That's it! The script handles:
# ✓ Validation
# ✓ Building
# ✓ Deployment
# ✓ Health checks
# ✓ Promotion to production
```

### Alternative: Deploy Individual Services

```bash
# Backend only
npm run deploy:backend

# Frontend only
npm run deploy:frontend
```

---

## 📝 Manual Deployment (Step-by-Step)

If you prefer manual control:

### 1. Build Backend
```bash
cd backend && npm ci && npm run build && cd ..
```

### 2. Build Frontend
```bash
cd frontend && npm ci && npm run build && cd ..
```

### 3. Deploy Backend
```bash
gcloud app deploy app.yaml --version=api-$(date +%Y%m%d%H%M%S)
```

### 4. Deploy Frontend
```bash
gcloud app deploy frontend-app.yaml --version=$(date +%Y%m%d%H%M%S)
```

### 5. Verify
```bash
curl https://api-dot-onyourbehlf.uc.r.appspot.com/api/health-status
```

---

## 🔍 Quick Verification

```bash
# Check services
gcloud app services list

# Check versions
gcloud app versions list

# View logs
gcloud app logs tail --service=api
```

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| Not authenticated | `gcloud auth login` |
| Wrong project | `gcloud config set project onyourbehlf` |
| Build fails | Check `backend/` and `frontend/` for errors |
| Deployment timeout | Wait longer or check Cloud Console |

---

## 📚 Full Documentation

See `GCLOUD_DEPLOYMENT_GUIDE.md` for comprehensive details.

---

**Project URLs:**
- Backend: `https://api-dot-onyourbehlf.uc.r.appspot.com`
- Frontend: `https://www.keralagiftsonline.in`

