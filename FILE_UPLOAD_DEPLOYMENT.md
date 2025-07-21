# File Upload Feature - Deployment Guide

## Overview
This guide explains how the file upload feature works and how to deploy it in production environments.

## How It Works

### Backend Implementation
1. **Upload Route**: `/api/upload/product-image` - Handles file uploads with multer
2. **File Storage**: Files are stored in `backend/public/images/products/`
3. **File Naming**: Uses UUID for unique filenames to prevent conflicts
4. **Validation**: Only allows image files (JPG, PNG, GIF, WEBP) up to 5MB
5. **Security**: Requires admin authentication

### Frontend Implementation
1. **FileUpload Component**: Drag-and-drop interface with preview
2. **Auto-association**: Uploaded files are automatically associated with products
3. **Error Handling**: Comprehensive error messages and validation

## Development Setup

### Prerequisites
- Node.js 18+ 
- MongoDB
- All dependencies installed (`npm install`)

### Local Development
1. **Backend**: Files are stored in `backend/public/images/products/`
2. **Frontend**: Images served via Express static middleware
3. **Database**: Product records store image URLs

### Testing the Feature
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Login as admin
4. Go to Admin Dashboard > Products
5. Try uploading an image using the new upload area

## Production Deployment

### Option 1: Local File Storage (Simple)
**Best for**: Small to medium applications, single server deployments

#### Backend Configuration
```bash
# Ensure upload directory exists
mkdir -p /var/www/your-app/backend/public/images/products

# Set proper permissions
chmod 755 /var/www/your-app/backend/public/images/products
chown www-data:www-data /var/www/your-app/backend/public/images/products
```

#### Environment Variables
```env
# .env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://your-mongodb-uri
JWT_SECRET=your-jwt-secret
```

#### Nginx Configuration (if using)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # API routes
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded images
    location /images/ {
        alias /var/www/your-app/backend/public/images/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend
    location / {
        root /var/www/your-app/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### Option 2: Cloud Storage (Recommended for Production)
**Best for**: Scalable applications, multiple servers, high availability

#### AWS S3 Configuration
1. **Install AWS SDK**:
```bash
cd backend
npm install aws-sdk multer-s3
```

2. **Update upload route** (`backend/routes/upload.ts`):
```typescript
import AWS from 'aws-sdk';
import multerS3 from 'multer-s3';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET,
  key: (req, file, cb) => {
    const fileName = `products/${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, fileName);
  }
});
```

3. **Environment Variables**:
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

#### Google Cloud Storage Configuration
1. **Install Google Cloud SDK**:
```bash
cd backend
npm install @google-cloud/storage multer-gcs
```

2. **Update upload route**:
```typescript
import { Storage } from '@google-cloud/storage';
import multerGcs from 'multer-gcs';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
});

const multerStorage = multerGcs.storageEngine({
  bucket: process.env.GOOGLE_CLOUD_BUCKET,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
  filename: (req, file, cb) => {
    const fileName = `products/${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, fileName);
  }
});
```

### Option 3: CDN Integration
**Best for**: Global applications, high performance

#### CloudFront (AWS)
1. Create CloudFront distribution
2. Point origin to S3 bucket
3. Update image URLs to use CloudFront domain

#### Cloudflare
1. Upload files to Cloudflare R2 or use existing storage
2. Configure custom domain for images
3. Enable caching and optimization

## Security Considerations

### File Upload Security
1. **File Type Validation**: Only allow image files
2. **File Size Limits**: 5MB maximum
3. **Authentication**: Admin-only access
4. **Virus Scanning**: Consider integrating virus scanning for uploaded files
5. **Rate Limiting**: Implement upload rate limiting

### Environment Variables
```env
# Required
JWT_SECRET=your-secure-jwt-secret
MONGODB_URI=your-mongodb-connection-string

# Optional (for cloud storage)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# File upload limits
MAX_FILE_SIZE=5242880  # 5MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
```

## Monitoring and Maintenance

### File Management
1. **Regular Cleanup**: Remove orphaned files not associated with products
2. **Backup Strategy**: Backup uploaded files regularly
3. **Storage Monitoring**: Monitor disk space usage

### Performance Optimization
1. **Image Compression**: Implement server-side image compression
2. **Caching**: Use CDN caching for frequently accessed images
3. **Lazy Loading**: Implement lazy loading for product images

### Error Handling
1. **Upload Failures**: Log and monitor upload failures
2. **Storage Issues**: Monitor disk space and storage errors
3. **Network Issues**: Handle network timeouts gracefully

## Troubleshooting

### Common Issues
1. **Permission Denied**: Check file permissions on upload directory
2. **File Not Found**: Verify static file serving configuration
3. **Upload Timeout**: Increase timeout limits for large files
4. **CORS Issues**: Ensure proper CORS configuration

### Debug Commands
```bash
# Check upload directory permissions
ls -la backend/public/images/products/

# Check disk space
df -h

# Check server logs
tail -f backend/logs/app.log

# Test file upload endpoint
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.jpg" \
  http://localhost:5001/api/upload/product-image
```

## Migration from Manual Image Management

If you're migrating from the old manual image system:

1. **Backup existing images**:
```bash
cp -r frontend/public/images/products/* backend/public/images/products/
```

2. **Update existing products** to use new image URLs
3. **Test upload functionality** with new products
4. **Remove old image management scripts** once confirmed working

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify file permissions and directory structure
3. Test upload endpoint directly with curl
4. Review environment variable configuration 