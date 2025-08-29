# OnYourBehalf E-Commerce Platform

This is a full-stack e-commerce website built with Next.js (React, Tailwind CSS), Express.js, and MongoDB.

## Features
- Customer and admin authentication (JWT)
- Product catalog with filtering and search
- Shopping cart and checkout (no payment integration)
- Order management for customers and admins
- Admin dashboard for managing products, orders, and users

## Project Structure
- `/frontend` — Next.js (React, Tailwind CSS, TypeScript)
- `/backend` — Express.js (Node.js, MongoDB)

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repo-url>
cd onYourBehalf
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev # or: node server.js
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

### 4. Usage
- Visit `http://localhost:3000` for the storefront
- Register as a user or login as admin (set role in DB or via admin panel)
- Admin panel: `/admin` (must be admin)

## Environment Variables
- **Backend** (`backend/.env`):
  - `MONGODB_URI` — MongoDB connection string
  - `JWT_SECRET` — Secret for JWT signing
- **Frontend** (`frontend/.env.local`):
  - `NEXT_PUBLIC_API_URL` — (optional) API base URL

## License
MIT 