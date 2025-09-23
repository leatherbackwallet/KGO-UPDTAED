/**
 * Performance Monitoring Utility
 * Tracks page load times, user interactions, and performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'navigation' | 'interaction' | 'error' | 'custom';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private isInitialized = false;

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    // Monitor navigation timing
    if ('performance' in window) {
      this.observeNavigationTiming();
      this.observeResourceTiming();
      this.observeLongTasks();
      this.isInitialized = true;
    }
  }

  private observeNavigationTiming() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.loadEventStart, 'navigation');
          this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart, 'navigation');
          this.recordMetric('first_paint', navEntry.responseStart - navEntry.fetchStart, 'navigation');
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.set('navigation', observer);
  }

  private observeResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.duration > 1000) { // Log slow resources (>1s)
            this.recordMetric('slow_resource', resourceEntry.duration, 'custom', {
              name: resourceEntry.name,
              type: resourceEntry.initiatorType
            });
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }

  private observeLongTasks() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'longtask') {
            this.recordMetric('long_task', entry.duration, 'custom', {
              startTime: entry.startTime,
              name: entry.name
            });
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    }
  }

  public recordMetric(name: string, value: number, category: PerformanceMetric['category'], metadata?: any) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      category
    };

    this.metrics.push(metric);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance Metric [${category}]: ${name} = ${value}ms`, metadata);
    }

    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric, metadata);
    }
  }

  public measureInteraction(name: string, fn: () => void | Promise<void>) {
    const start = performance.now();
    
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start;
          this.recordMetric(`interaction_${name}`, duration, 'interaction');
        });
      } else {
        const duration = performance.now() - start;
        this.recordMetric(`interaction_${name}`, duration, 'interaction');
        return result;
      }
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`interaction_${name}_error`, duration, 'error');
      throw error;
    }
  }

  public measureAsyncInteraction(name: string, fn: () => Promise<any>) {
    const start = performance.now();
    
    return fn()
      .then((result) => {
        const duration = performance.now() - start;
        this.recordMetric(`async_interaction_${name}`, duration, 'interaction');
        return result;
      })
      .catch((error) => {
        const duration = performance.now() - start;
        this.recordMetric(`async_interaction_${name}_error`, duration, 'error');
        throw error;
      });
  }

  private sendToAnalytics(metric: PerformanceMetric, metadata?: any) {
    // Send to your analytics service
    // Example: Google Analytics, Sentry, or custom endpoint
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_category: metric.category,
        ...metadata
      });
    }
  }

  public getMetrics() {
    return this.metrics;
  }

  public getMetricsByCategory(category: PerformanceMetric['category']) {
    return this.metrics.filter(m => m.category === category);
  }

  public clearMetrics() {
    this.metrics = [];
  }

  public disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  public initialize() {
    if (typeof window !== 'undefined' && !this.isInitialized) {
      this.initializeObservers();
    }
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor; 