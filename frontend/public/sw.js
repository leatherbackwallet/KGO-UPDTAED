/**
 * Service Worker for Image Caching
 * Provides advanced caching for product images and offline support
 */

const CACHE_NAME = 'kgo-product-images-v2';
const IMAGE_CACHE_NAME = 'kgo-images-v2';
const API_CACHE_NAME = 'kgo-api-v2';

// Conservative caching settings
const CACHE_EXPIRY_TIME = 1000 * 60 * 60 * 2; // 2 hours for API responses
const IMAGE_CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours for images
const MAX_CACHE_ENTRIES = 50; // Limit cache size

// Files to cache on install
const STATIC_FILES = [
  '/',
  '/images/products/placeholder.svg',
  '/images/products/birthday-cake.svg',
  '/images/products/wedding-cake.svg',
  '/images/products/chocolates.svg',
  '/images/products/rose-bouquet.svg',
  '/images/products/gift-basket-premium.svg'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle image requests
  if (request.destination === 'image' || url.pathname.includes('/api/images/')) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static file requests
  if (url.pathname.startsWith('/images/')) {
    event.respondWith(handleStaticFileRequest(request));
    return;
  }
});

// Handle image requests with caching
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  
  try {
    // Try to get from cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('Image served from cache:', request.url);
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
      console.log('Image cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Image fetch failed:', error);
    
    // Return placeholder for failed image requests
    const placeholderResponse = await cache.match('/images/products/placeholder.svg');
    if (placeholderResponse) {
      return placeholderResponse;
    }
    
    // Fallback to network
    return fetch(request);
  }
}

// Handle API requests with caching
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const url = new URL(request.url);
  
  // Only cache GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }

  try {
    // Try to get from cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('API response served from cache:', request.url);
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses for certain endpoints
    if (networkResponse.ok && shouldCacheApiResponse(url.pathname)) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
      console.log('API response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('API fetch failed:', error);
    
    // Try to return cached response if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to network
    return fetch(request);
  }
}

// Handle static file requests
async function handleStaticFileRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try to get from cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Static file fetch failed:', error);
    return fetch(request);
  }
}

// Determine if API response should be cached
function shouldCacheApiResponse(pathname) {
  const cacheableEndpoints = [
    '/api/products',
    '/api/categories',
    '/api/images/'
  ];
  
  return cacheableEndpoints.some(endpoint => pathname.startsWith(endpoint));
}

// Message event - handle cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
