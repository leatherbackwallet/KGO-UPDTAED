/**
 * Error Tracker Service
 * Provides comprehensive error classification, logging, and performance metrics collection
 */

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  IMAGE_LOAD_ERROR = 'IMAGE_LOAD_ERROR',
  COMPONENT_ERROR = 'COMPONENT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  url?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  retryCount?: number;
  userAgent?: string;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface TrackedError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context: ErrorContext;
  resolved: boolean;
  resolvedAt?: Date;
  occurrenceCount: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
}

export interface PerformanceMetrics {
  apiResponseTimes: Map<string, number[]>;
  imageLoadTimes: Map<string, number[]>;
  cacheHitRates: Map<string, { hits: number; misses: number }>;
  errorRates: Map<ErrorType, number>;
  successRates: Map<string, { success: number; total: number }>;
  networkLatency: number[];
  renderTimes: Map<string, number[]>;
}

class ErrorTrackerService {
  private errors: Map<string, TrackedError> = new Map();
  private metrics: PerformanceMetrics = {
    apiResponseTimes: new Map(),
    imageLoadTimes: new Map(),
    cacheHitRates: new Map(),
    errorRates: new Map(),
    successRates: new Map(),
    networkLatency: [],
    renderTimes: new Map()
  };
  private sessionId: string;
  private maxStoredErrors = 1000;
  private maxMetricsEntries = 500;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeErrorHandlers();
    this.loadPersistedData();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeErrorHandlers(): void {
    // Only initialize error handlers in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        type: ErrorType.COMPONENT_ERROR,
        severity: ErrorSeverity.HIGH,
        message: event.message,
        stack: event.error?.stack,
        context: {
          timestamp: new Date(),
          sessionId: this.sessionId,
          component: 'Global',
          action: 'Runtime Error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        }
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.HIGH,
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        context: {
          timestamp: new Date(),
          sessionId: this.sessionId,
          component: 'Promise',
          action: 'Unhandled Rejection',
          metadata: {
            reason: event.reason
          }
        }
      });
    });
  }

  /**
   * Track an error with classification and context
   */
  trackError(errorData: {
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    stack?: string;
    context: Partial<ErrorContext>;
  }): string {
    const errorId = this.generateErrorId(errorData.type, errorData.message);
    const now = new Date();

    const existingError = this.errors.get(errorId);
    if (existingError) {
      // Update existing error
      existingError.occurrenceCount++;
      existingError.lastOccurrence = now;
      existingError.context = { ...existingError.context, ...errorData.context };
    } else {
      // Create new error entry
      const trackedError: TrackedError = {
        id: errorId,
        type: errorData.type,
        severity: errorData.severity,
        message: errorData.message,
        stack: errorData.stack,
        context: {
          timestamp: now,
          sessionId: this.sessionId,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
          ...errorData.context
        },
        resolved: false,
        occurrenceCount: 1,
        firstOccurrence: now,
        lastOccurrence: now
      };

      this.errors.set(errorId, trackedError);
    }

    // Update error rate metrics
    const currentRate = this.metrics.errorRates.get(errorData.type) || 0;
    this.metrics.errorRates.set(errorData.type, currentRate + 1);

    // Persist to localStorage
    this.persistData();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ErrorTracker] ${errorData.type}:`, errorData.message, errorData.context);
    }

    return errorId;
  }

  /**
   * Track API performance metrics
   */
  trackApiPerformance(endpoint: string, responseTime: number, success: boolean): void {
    // Track response times
    const times = this.metrics.apiResponseTimes.get(endpoint) || [];
    times.push(responseTime);
    if (times.length > this.maxMetricsEntries) {
      times.shift();
    }
    this.metrics.apiResponseTimes.set(endpoint, times);

    // Track success rates
    const rates = this.metrics.successRates.get(endpoint) || { success: 0, total: 0 };
    rates.total++;
    if (success) {
      rates.success++;
    }
    this.metrics.successRates.set(endpoint, rates);

    this.persistData();
  }

  /**
   * Track image loading performance
   */
  trackImagePerformance(imageUrl: string, loadTime: number, success: boolean): void {
    if (success) {
      const times = this.metrics.imageLoadTimes.get(imageUrl) || [];
      times.push(loadTime);
      if (times.length > this.maxMetricsEntries) {
        times.shift();
      }
      this.metrics.imageLoadTimes.set(imageUrl, times);
    }

    // Track success rates for images
    const rates = this.metrics.successRates.get(`image:${imageUrl}`) || { success: 0, total: 0 };
    rates.total++;
    if (success) {
      rates.success++;
    }
    this.metrics.successRates.set(`image:${imageUrl}`, rates);

    this.persistData();
  }

  /**
   * Track cache performance
   */
  trackCachePerformance(cacheKey: string, hit: boolean): void {
    const rates = this.metrics.cacheHitRates.get(cacheKey) || { hits: 0, misses: 0 };
    if (hit) {
      rates.hits++;
    } else {
      rates.misses++;
    }
    this.metrics.cacheHitRates.set(cacheKey, rates);
    this.persistData();
  }

  /**
   * Track network latency
   */
  trackNetworkLatency(latency: number): void {
    this.metrics.networkLatency.push(latency);
    if (this.metrics.networkLatency.length > this.maxMetricsEntries) {
      this.metrics.networkLatency.shift();
    }
    this.persistData();
  }

  /**
   * Track component render times
   */
  trackRenderTime(component: string, renderTime: number): void {
    const times = this.metrics.renderTimes.get(component) || [];
    times.push(renderTime);
    if (times.length > this.maxMetricsEntries) {
      times.shift();
    }
    this.metrics.renderTimes.set(component, times);
    this.persistData();
  }

  /**
   * Mark an error as resolved
   */
  resolveError(errorId: string): void {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date();
      this.persistData();
    }
  }

  /**
   * Get all tracked errors
   */
  getErrors(filters?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    resolved?: boolean;
    since?: Date;
  }): TrackedError[] {
    let errors = Array.from(this.errors.values());

    if (filters) {
      if (filters.type) {
        errors = errors.filter(e => e.type === filters.type);
      }
      if (filters.severity) {
        errors = errors.filter(e => e.severity === filters.severity);
      }
      if (filters.resolved !== undefined) {
        errors = errors.filter(e => e.resolved === filters.resolved);
      }
      if (filters.since) {
        errors = errors.filter(e => e.lastOccurrence >= filters.since!);
      }
    }

    return errors.sort((a, b) => b.lastOccurrence.getTime() - a.lastOccurrence.getTime());
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    resolvedErrors: number;
    unresolvedErrors: number;
    averageResolutionTime: number;
  } {
    const errors = Array.from(this.errors.values());
    const errorsByType = {} as Record<ErrorType, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;
    let resolvedErrors = 0;
    let totalResolutionTime = 0;

    errors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + error.occurrenceCount;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + error.occurrenceCount;
      
      if (error.resolved && error.resolvedAt) {
        resolvedErrors++;
        totalResolutionTime += error.resolvedAt.getTime() - error.firstOccurrence.getTime();
      }
    });

    return {
      totalErrors: errors.reduce((sum, e) => sum + e.occurrenceCount, 0),
      errorsByType,
      errorsBySeverity,
      resolvedErrors,
      unresolvedErrors: errors.length - resolvedErrors,
      averageResolutionTime: resolvedErrors > 0 ? totalResolutionTime / resolvedErrors : 0
    };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    averageApiResponseTime: number;
    averageImageLoadTime: number;
    overallCacheHitRate: number;
    averageNetworkLatency: number;
    slowestEndpoints: Array<{ endpoint: string; averageTime: number }>;
    errorRate: number;
  } {
    // Calculate average API response time
    let totalApiTime = 0;
    let totalApiRequests = 0;
    this.metrics.apiResponseTimes.forEach(times => {
      totalApiTime += times.reduce((sum, time) => sum + time, 0);
      totalApiRequests += times.length;
    });

    // Calculate average image load time
    let totalImageTime = 0;
    let totalImageRequests = 0;
    this.metrics.imageLoadTimes.forEach(times => {
      totalImageTime += times.reduce((sum, time) => sum + time, 0);
      totalImageRequests += times.length;
    });

    // Calculate overall cache hit rate
    let totalHits = 0;
    let totalRequests = 0;
    this.metrics.cacheHitRates.forEach(rates => {
      totalHits += rates.hits;
      totalRequests += rates.hits + rates.misses;
    });

    // Find slowest endpoints
    const slowestEndpoints = Array.from(this.metrics.apiResponseTimes.entries())
      .map(([endpoint, times]) => ({
        endpoint,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    // Calculate error rate
    const totalErrors = Array.from(this.metrics.errorRates.values()).reduce((sum, count) => sum + count, 0);
    const totalSuccessfulRequests = Array.from(this.metrics.successRates.values())
      .reduce((sum, rates) => sum + rates.success, 0);

    return {
      averageApiResponseTime: totalApiRequests > 0 ? totalApiTime / totalApiRequests : 0,
      averageImageLoadTime: totalImageRequests > 0 ? totalImageTime / totalImageRequests : 0,
      overallCacheHitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      averageNetworkLatency: this.metrics.networkLatency.length > 0 
        ? this.metrics.networkLatency.reduce((sum, lat) => sum + lat, 0) / this.metrics.networkLatency.length 
        : 0,
      slowestEndpoints,
      errorRate: (totalErrors + totalSuccessfulRequests) > 0 
        ? totalErrors / (totalErrors + totalSuccessfulRequests) 
        : 0
    };
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.errors.clear();
    this.metrics = {
      apiResponseTimes: new Map(),
      imageLoadTimes: new Map(),
      cacheHitRates: new Map(),
      errorRates: new Map(),
      successRates: new Map(),
      networkLatency: [],
      renderTimes: new Map()
    };
    
    // Only clear localStorage in browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('errorTracker_data');
    }
  }

  /**
   * Export data for analysis
   */
  exportData(): {
    errors: TrackedError[];
    metrics: PerformanceMetrics;
    sessionId: string;
    exportedAt: Date;
  } {
    return {
      errors: Array.from(this.errors.values()),
      metrics: this.getMetrics(),
      sessionId: this.sessionId,
      exportedAt: new Date()
    };
  }

  private generateErrorId(type: ErrorType, message: string): string {
    const hash = this.simpleHash(type + message);
    return `${type}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private persistData(): void {
    // Only persist data in browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const data = {
        errors: Array.from(this.errors.entries()),
        metrics: {
          apiResponseTimes: Array.from(this.metrics.apiResponseTimes.entries()),
          imageLoadTimes: Array.from(this.metrics.imageLoadTimes.entries()),
          cacheHitRates: Array.from(this.metrics.cacheHitRates.entries()),
          errorRates: Array.from(this.metrics.errorRates.entries()),
          successRates: Array.from(this.metrics.successRates.entries()),
          networkLatency: this.metrics.networkLatency,
          renderTimes: Array.from(this.metrics.renderTimes.entries())
        },
        sessionId: this.sessionId
      };

      localStorage.setItem('errorTracker_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist error tracker data:', error);
    }
  }

  private loadPersistedData(): void {
    // Only load persisted data in browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const data = localStorage.getItem('errorTracker_data');
      if (data) {
        const parsed = JSON.parse(data);
        
        // Restore errors
        if (parsed.errors) {
          this.errors = new Map(parsed.errors.map(([id, error]: [string, any]) => [
            id,
            {
              ...error,
              firstOccurrence: new Date(error.firstOccurrence),
              lastOccurrence: new Date(error.lastOccurrence),
              resolvedAt: error.resolvedAt ? new Date(error.resolvedAt) : undefined,
              context: {
                ...error.context,
                timestamp: new Date(error.context.timestamp)
              }
            }
          ]));
        }

        // Restore metrics
        if (parsed.metrics) {
          this.metrics = {
            apiResponseTimes: new Map(parsed.metrics.apiResponseTimes || []),
            imageLoadTimes: new Map(parsed.metrics.imageLoadTimes || []),
            cacheHitRates: new Map(parsed.metrics.cacheHitRates || []),
            errorRates: new Map(parsed.metrics.errorRates || []),
            successRates: new Map(parsed.metrics.successRates || []),
            networkLatency: parsed.metrics.networkLatency || [],
            renderTimes: new Map(parsed.metrics.renderTimes || [])
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted error tracker data:', error);
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTrackerService();
export default errorTracker;