# OnYourBehlf - E-commerce Platform

This project is split into two separate services that are deployed independently:

## Project Structure

```
onYourBehlf/
├── frontend/          # Next.js frontend application
└── backend/           # Node.js/Express backend API
```

## Quick Start

### Backend Setup
```bash
cd backend
npm install
# Development environment is already configured in backend/.env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
# Development environment is already configured in frontend/.env.local
npm run dev
```

## Deployment

### Backend Deployment
- Navigate to `backend/` directory
- Follow the deployment guide in `backend/DEPLOYMENT_GUIDE.md`
- Deploy to your preferred backend server

### Frontend Deployment
- Navigate to `frontend/` directory
- Follow the deployment guide in `frontend/README.md`
- Deploy to your preferred frontend server

## Environment Configuration

We use a simplified environment structure with just two configurations:

### Development Environment
- **Backend**: `backend/.env` - Local development settings
- **Frontend**: `frontend/.env.local` - Local development settings

### Production Environment  
- **Backend**: `backend/.env.production` - Production deployment settings
- **Frontend**: `frontend/.env.production` - Production deployment settings

### Environment Management
Use the provided script to manage environments:
```bash
./switch-env.sh status       # Check current environment status
./switch-env.sh development  # Switch to development mode
./switch-env.sh production   # Switch to production mode
```

### Key Configuration Variables
- **Backend**: MongoDB Atlas connection, JWT secrets, Cloudinary CDN, server settings
- **Frontend**: Backend API URL, Next.js configuration, external service integrations

## API Communication

The frontend communicates with the backend via HTTP API calls. The backend URL is configured in the frontend's environment variables.

## Documentation

- Backend documentation: `backend/README.md`
- Frontend documentation: `frontend/README.md`
- Deployment guides: See respective directories
