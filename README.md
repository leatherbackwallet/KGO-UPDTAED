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
cp env.example .env
# Edit .env with your MongoDB Atlas credentials and other settings
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp env.example .env.local
# Edit .env.local with your backend API URL
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

### Backend (.env)
- MongoDB Atlas connection string
- JWT secrets
- Cloudinary CDN credentials
- Server configuration

### Frontend (.env.local)
- Backend API URL
- Next.js configuration
- External service integrations

## API Communication

The frontend communicates with the backend via HTTP API calls. The backend URL is configured in the frontend's environment variables.

## Documentation

- Backend documentation: `backend/README.md`
- Frontend documentation: `frontend/README.md`
- Deployment guides: See respective directories
