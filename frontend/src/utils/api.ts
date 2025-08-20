import axios from 'axios';

// Utility function to safely extract text from multilingual objects
export const getMultilingualText = (text: string | { en: string; ml: string } | undefined, preferredLanguage: 'en' | 'ml' = 'en'): string => {
  if (!text) return '';
  
  if (typeof text === 'string') return text;
  
  // Try preferred language first, then fallback to English, then Malayalam
  if (preferredLanguage === 'ml' && text.ml) return text.ml;
  if (text.en) return text.en;
  if (text.ml) return text.ml;
  
  return '';
};

// Cross-browser compatible localStorage function
const safeGetToken = (): string | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem('token');
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  try {
    const token = safeGetToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error adding auth token to request:', error);
  }
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Handle response errors
api.interceptors.response.use(
  (response) => {
    // Validate multilingual content structure
    if (response.data && response.data.data) {
      const validateMultilingualContent = (obj: any) => {
        if (obj && typeof obj === 'object') {
          // Check if it's a multilingual object
          if (obj.en !== undefined || obj.ml !== undefined) {
            // Ensure both languages are present
            if (!obj.en && !obj.ml) {
              console.warn('Multilingual content missing both English and Malayalam translations:', obj);
            }
          }
          // Recursively check nested objects
          Object.values(obj).forEach(value => {
            if (typeof value === 'object' && value !== null) {
              validateMultilingualContent(value);
            }
          });
        }
      };

      if (Array.isArray(response.data.data)) {
        response.data.data.forEach(validateMultilingualContent);
      } else {
        validateMultilingualContent(response.data.data);
      }
    }
    
    return response;
  },
  (error) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      console.error('API Error Response:', error.response.status, error.response.data);
      
      // Handle validation errors specifically
      if (error.response.status === 400 && error.response.data?.error?.code === 'VALIDATION_ERROR') {
        const details = error.response.data.error.details;
        if (details) {
          details.forEach((detail: any) => {
            if (detail.field && detail.field.includes('ml')) {
              console.error('Malayalam language validation error:', detail);
            }
          });
        }
      }
      
      // Handle authentication errors
      if (error.response.status === 401) {
        // Clear invalid token
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem('token');
            window.localStorage.removeItem('user');
          }
        } catch (e) {
          console.error('Error clearing auth data:', e);
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Network Error:', error.request);
    } else {
      // Something else happened
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
