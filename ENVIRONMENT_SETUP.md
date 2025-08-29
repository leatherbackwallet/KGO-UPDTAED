# Environment Configuration Guide

## Overview

This project uses a simplified environment structure with just two configurations:
- **Development**: For local development
- **Production**: For deployment

## File Structure

```
onYourBehlf/
├── backend/
│   ├── .env              # Development environment
│   └── .env.production   # Production environment
├── frontend/
│   ├── .env.local        # Development environment
│   └── .env.production   # Production environment
└── switch-env.sh         # Environment management script
```

## Environment Files

### Backend Environment Files

#### `backend/.env` (Development)
- **Port**: 5001
- **Node Environment**: development
- **CORS Origin**: http://localhost:3000
- **Log Level**: debug
- **Superuser Creation**: false

#### `backend/.env.production` (Production)
- **Port**: 8080
- **Node Environment**: production
- **CORS Origin**: https://onyourbehlf.ew.r.appspot.com
- **Log Level**: info
- **Superuser Creation**: true

### Frontend Environment Files

#### `frontend/.env.local` (Development)
- **API URL**: http://localhost:5001/api
- **Debug Mode**: true
- **Analytics**: false

#### `frontend/.env.production` (Production)
- **API URL**: https://api-dot-onyourbehlf.ew.r.appspot.com/api
- **Debug Mode**: false
- **Analytics**: true

## Environment Management

### Using the Switch Script

```bash
# Check current environment status
./switch-env.sh status

# Switch to development environment
./switch-env.sh development

# Switch to production environment
./switch-env.sh production
```

### Manual Environment Switching

#### For Development
1. Ensure `backend/.env` exists with development settings
2. Ensure `frontend/.env.local` exists with development settings
3. Start backend: `cd backend && npm run dev`
4. Start frontend: `cd frontend && npm run dev`

#### For Production
1. Ensure `backend/.env.production` exists with production settings
2. Ensure `frontend/.env.production` exists with production settings
3. Deploy backend using production environment variables
4. Deploy frontend using production environment variables

## Key Configuration Variables

### Backend Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `PORT` | 5001 | 8080 | Server port |
| `NODE_ENV` | development | production | Node environment |
| `CORS_ORIGIN` | http://localhost:3000 | https://onyourbehlf.ew.r.appspot.com | Allowed CORS origin |
| `LOG_LEVEL` | debug | info | Logging level |
| `CREATE_SUPERUSER` | false | true | Auto-create admin user |

### Frontend Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NEXT_PUBLIC_API_URL` | http://localhost:5001/api | https://api-dot-onyourbehlf.ew.r.appspot.com/api | Backend API URL |
| `NEXT_PUBLIC_ENABLE_DEBUG_MODE` | true | false | Enable debug mode |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | false | true | Enable analytics |

## Security Notes

- **MongoDB Atlas**: Always use MongoDB Atlas in production, never local MongoDB
- **JWT Secrets**: Must be at least 32 characters long
- **Environment Variables**: Never commit actual `.env` files to version control
- **Production URLs**: Use HTTPS in production environments

## Troubleshooting

### Common Issues

1. **Backend won't start**: Check if `backend/.env` exists and has correct MongoDB URI
2. **Frontend can't connect to backend**: Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
3. **CORS errors**: Ensure `CORS_ORIGIN` matches your frontend URL
4. **Environment not switching**: Run `./switch-env.sh status` to check current configuration

### Validation Commands

```bash
# Check backend environment
cd backend && node -e "require('dotenv').config(); console.log('PORT:', process.env.PORT); console.log('NODE_ENV:', process.env.NODE_ENV);"

# Check frontend environment
cd frontend && node -e "console.log('API_URL:', process.env.NEXT_PUBLIC_API_URL);"
```

## Migration from Old Structure

If you're migrating from the old environment structure:

1. **Backup existing files**: Copy any important environment variables
2. **Remove old files**: Delete redundant `.env` files
3. **Use new structure**: Follow the setup guide above
4. **Test both environments**: Verify development and production work correctly

## Best Practices

1. **Never commit secrets**: All `.env` files are in `.gitignore`
2. **Use example files**: `env.example` files show the required structure
3. **Validate configurations**: Use the switch script to verify settings
4. **Document changes**: Update this guide when adding new variables
5. **Test thoroughly**: Always test both environments before deployment
