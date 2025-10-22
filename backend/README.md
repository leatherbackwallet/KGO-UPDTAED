# KeralGiftsOnline.com

**Enterprise-grade hyperlocal marketplace with promotions engine and advanced logistics**

## 🚀 Overview

KeralGiftsOnline.com is a comprehensive e-commerce platform designed for the global Kerala diaspora, specializing in gifts, cakes, flowers, and celebration items. Built with modern technologies and enterprise-grade architecture.

## ✨ Features

### 🎯 Core Features
- **English Language**: Clean, simple English interface
- **Role-Based Access Control**: Admin, Customer, Vendor, Support Agent, Delivery Agent
- **Advanced Product Management**: Extensible attribute system for product variations
- **Promotions Engine**: Complex rule-based promotions and discounts
- **Partial Fulfillment**: Shipment management for split orders
- **Real-time Logistics**: Hub management and delivery run optimization

### 🛍️ E-commerce Features
- Product catalog with categories and attributes
- Shopping cart and wishlist management
- Order management with status tracking
- Return merchandise authorization (RMA)
- Payment processing and transaction tracking
- Vendor management and payouts

### 📊 Business Intelligence
- Daily statistics and reporting
- Activity logging and audit trails
- Customer support ticket system
- Notification management
- Financial ledger tracking

## 🏗️ Architecture

### Database Schema (v3.0)
- **25 Collections** with enterprise-grade design
- **Promotions Engine** with complex rule-based logic
- **Shipments System** for partial fulfillment
- **Attributes System** for extensible product management
- **RBAC** with granular permissions
- **Soft Deletes** for data integrity

### Tech Stack
- **Backend**: Node.js + Express + TypeScript + MongoDB
- **Frontend**: Next.js + React + TypeScript + Tailwind CSS
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with role management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd keralagiftsonline
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

4. **Database Setup**
   ```bash
   # Seed the database with initial data
   npm run seed:v3
   ```

5. **Start Development**
   ```bash
   # Start both backend and frontend
   npm run dev
   
   # Or start individually
   npm run dev:backend  # Backend on port 5001
   npm run dev:frontend # Frontend on port 3000
   ```

## 📁 Project Structure

```
keralagiftsonline/
├── backend/                 # Node.js + Express API
│   ├── models/             # MongoDB schemas (v3)
│   ├── routes/             # API endpoints
│   ├── seeds/              # Database seeders
│   ├── migration/          # Database migration scripts
│   └── server.ts           # Main server file
├── frontend/               # Next.js + React app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── context/        # React context providers
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
└── database_schema_v3.json # Complete schema documentation
```

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Start both backend and frontend in development
- `npm run build` - Build both backend and frontend
- `npm run start` - Start both in production mode
- `npm run seed:v3` - Seed the database with v3 schema

### Backend
- `npm run dev` - Start with nodemon and ts-node
- `npm run build` - Compile TypeScript
- `npm run seed` - Run database seeder

### Frontend
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## 🗄️ Database Collections

### Core Collections
- `roles` - Role-based access control
- `users` - User management with schedules and addresses
- `categories` - Product categorization
- `products` - Product templates
- `attributes` - Extensible product attribute system
- `productAttributes` - Product-attribute value mappings

### Order Management
- `orders` - Parent order management
- `shipments` - Partial fulfillment and split shipments
- `returns` - RMA workflow management

### Business Features
- `promotions` - Advanced promotions engine
- `vendors` - Vendor management
- `vendorProducts` - Vendor-specific pricing
- `transactions` - Payment tracking
- `payouts` - Vendor payout management

### Logistics
- `hubs` - Physical packing stations
- `deliveryRuns` - Delivery route management

### Support & Analytics
- `supportTickets` - Customer support
- `notifications` - User notifications
- `activityLogs` - Audit trails
- `dailyStats` - Business intelligence
- `reviews` - Multi-faceted reviews
- `wishlists` - User wishlists

## 🔐 Authentication & Authorization

The system uses JWT-based authentication with role-based access control:

- **Admin**: Full system access
- **Customer**: Product browsing, ordering, wishlist
- **Vendor**: Product management, order viewing
- **Support Agent**: Customer support, order management
- **Delivery Agent**: Delivery management, status updates

## 🌐 Internationalization

Clean English interface:
- Product names and descriptions
- Category names and descriptions
- Attribute labels and options
- User interface elements

## 📈 Promotions Engine

Advanced rule-based promotions system:
- **Conditions**: Cart total, product presence, customer type
- **Actions**: Percentage discounts, fixed discounts, free shipping
- **Scheduling**: Start/end dates for campaigns
- **Coupon Codes**: Optional activation codes

## 🚚 Logistics System

Comprehensive logistics management:
- **Hubs**: Physical packing stations with geolocation
- **Delivery Runs**: Optimized delivery routes
- **Shipments**: Partial fulfillment tracking
- **Status Tracking**: Real-time delivery updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Email: sales@keralagiftsonline.com
- Documentation: [docs.keralagiftsonline.com](https://docs.keralagiftsonline.com)
- Issues: [GitHub Issues](https://github.com/keralagiftsonline/issues)

---

**Built with ❤️ by the KeralGiftsOnline Team**
