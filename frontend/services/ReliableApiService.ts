import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { RetryManager } from './RetryManager';
import { CircuitBreaker } from './CircuitBreaker';
import { ConnectionMonitor } from './ConnectionMonitor';
import { errorTracker, ErrorType as TrackerErrorType, ErrorSeverity } from './ErrorTracker';
import { 
  RequestOptions, 
  ApiResponse, 
  ApiError, 
  ErrorType, 
  ConnectionStatus,
  CacheStats 
} from './types';

export class ReliableApiService {
  private axiosInstance: AxiosInstance;
  private retryManager: RetryManager;
  private circuitBreaker: CircuitBreaker;
  private connectionMonitor: ConnectionMonitor;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private cacheStats: CacheStats = { hits: 0, misses: 0, size: 0, hitRate: 0 };

  constructor(baseURL?: string, timeout: number = 30000) {
    this.axiosInstance = axios.create({
      baseURL: baseURL || process.env.NEXT_PUBLIC_API_URL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.retryManager = new RetryManager();
    this.circuitBreaker = new CircuitBreaker();
    this.connectionMonitor = new ConnectionMonitor();

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for auth tokens
    this.axiosInstance.interceptors.request.use(
      (config) => {
        try {
          if (typeof window !== 'undefined') {
            const tokens = localStorage.getItem('tokens');
            if (tokens) {
              const parsedTokens = JSON.parse(tokens);
              if (parsedTokens?.accessToken && config.headers) {
                config.headers.Authorization = `Bearer ${parsedTokens.accessToken}`;
              }
            }
          }
        } catch (error) {
          console.error('Error adding auth token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            if (typeof window !== 'undefined') {
              const tokens = localStorage.getItem('tokens');
              if (tokens) {
                const parsedTokens = JSON.parse(tokens);
                if (parsedTokens?.refreshToken) {
                  const refreshResponse = await axios.post(
                    `${this.axiosInstance.defaults.baseURL}/auth/refresh`,
                    { refreshToken: parsedTokens.refreshToken }
                  );

                  if (refreshResponse.data.success) {
                    const newTokens = refreshResponse.data.data.tokens;
                    localStorage.setItem('tokens', JSON.stringify(newTokens));
                    
                    originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                    return this.axiosInstance(originalRequest);
                  }
                }
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('tokens');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, options);
  }

  async post<T>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data, options);
  }

  async put<T>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data, options);
  }

  async delete<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  private async request<T>(
    method: string,
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    const {
      timeout = 30000,
      retries = 3,
      cacheStrategy = 'network-first',
      cacheTTL = 300000, // 5 minutes default
      priority = 'normal'
    } = options;

    const cacheKey = this.generateCacheKey(method, url, data);
    
    // Check cache first if cache-first strategy
    if (cacheStrategy === 'cache-first' || cacheStrategy === 'cache-only') {
      const cachedResult = this.getFromCache<T>(cacheKey);
      if (cachedResult) {
        // Track cache hit
        errorTracker.trackCachePerformance(cacheKey, true);
        return cachedResult;
      }
      
      // Track cache miss
      errorTracker.trackCachePerformance(cacheKey, false);
      
      if (cacheStrategy === 'cache-only') {
        const error = new Error('No cached data available and cache-only strategy specified');
        errorTracker.trackError({
          type: TrackerErrorType.CACHE_ERROR,
          severity: ErrorSeverity.MEDIUM,
          message: error.message,
          context: {
            url,
            method,
            metadata: {
              cacheStrategy,
              cacheKey
            }
          }
        });
        throw error;
      }
    }

    // Check connection status
    const connectionStatus = this.connectionMonitor.getStatus();
    if (!connectionStatus.online) {
      // Try to serve from cache if offline
      const cachedResult = this.getFromCache<T>(cacheKey);
      if (cachedResult) {
        errorTracker.trackCachePerformance(cacheKey, true);
        return cachedResult;
      }
      
      const error = this.createApiError(ErrorType.NETWORK_ERROR, 'No internet connection', true);
      errorTracker.trackError({
        type: TrackerErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        message: error.message,
        context: {
          url,
          method,
          metadata: {
            connectionStatus
          }
        }
      });
      throw error;
    }

    // Execute request with circuit breaker and retry logic
    try {
      const result = await this.circuitBreaker.execute(async () => {
        return await this.retryManager.execute(
          async () => {
            const config: AxiosRequestConfig = {
              method: method.toLowerCase() as any,
              url,
              data,
              timeout,
            };

            const response = await this.axiosInstance.request<T>(config);
            return response;
          },
          {
            maxRetries: retries,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffFactor: 2,
            retryCondition: RetryManager.defaultRetryCondition,
            onRetry: async (attempt, error) => {
              console.log(`Retrying request ${url} (attempt ${attempt}):`, error.message);
              
              // If first retry and error suggests cold start, try warmup
              if (attempt === 1 && (error.message.includes('CORS') || error.message.includes('502'))) {
                try {
                  console.log('🔥 Attempting instance warmup...');
                  await fetch(`${this.axiosInstance.defaults.baseURL}/warmup`, {
                    method: 'GET',
                    cache: 'no-cache'
                  });
                  console.log('✅ Instance warmup completed');
                } catch (warmupError) {
                  console.log('⚠️ Warmup failed, continuing with retry');
                }
              }
              
              // Track retry attempts
              errorTracker.trackError({
                type: TrackerErrorType.NETWORK_ERROR,
                severity: ErrorSeverity.MEDIUM,
                message: `API retry attempt ${attempt}: ${error.message}`,
                context: {
                  url,
                  method,
                  metadata: {
                    retryAttempt: attempt,
                    maxRetries: retries
                  }
                }
              });
            }
          }
        );
      });

      const responseTime = performance.now() - startTime;
      
      // Track successful API call
      errorTracker.trackApiPerformance(url, responseTime, true);

      // Cache successful responses for GET requests
      if (method === 'GET' && result.data) {
        this.setCache(cacheKey, result.data, cacheTTL);
      }

      return {
        data: result.data,
        success: true,
        cached: false,
        timestamp: Date.now()
      };

    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      // Track failed API call
      errorTracker.trackApiPerformance(url, responseTime, false);
      
      // Try to serve stale cache data if network-first strategy fails
      if (cacheStrategy === 'network-first') {
        const cachedResult = this.getFromCache<T>(cacheKey, true); // Allow stale
        if (cachedResult) {
          errorTracker.trackCachePerformance(cacheKey, true);
          
          // Track that we served stale data due to API failure
          errorTracker.trackError({
            type: TrackerErrorType.NETWORK_ERROR,
            severity: ErrorSeverity.MEDIUM,
            message: 'Serving stale cache data due to API failure',
            context: {
              url,
              method,
              responseTime,
              metadata: {
                originalError: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          });
          
          return cachedResult;
        }
      }

      const apiError = this.handleError(error);
      
      // Track the API error
      errorTracker.trackError({
        type: this.mapErrorTypeToTrackerType(apiError.type),
        severity: this.getErrorSeverity(apiError),
        message: apiError.message,
        context: {
          url,
          method,
          responseTime,
          metadata: {
            retryable: apiError.retryable,
            ...apiError.context
          }
        }
      });

      throw apiError;
    }
  }

  private generateCacheKey(method: string, url: string, data?: any): string {
    const dataStr = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataStr}`;
  }

  private getFromCache<T>(key: string, allowStale = false): ApiResponse<T> | null {
    const cached = this.cache.get(key);
    if (!cached) {
      this.cacheStats.misses++;
      this.updateCacheStats();
      return null;
    }

    const now = Date.now();
    const isStale = now > cached.timestamp + cached.ttl;

    if (isStale && !allowStale) {
      this.cache.delete(key);
      this.cacheStats.misses++;
      this.updateCacheStats();
      return null;
    }

    this.cacheStats.hits++;
    this.updateCacheStats();

    return {
      data: cached.data,
      success: true,
      cached: true,
      timestamp: cached.timestamp
    };
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    this.updateCacheStats();
  }

  private updateCacheStats(): void {
    this.cacheStats.size = this.cache.size;
    const total = this.cacheStats.hits + this.cacheStats.misses;
    this.cacheStats.hitRate = total > 0 ? this.cacheStats.hits / total : 0;
  }

  private handleError(error: any): ApiError {
    let errorType: ErrorType;
    let message: string;
    let retryable = false;

    if (!error.response) {
      // Network error
      errorType = ErrorType.NETWORK_ERROR;
      message = 'Network connection failed';
      retryable = true;
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // Timeout error
      errorType = ErrorType.TIMEOUT_ERROR;
      message = 'Request timed out';
      retryable = true;
    } else if (error.response.status >= 500) {
      // Server error
      errorType = ErrorType.SERVER_ERROR;
      message = error.response.data?.message || 'Server error occurred';
      retryable = true;
    } else if (error.response.status === 429) {
      // Rate limiting
      errorType = ErrorType.SERVER_ERROR;
      message = 'Too many requests - please try again later';
      retryable = true;
    } else {
      // Client error
      errorType = ErrorType.SERVER_ERROR;
      message = error.response.data?.message || error.message || 'Request failed';
      retryable = false;
    }

    return this.createApiError(errorType, message, retryable, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url
    });
  }

  private createApiError(
    type: ErrorType,
    message: string,
    retryable: boolean,
    context?: Record<string, any>
  ): ApiError {
    return {
      type,
      message,
      retryable,
      timestamp: new Date(),
      context
    };
  }

  // Public methods for cache management
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      const keysToDelete: string[] = [];
      this.cache.forEach((value, key) => {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
    this.updateCacheStats();
  }

  getCacheStats(): CacheStats {
    return { ...this.cacheStats };
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionMonitor.getStatus();
  }

  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
    return this.connectionMonitor.onStatusChange(callback);
  }

  // Get circuit breaker state for monitoring
  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  // Reset circuit breaker (useful for recovery)
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  // Map API error types to tracker error types
  private mapErrorTypeToTrackerType(errorType: ErrorType): TrackerErrorType {
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
        return TrackerErrorType.NETWORK_ERROR;
      case ErrorType.TIMEOUT_ERROR:
        return TrackerErrorType.TIMEOUT_ERROR;
      case ErrorType.SERVER_ERROR:
        return TrackerErrorType.SERVER_ERROR;
      case ErrorType.PARSE_ERROR:
        return TrackerErrorType.PARSE_ERROR;
      case ErrorType.CACHE_ERROR:
        return TrackerErrorType.CACHE_ERROR;
      default:
        return TrackerErrorType.UNKNOWN_ERROR;
    }
  }

  // Determine error severity based on error details
  private getErrorSeverity(error: ApiError): ErrorSeverity {
    if (error.context?.status >= 500) {
      return ErrorSeverity.HIGH;
    }
    if (error.context?.status === 429) {
      return ErrorSeverity.MEDIUM;
    }
    if (error.type === ErrorType.NETWORK_ERROR || error.type === ErrorType.TIMEOUT_ERROR) {
      return ErrorSeverity.MEDIUM;
    }
    return ErrorSeverity.LOW;
  }

  // Destroy the service and clean up resources
  destroy(): void {
    this.connectionMonitor.destroy();
    this.cache.clear();
  }
}