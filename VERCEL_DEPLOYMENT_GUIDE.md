# Vercel Deployment Guide

## 🚀 Deploying Your Next.js App to Vercel

### Prerequisites
- Vercel account (free tier available)
- GitHub repository with your code
- Backend API deployed and accessible

### Step 1: Prepare Your Repository

1. **Ensure your repository is clean and builds successfully**
   ```bash
   npm run build
   ```

2. **Create a `vercel.json` configuration file in your project root:**
   ```json
   {
     "buildCommand": "npm run build:frontend",
     "outputDirectory": "frontend/.next",
     "installCommand": "npm install",
     "framework": "nextjs"
   }
   ```

### Step 2: Environment Variables Setup

Create a `.env.production` file in your `frontend` directory:

```env
# Production Environment Variables
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api/v1
NEXT_PUBLIC_SITE_URL=https://your-frontend-domain.vercel.app
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Production settings
NODE_ENV=production
```

### Step 3: Deploy to Vercel

#### Option A: Using Vercel CLI
1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the following settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### Step 4: Configure Environment Variables in Vercel

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api/v1
   NEXT_PUBLIC_SITE_URL=https://your-frontend-domain.vercel.app
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
   ```

### Step 5: Configure Build Settings

In your Vercel project settings:

1. **Build & Development Settings:**
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

2. **Root Directory:** `frontend` (if your Next.js app is in a subdirectory)

### Step 6: Domain Configuration

1. **Custom Domain (Optional):**
   - Go to **Settings** → **Domains**
   - Add your custom domain
   - Configure DNS records as instructed

2. **Environment Variables for Different Environments:**
   - **Production:** Use your production backend URL
   - **Preview:** Use your staging backend URL

### Step 7: Post-Deployment Verification

1. **Check Build Logs:**
   - Ensure the build completes successfully
   - Check for any TypeScript errors

2. **Test Functionality:**
   - Verify authentication works
   - Test API calls to your backend
   - Check image uploads (Cloudinary)
   - Test all major features

3. **Performance Check:**
   - Use Vercel Analytics to monitor performance
   - Check Core Web Vitals

### Troubleshooting Common Issues

#### Build Failures
- **TypeScript Errors:** Ensure all type errors are fixed before deployment
- **Missing Dependencies:** Check `package.json` for all required dependencies
- **Environment Variables:** Verify all required env vars are set in Vercel

#### Runtime Issues
- **API Connection:** Ensure your backend is accessible from Vercel
- **CORS Issues:** Configure CORS on your backend to allow Vercel domains
- **Authentication:** Verify JWT tokens work across domains

#### Performance Issues
- **Image Optimization:** Use Next.js Image component for optimal loading
- **Bundle Size:** Monitor bundle size and optimize if needed
- **Caching:** Configure appropriate cache headers

### Environment-Specific Configurations

#### Development
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### Staging
```env
NEXT_PUBLIC_API_URL=https://staging-backend.vercel.app/api/v1
NEXT_PUBLIC_SITE_URL=https://staging-frontend.vercel.app
```

#### Production
```env
NEXT_PUBLIC_API_URL=https://your-production-backend.com/api/v1
NEXT_PUBLIC_SITE_URL=https://your-production-frontend.vercel.app
```

### Continuous Deployment

1. **Connect GitHub Repository:**
   - Vercel will automatically deploy on every push to main branch
   - Preview deployments for pull requests

2. **Branch Protection:**
   - Set up branch protection rules in GitHub
   - Require successful builds before merging

3. **Environment Promotion:**
   - Use Vercel's promotion feature to move from staging to production

### Monitoring and Analytics

1. **Vercel Analytics:**
   - Enable Vercel Analytics for performance monitoring
   - Track Core Web Vitals

2. **Error Monitoring:**
   - Set up error tracking (Sentry, LogRocket, etc.)
   - Monitor API errors and user feedback

### Security Considerations

1. **Environment Variables:**
   - Never commit sensitive data to repository
   - Use Vercel's environment variable encryption

2. **API Security:**
   - Ensure your backend has proper CORS configuration
   - Use HTTPS for all API calls

3. **Authentication:**
   - Verify JWT token security
   - Implement proper session management

### Final Checklist

- [ ] Repository builds successfully locally
- [ ] All TypeScript errors are resolved
- [ ] Environment variables are configured in Vercel
- [ ] Backend API is deployed and accessible
- [ ] CORS is properly configured on backend
- [ ] Custom domain is configured (if applicable)
- [ ] All features are tested after deployment
- [ ] Performance monitoring is set up
- [ ] Error tracking is configured

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

---

**Note:** Replace `your-backend-domain.com`, `your-frontend-domain.vercel.app`, `your-cloudinary-cloud-name`, and `your-upload-preset` with your actual values.
