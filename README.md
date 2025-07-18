# OnYourBehalf E-Commerce Platform

A full-stack e-commerce application built with Next.js (React, TypeScript, Tailwind CSS) frontend and Express.js (Node.js, MongoDB) backend.

## 🚀 Features

- **User Authentication**: JWT-based login/register system
- **Role-based Access**: Customer and Admin roles
- **Product Management**: CRUD operations for products (Admin only)
- **Shopping Cart**: Persistent cart with localStorage
- **Order Management**: Create and track orders
- **Admin Dashboard**: Manage products, orders, and users
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **JWT Decode** - Token handling

### Backend
- **Express.js** - Node.js framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **CORS** - Cross-origin requests

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB database (local or cloud)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd onYourBehlf
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Environment Setup

#### Backend (.env file in backend directory)
```env
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database
JWT_SECRET=your_super_secret_key_here
PORT=5001
```

#### Frontend (.env.local file in frontend directory - optional)
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### 4. Start the application

#### Option 1: Start both frontend and backend together
```bash
npm run dev
```

#### Option 2: Start separately
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:frontend
```

### 5. Access the application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api

## 🔧 Available Scripts

### Root Directory
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:backend` - Start only the backend server
- `npm run dev:frontend` - Start only the frontend server
- `npm run install:all` - Install dependencies for all packages
- `npm run build` - Build the frontend for production
- `npm run start` - Start the backend in production mode

### Backend Directory
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

### Frontend Directory
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 👤 Default Admin Account

The application automatically creates a superuser account on first run:

- **Email**: admin@onyourbehalf.com
- **Password**: SuperSecure123!
- **Role**: Admin

## 🗄️ Database Schema

### Users
- name, email, password, role (Customer/Admin)

### Products
- name, description, price, category, stock, images

### Orders
- user, products[], totalAmount, shippingAddress, status

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders (Admin only)
- `GET /api/orders/my` - Get user's orders
- `PUT /api/orders/:id/status` - Update order status (Admin only)

### Users
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id/grant` - Grant admin role (Admin only)
- `PUT /api/users/:id/revoke` - Revoke admin role (Admin only)

## 🐛 Troubleshooting

### Port 5000 Already in Use
The backend now uses port 5001 by default to avoid conflicts with macOS ControlCenter. If you need to use a different port:

1. Update `backend/server.js` line 45
2. Update `frontend/src/utils/api.ts` line 3
3. Update your environment variables

### MongoDB Connection Issues
1. Verify your MongoDB URI is correct
2. Ensure your IP is whitelisted (if using MongoDB Atlas)
3. Check network connectivity

### Frontend Build Issues
1. Clear Next.js cache: `rm -rf frontend/.next`
2. Reinstall dependencies: `cd frontend && npm install`

### Backend Issues
1. Check if MongoDB is running
2. Verify environment variables
3. Check server logs for specific errors

## 📁 Project Structure

```
onYourBehlf/
├── backend/
│   ├── middleware/     # Authentication & authorization
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   ├── utils/          # Helper functions
│   ├── server.js       # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── context/    # React contexts
│   │   ├── pages/      # Next.js pages
│   │   ├── styles/     # Global styles
│   │   └── utils/      # Helper functions
│   └── package.json
└── package.json        # Root package.json
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Ensure all dependencies are installed
4. Verify your environment variables are correct

For additional help, please open an issue in the repository.
