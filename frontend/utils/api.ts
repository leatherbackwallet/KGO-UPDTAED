import axios, { AxiosResponse, AxiosError } from 'axios';


// Safe localStorage access
const safeGetTokens = (): { accessToken: string; refreshToken: string } | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const tokens = window.localStorage.getItem('tokens');
    return tokens ? JSON.parse(tokens) : null;
  } catch (error) {
    console.error('Error getting tokens from localStorage:', error);
    return null;
  }
};

const safeSetTokens = (tokens: any): boolean => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem('tokens', JSON.stringify(tokens));
    return true;
  } catch (error) {
    console.error('Error setting tokens in localStorage:', error);
    return false;
  }
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000, // Increased to 30 seconds to prevent global timeouts
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Enhanced request configuration
  withCredentials: false, // Disable credentials for CORS
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  try {
    const tokens = safeGetTokens();
    if (tokens?.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
  } catch (error) {
    console.error('Error adding auth token to request:', error);
  }
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Handle response errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = safeGetTokens();
        if (!tokens?.refreshToken) {
          // No refresh token, redirect to login
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('tokens');
            window.localStorage.removeItem('user');
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        // Try to refresh the token
        const refreshResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken: tokens.refreshToken }
        );

        if (refreshResponse.data.success) {
          const newTokens = refreshResponse.data.data.tokens;
          safeSetTokens(newTokens);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('tokens');
          window.localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
