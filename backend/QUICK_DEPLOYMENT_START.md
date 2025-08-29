# 🚀 Quick Deployment Start Guide
## Get KeralGiftsOnline Live in 30 Minutes

This is a condensed version of the full deployment guide for getting your website live quickly.

## ⚡ Quick Start Checklist

### 1. Prepare Your Environment (5 minutes)

**Backend Setup:**
```bash
cd backend
cp env.example .env
# Edit .env with your production values
```

**Frontend Setup:**
```bash
cd frontend
cp env.example .env.production
# Edit .env.production with your backend URL
```

### 2. Deploy Backend (10 minutes)

**Option A: Railway (Recommended)**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project → Deploy from GitHub repo
4. Set environment variables in Railway dashboard
5. Deploy automatically

**Option B: Use our script**
```bash
cd backend
./deploy-backend.sh
```

### 3. Deploy Frontend (10 minutes)

**Option A: Netlify (Recommended)**
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Import repository → Configure Next.js
4. Set environment variables
5. Deploy

**Option B: Use our script**
```bash
cd frontend
./deploy-frontend.sh
```

### 4. Configure Domain (5 minutes)

**In GoDaddy DNS Settings:**
```
Type: CNAME
Name: @
Value: your-app-name.netlify.app
TTL: 600

Type: CNAME
Name: www
Value: your-app-name.netlify.app
TTL: 600
```

**In Netlify Dashboard:**
1. Site Settings → Domain Management
2. Add custom domain: `keralagiftsonline.in`
3. Add custom domain: `www.keralagiftsonline.in`
4. Follow verification steps

## 🔧 Required Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/keralagiftsonline
JWT_SECRET=your-32-character-secret-key
JWT_REFRESH_SECRET=your-32-character-refresh-secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGIN=https://keralagiftsonline.in,https://www.keralagiftsonline.in
NODE_ENV=production
```

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
NEXT_PUBLIC_APP_NAME=KeralGiftsOnline
NEXT_PUBLIC_WHATSAPP_NUMBER=+918075030919
```

## 🎯 Deployment URLs

After deployment, you'll get:
- **Backend**: `https://your-app-name.railway.app` (or similar)
- **Frontend**: `https://your-app-name.netlify.app` (or similar)
- **Final**: `https://keralagiftsonline.in`

## ✅ Quick Test

1. **Test Backend**: Visit `https://your-backend-url.com/api/health`
2. **Test Frontend**: Visit `https://keralagiftsonline.in`
3. **Test Integration**: Try user registration/login

## 🚨 Common Issues & Quick Fixes

**Domain not loading?**
- Wait 24-48 hours for DNS propagation
- Check CNAME records are correct
- Verify SSL certificate is active

**API connection issues?**
- Check CORS settings in backend
- Verify environment variables
- Test API endpoints directly

**Build failures?**
- Check Node.js version (18+ required)
- Verify all dependencies are installed
- Check environment variables are set

## 📞 Need Help?

1. Check the full `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review error logs in your deployment platform dashboard
3. Test locally first: `npm run dev` in both frontend and backend

## 🎉 Success!

Once deployed, your website will be live at:
**https://keralagiftsonline.in**

**Next Steps:**
- Set up Google Analytics
- Configure payment gateway
- Test all features thoroughly
- Plan marketing strategy
