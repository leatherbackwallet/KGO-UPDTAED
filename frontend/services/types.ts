// Core types for the reliable API service
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  cacheStrategy?: 'cache-first' | 'network-first' | 'cache-only';
  cacheTTL?: number;
  priority?: 'high' | 'normal' | 'low';
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  cached: boolean;
  timestamp: number;
  error?: ApiError;
}

export interface ApiError {
  type: ErrorType;
  message: string;
  code?: string;
  retryable: boolean;
  timestamp: Date;
  context?: Record<string, any>;
}

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  IMAGE_LOAD_ERROR = 'IMAGE_LOAD_ERROR'
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryState {
  attempt: number;
  nextRetryAt: Date | null;
  lastError: Error | null;
  isRetrying: boolean;
}

export interface ConnectionStatus {
  online: boolean;
  speed: NetworkSpeed;
  latency: number;
  lastChecked: Date;
}

export type NetworkSpeed = 'slow' | 'medium' | 'fast';

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: Date | null;
  nextAttemptTime: Date | null;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// Image loading types
export interface ImageLoadOptions {
  lazy?: boolean;
  placeholder?: string;
  sizes?: string;
  priority?: 'high' | 'normal' | 'low';
  onProgress?: (loaded: number, total: number) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  fallbackSources?: string[];
  enableBlurTransition?: boolean;
  preloadSize?: 'thumb' | 'small' | 'medium' | 'large';
}

export interface ImageLoadResult {
  url: string;
  cached: boolean;
  fallbackUsed: boolean;
  loadTime: number;
  source: 'primary' | 'fallback' | 'placeholder';
  error?: Error;
}

export interface ImageLoadingState {
  loading: boolean;
  loaded: boolean;
  error: Error | null;
  fallbackUsed: boolean;
  cached: boolean;
  progress: number;
  source: 'primary' | 'fallback' | 'placeholder';
}