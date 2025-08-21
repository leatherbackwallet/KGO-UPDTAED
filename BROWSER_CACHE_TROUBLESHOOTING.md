# Browser Cache Troubleshooting Guide

## Issue: Different Content in Different Browsers

### Problem Description
You're seeing different products and images when accessing `localhost:3000/products` in different browsers or browser sessions.

### Root Causes Identified

1. **Browser Caching**: Different browsers cache API responses and images differently
2. **User Authentication State**: Different user sessions (admin vs guest) may affect content
3. **Image Loading Issues**: Network conditions or image path resolution differences
4. **Server-Side Caching**: Backend cache serving stale data

### Solutions Implemented

#### 1. **Reduced Server Cache Time**
- Product cache reduced from 2 minutes to 30 seconds
- Added cache busting headers to prevent browser caching

#### 2. **Cache Busting Parameters**
- Added `_t=timestamp` parameter to API calls
- Forces fresh data on each request

#### 3. **Improved Image Error Handling**
- Better fallback logic for failed images
- Data URI placeholder for complete failures

#### 4. **Cache Invalidation Endpoint**
- Admin-only endpoint to manually clear cache: `POST /api/products/clear-cache`

### Immediate Fixes

#### Option 1: Use the Cache Clear Script
```bash
./clear-cache-and-restart.sh
```

#### Option 2: Manual Steps
1. **Stop all servers** (Ctrl+C in terminal)
2. **Clear browser caches**:
   - Chrome: Ctrl+Shift+Delete → Clear browsing data
   - Safari: Cmd+Option+E → Empty caches
   - Firefox: Ctrl+Shift+Delete → Clear recent history
3. **Clear Next.js cache**:
   ```bash
   cd frontend
   rm -rf .next
   ```
4. **Restart servers**:
   ```bash
   npm run dev
   ```
5. **Force refresh browsers**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

#### Option 3: Admin Cache Clear
If logged in as admin:
```bash
curl -X POST "http://localhost:5001/api/products/clear-cache" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Prevention Measures

#### 1. **Development Environment**
- Use incognito/private browsing for testing
- Disable browser caching in DevTools (Network tab → Disable cache)
- Use different browsers for testing

#### 2. **Production Environment**
- Implement proper cache headers
- Use CDN with cache invalidation
- Monitor cache hit rates

### Verification Steps

1. **Check API Response**:
   ```bash
   curl "http://localhost:5001/api/products?_t=$(date +%s)"
   ```

2. **Verify Image URLs**:
   - Check browser DevTools → Network tab
   - Look for failed image requests
   - Verify image paths are correct

3. **Test Different Browsers**:
   - Open incognito windows
   - Use different browsers
   - Clear all caches

### Common Issues and Solutions

#### Issue: Images not loading
**Solution**: Check image paths in DevTools → Console for errors

#### Issue: Products not updating
**Solution**: Clear server cache and force refresh browser

#### Issue: Different products shown
**Solution**: Verify API response is consistent across browsers

#### Issue: Authentication affecting content
**Solution**: Test with both authenticated and guest sessions

### Debug Commands

```bash
# Check current products in database
curl "http://localhost:5001/api/products" | jq '.data[] | {name, price, stock}'

# Check cache status
curl "http://localhost:5001/api/products" -H "Cache-Control: no-cache"

# Clear all caches and restart
./clear-cache-and-restart.sh
```

### Monitoring

- Watch browser DevTools → Network tab for API calls
- Check server logs for cache hits/misses
- Monitor image loading in Console tab
- Verify consistent responses across browsers

### Long-term Solutions

1. **Implement proper cache strategies**
2. **Use service workers for image caching**
3. **Add cache versioning**
4. **Implement real-time updates**
5. **Add cache monitoring and alerts**
