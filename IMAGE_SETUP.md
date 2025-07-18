# Local Image Storage Setup Guide

This guide explains how to set up local image storage for your bakery app instead of using AWS S3.

## Why Local Storage?

For a small bakery with ~100 products, local storage is:
- ✅ **Cost-effective** - No monthly AWS fees
- ✅ **Simple** - No complex cloud setup
- ✅ **Fast** - Direct file access
- ✅ **Reliable** - No network dependencies

## Folder Structure

```
frontend/
├── public/
│   └── images/
│       └── products/
│           ├── placeholder.jpg
│           ├── chocolate-celebration-cake.jpg
│           ├── vanilla-celebration-cake.jpg
│           ├── traditional-wedding-cake.jpg
│           └── ... (all your product images)
```

## Setup Instructions

### 1. Create the SD Images Folder

Create a folder called `sd-images` in your project root:

```bash
mkdir sd-images
```

### 2. Add Your SD Images

Place all your SD-generated product images in the `sd-images` folder and rename them according to this mapping:

| Product Slug | Image Filename |
|--------------|----------------|
| classic-chocolate-celebration-cake | chocolate-celebration-cake.jpg |
| vanilla-bean-celebration-cake | vanilla-celebration-cake.jpg |
| traditional-3-tier-wedding-cake | traditional-wedding-cake.jpg |
| modern-naked-wedding-cake | naked-wedding-cake.jpg |
| rainbow-birthday-cake | rainbow-birthday-cake.jpg |
| chocolate-truffle-birthday-cake | chocolate-truffle-cake.jpg |
| vanilla-cupcakes-buttercream | vanilla-cupcakes.jpg |
| red-velvet-cupcakes | red-velvet-cupcakes.jpg |
| chocolate-croissants | chocolate-croissants.jpg |
| apple-turnovers | apple-turnovers.jpg |
| chocolate-chip-cookies | chocolate-chip-cookies.jpg |
| sugar-cookies | sugar-cookies.jpg |
| sourdough-bread | sourdough-bread.jpg |
| whole-wheat-bread | whole-wheat-bread.jpg |

### 3. Run the Organization Script

```bash
node scripts/organize-images.js
```

This script will:
- Copy images from `sd-images/` to `frontend/public/images/products/`
- Create a placeholder image if needed
- Show you which images are missing

### 4. Verify Setup

After running the script, you should see:
- All product images in `frontend/public/images/products/`
- A placeholder image for fallbacks
- Your app loading images from local paths

## Image Naming Convention

- **Format**: `product-name.jpg` (lowercase, hyphens)
- **Size**: Recommended 600x600px for optimal performance
- **Quality**: 80-85% JPEG compression for good balance
- **Extensions**: `.jpg` for photos, `.png` for graphics with transparency

## How It Works

### Frontend Image Loading

The app uses the `imageUtils.ts` utility to:

1. **Primary**: Use the `defaultImage` path from the database
2. **Fallback**: Generate path from product slug
3. **Final Fallback**: Show placeholder image

```typescript
// Example usage in components
import { getProductImage } from '../utils/imageUtils';

const imagePath = getProductImage(product.defaultImage, product.slug);
```

### Database Storage

Product images are stored as local paths in the database:

```javascript
{
  name: "Classic Chocolate Celebration Cake",
  slug: "classic-chocolate-celebration-cake",
  defaultImage: "/images/products/chocolate-celebration-cake.jpg",
  // ... other fields
}
```

## Benefits of This Approach

### Performance
- **Fast Loading**: Direct file access
- **No CDN Needed**: Images served from your server
- **Caching**: Browser caches local images effectively

### Development
- **Easy Testing**: No external dependencies
- **Version Control**: Images can be tracked in git (if desired)
- **Simple Deployment**: Just copy the images folder

### Maintenance
- **No AWS Costs**: Zero monthly fees
- **No API Limits**: No S3 request limits
- **Full Control**: Complete ownership of your images

## Migration from AWS (if needed)

If you were previously using AWS S3, the migration is simple:

1. Download all images from S3
2. Rename them according to the mapping above
3. Place them in the `sd-images` folder
4. Run the organization script
5. Update your database to use local paths instead of S3 URLs

## Troubleshooting

### Images Not Loading
1. Check file paths in `frontend/public/images/products/`
2. Verify image filenames match the database
3. Ensure placeholder image exists

### Missing Images
1. Add missing images to `sd-images/` folder
2. Rename them according to the mapping
3. Run the organization script again

### Performance Issues
1. Optimize image sizes (recommend 600x600px max)
2. Use appropriate compression (80-85% JPEG)
3. Consider using WebP format for modern browsers

## Future Considerations

When your business grows beyond 1000+ products, consider:
- **CDN Integration**: For global performance
- **Image Optimization Service**: For automatic resizing
- **Cloud Storage**: For backup and scalability

But for now, local storage is perfect for your needs! 