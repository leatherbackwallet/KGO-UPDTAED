# Environment Setup Guide

## 🎯 Clean Environment Structure

This project now uses a clean, standardized environment structure with separate development and production configurations.

## 📁 Environment Files Structure

```
📁 Root/
├── .env                     # Active environment (copied from env.development/production)
├── env.development          # Development environment (real values)
├── env.production           # Production environment (real values)
├── env.example              # Master template (placeholders)
├── switch-to-dev.sh         # Switch to development script
├── switch-to-prod.sh        # Switch to production script
│
📁 backend/
├── .env                     # Active backend environment (copied from env.development/production)
├── env.development          # Backend development config
├── env.production           # Backend production config
├── env.example              # Backend template
│
📁 frontend/
├── .env.local               # Active frontend development environment
├── .env.production          # Active frontend production environment
├── env.development          # Frontend development config
├── env.production           # Frontend production config
├── env.example              # Frontend template
```

## 🚀 Quick Start

### Development Environment
```bash
# Switch to development
./switch-to-dev.sh

# Start backend
cd backend && npm run dev

# Start frontend (in new terminal)
cd frontend && npm run dev
```

### Production Environment
```bash
# Switch to production
./switch-to-prod.sh

# Start backend
cd backend && npm run start:prod

# Start frontend (in new terminal)
cd frontend && npm run start:prod
```

## 🔧 Environment Variables

### Shared Variables (Root Level)
- **Database**: MongoDB Atlas connection
- **JWT Secrets**: Authentication tokens
- **Cloudinary**: Image hosting
- **Razorpay**: Payment processing
- **Security**: Rate limiting, sessions

### Backend Specific
- **PORT**: Server port (5001 dev, 8080 prod)
- **CORS_ORIGIN**: Allowed frontend origins
- **File Upload**: Size limits, allowed types

### Frontend Specific
- **API_URL**: Backend API endpoint
- **Feature Flags**: Analytics, debug mode, PWA
- **Performance**: Caching, compression settings

## 📋 Key Differences: Dev vs Production

| Variable | Development | Production |
|----------|-------------|------------|
| **Backend Port** | 5001 | 8080 |
| **Frontend Port** | 3000 | $PORT |
| **API URL** | http://localhost:5001/api | https://api-dot-onyourbehlf.uc.r.appspot.com/api |
| **Frontend URL** | http://localhost:3000 | https://onyourbehlf.uc.r.appspot.com |
| **CORS Origin** | http://localhost:3000 | https://onyourbehlf.uc.r.appspot.com |
| **Debug Mode** | true | false |
| **Analytics** | false | true |
| **PWA** | false | true |

## 🔄 Environment Switching

### Automatic Switching
The backend automatically loads the correct environment file based on `NODE_ENV`:
- `NODE_ENV=development` → loads `env.development`
- `NODE_ENV=production` → loads `env.production`

### Manual Switching
```bash
# Development
NODE_ENV=development npm run dev

# Production
NODE_ENV=production npm run start
```

## 🛡️ Security Notes

- **Real Values**: All environment files contain real, working values
- **No Placeholders**: No stub or dummy data
- **MongoDB Atlas**: Only cloud database, no local MongoDB
- **Secure Secrets**: All JWT and session secrets are production-ready

## 📝 Maintenance

### Adding New Variables
1. Add to `env.example` (master template)
2. Add to `env.development` (with dev values)
3. Add to `env.production` (with prod values)
4. Update backend/frontend specific files if needed

### Updating Values
1. Update the specific environment file
2. Run the appropriate switch script
3. Restart the affected services

## ✅ Benefits

- ✅ **No Duplication**: Single source of truth for each environment
- ✅ **Easy Switching**: Simple scripts to change environments
- ✅ **Real Values**: No placeholders or stubs
- ✅ **Maintainable**: Clear structure and documentation
- ✅ **Secure**: Production secrets separate from development