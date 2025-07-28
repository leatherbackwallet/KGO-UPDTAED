# KeralGiftsOnline Setup Instructions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 4.4+
- npm or yarn

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd onYourBehlf
npm install
```

### 2. Environment Setup

#### Backend Setup
```bash
cd backend
cp env.example .env
```

Edit `backend/.env` with your configuration:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/keralagiftsonline

# JWT Configuration (CHANGE THIS!)
JWT_SECRET=your-super-secret-jwt-key-here

# Admin User Configuration (optional)
ADMIN_EMAIL=admin@keralagiftsonline.com
ADMIN_PASSWORD=SuperSecure123!
ADMIN_PHONE=+49123456789

# Server Configuration
PORT=5001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

#### Frontend Setup
```bash
cd frontend
cp env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### 3. Database Setup
```bash
cd backend
npm run seed
```

### 4. Start Development Servers
```bash
# From project root
npm run dev
```

This will start both:
- Backend: http://localhost:5001
- Frontend: http://localhost:3000

## 🔧 High Priority Fixes Implemented

### Security Fixes
✅ **Removed hardcoded admin credentials** - Now uses environment variables
✅ **Added JWT secret validation** - Prevents startup with missing JWT_SECRET
✅ **Added input sanitization** - Prevents XSS attacks
✅ **Added CORS configuration** - Restricts origins
✅ **Added validation middleware** - Validates all inputs

### Performance Fixes
✅ **Implemented search debouncing** - 300ms delay prevents excessive API calls
✅ **Fixed search logic** - Improved regex handling for occasions
✅ **Added database indexes** - Better query performance
✅ **Added result limits** - Prevents large result sets

### Error Handling
✅ **Added comprehensive error handling** - Better user feedback
✅ **Added loading states** - Better UX during operations
✅ **Added input validation** - Prevents invalid data submission

## 🛡️ Security Checklist

- [x] JWT_SECRET is properly configured
- [x] Admin credentials are in environment variables
- [x] Input sanitization is active
- [x] CORS is properly configured
- [x] Validation middleware is applied
- [x] Error messages don't expose sensitive data

## 🚀 Performance Checklist

- [x] Search debouncing implemented
- [x] Database indexes added
- [x] Query limits applied
- [x] Loading states added
- [x] Error boundaries implemented
- [x] Rate limiting implemented
- [x] Response caching added
- [x] Database connection pooling
- [x] Performance monitoring
- [x] Request logging
- [x] Health check endpoints

## 🔍 Testing the Search Functionality

1. Navigate to http://localhost:3000/products
2. Try searching for products - should have 300ms debounce
3. Check browser network tab - should see fewer API calls
4. Test with invalid inputs - should show proper error messages

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check if MongoDB is running
- Verify MONGODB_URI in .env
- Ensure JWT_SECRET is set

**Search not working:**
- Check browser console for errors
- Verify API is running on port 5001
- Check network tab for failed requests

**Admin login issues:**
- Verify admin credentials in .env
- Check if seed script ran successfully
- Try running seed script again

### Logs
- Backend logs: Check terminal where backend is running
- Frontend logs: Check browser console
- Database logs: Check MongoDB logs

## 📝 Next Steps

After implementing these high and medium priority fixes, consider:

1. **Low Priority:**
   - Add comprehensive testing
   - Implement CI/CD pipeline
   - Add accessibility features
   - Implement PWA features
   - Add offline support
   - Optimize for mobile
   - Add analytics integration
   - Implement A/B testing

## 🔗 Useful Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Seed database
npm run seed

# Lint code
npm run lint

# Type check
npm run type-check
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review the logs
3. Verify environment variables
4. Ensure all dependencies are installed 