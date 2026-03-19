/**
 * Performance monitoring utilities
 * Provides tools to monitor and optimize application performance
 */

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: [],
      memory: [],
      navigation: {},
      resources: {},
      userTiming: new Map(),
      renderTimes: new Map(),
      bundleSize: 0,
    };
    
    this.isMonitoring = false;
    this.observers = new Map();
    this.rafId = null;
    this.startTime = Date.now();
    
    this.initializeMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  initializeMonitoring() {
    // Track page load performance
    this.trackPageLoad();
    
    // Track resource loading
    this.trackResourceLoading();
    
    // Track memory usage if available
    this.trackMemoryUsage();
    
    // Track navigation timing
    this.trackNavigationTiming();
  }

  /**
   * Start active monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Performance monitoring started');
    
    // Start FPS monitoring
    this.startFPSMonitoring();
    
    // Start memory monitoring
    this.startMemoryMonitoring();
    
    // Start render time monitoring
    this.startRenderTimeMonitoring();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    console.log('Performance monitoring stopped');
  }

  /**
   * Start FPS monitoring
   */
  startFPSMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = (currentTime) => {
      if (!this.isMonitoring) return;
      
      frameCount++;
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        this.metrics.fps.push({
          timestamp: Date.now(),
          value: fps,
        });
        
        // Keep only last 60 seconds of FPS data
        if (this.metrics.fps.length > 60) {
          this.metrics.fps.shift();
        }
        
        // Check for performance issues
        if (fps < 30) {
          console.warn(`Low FPS detected: ${fps}`);
          this.reportPerformanceIssue('Low FPS', { fps });
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      this.rafId = requestAnimationFrame(measureFPS);
    };
    
    this.rafId = requestAnimationFrame(measureFPS);
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    if (!performance.memory) return;
    
    const measureMemory = () => {
      if (!this.isMonitoring) return;
      
      const memoryInfo = {
        timestamp: Date.now(),
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
      };
      
      this.metrics.memory.push(memoryInfo);
      
      // Keep only last 60 seconds of memory data
      if (this.metrics.memory.length > 60) {
        this.metrics.memory.shift();
      }
      
      // Check for memory leaks
      const memoryUsage = memoryInfo.used / memoryInfo.limit;
      if (memoryUsage > 0.8) {
        console.warn(`High memory usage: ${(memoryUsage * 100).toFixed(1)}%`);
        this.reportPerformanceIssue('High Memory Usage', memoryInfo);
      }
      
      setTimeout(measureMemory, 1000);
    };
    
    measureMemory();
  }

  /**
   * Start render time monitoring
   */
  startRenderTimeMonitoring() {
    // Observe render performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.metrics.renderTimes.set(entry.name, {
            duration: entry.duration,
            timestamp: entry.startTime,
          });
          
          // Check for slow renders
          if (entry.duration > 16.67) { // More than one frame
            console.warn(`Slow render detected for ${entry.name}: ${entry.duration.toFixed(2)}ms`);
            this.reportPerformanceIssue('Slow Render', {
              name: entry.name,
              duration: entry.duration,
            });
          }
        }
      }
    });
    
    observer.observe({ entryTypes: ['measure'] });
    this.observers.set('render', observer);
  }

  /**
   * Track page load performance
   */
  trackPageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.metrics.navigation = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint(),
          totalTime: navigation.loadEventEnd - navigation.navigationStart,
        };
        
        console.log('Page load metrics:', this.metrics.navigation);
      }
    });
  }

  /**
   * Track resource loading
   */
  trackResourceLoading() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceName = this.getResourceName(entry.name);
          if (!this.metrics.resources[resourceName]) {
            this.metrics.resources[resourceName] = [];
          }
          
          this.metrics.resources[resourceName].push({
            duration: entry.duration,
            size: entry.transferSize || 0,
            timestamp: entry.startTime,
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resources', observer);
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage() {
    if (performance.memory) {
      setInterval(() => {
        if (!this.isMonitoring) return;
        
        const memoryInfo = {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
        };
        
        // Check for potential memory leaks
        if (this.metrics.memory.length > 10) {
          const recentMemory = this.metrics.memory.slice(-10);
          const memoryTrend = this.calculateTrend(recentMemory.map(m => m.used));
          
          if (memoryTrend > 1000000) { // Increasing by more than 1MB per second
            console.warn('Potential memory leak detected', { memoryTrend });
            this.reportPerformanceIssue('Memory Leak Detected', { memoryTrend });
          }
        }
      }, 5000);
    }
  }

  /**
   * Track navigation timing
   */
  trackNavigationTiming() {
    // Track route changes if using React Router
    window.addEventListener('popstate', () => {
      this.measureRouteChange('popstate');
    });
    
    // Override pushState to track navigation
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      const result = originalPushState.apply(history, args);
      this.measureRouteChange('pushState');
      return result;
    };
  }

  /**
   * Measure route change performance
   */
  measureRouteChange(type) {
    const startTime = performance.now();
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.markUserTiming(`route-change-${type}`, duration);
        
        if (duration > 100) {
          console.warn(`Slow route change: ${duration.toFixed(2)}ms`);
          this.reportPerformanceIssue('Slow Route Change', { type, duration });
        }
      });
    });
  }

  /**
   * Mark user timing
   */
  markUserTiming(name, duration) {
    performance.mark(`${name}-start`);
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    this.metrics.userTiming.set(name, {
      duration,
      timestamp: Date.now(),
    });
  }

  /**
   * Measure function execution time
   */
  measureFunction(fn, name = fn.name || 'anonymous') {
    return (...args) => {
      const startTime = performance.now();
      
      try {
        const result = fn(...args);
        
        if (result && typeof result.then === 'function') {
          // Async function
          return result.finally(() => {
            const duration = performance.now() - startTime;
            this.markUserTiming(`function-${name}`, duration);
          });
        } else {
          // Sync function
          const duration = performance.now() - startTime;
          this.markUserTiming(`function-${name}`, duration);
          return result;
        }
      } catch (error) {
        const duration = performance.now() - startTime;
        this.markUserTiming(`function-${name}-error`, duration);
        throw error;
      }
    };
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      fps: this.getFPSMetrics(),
      memory: this.getMemoryMetrics(),
      navigation: this.metrics.navigation,
      resources: this.getResourceMetrics(),
      userTiming: Object.fromEntries(this.metrics.userTiming),
      renderTimes: Object.fromEntries(this.metrics.renderTimes),
      bundleSize: this.metrics.bundleSize,
      uptime: Date.now() - this.startTime,
      isMonitoring: this.isMonitoring,
    };
  }

  /**
   * Get FPS metrics
   */
  getFPSMetrics() {
    if (this.metrics.fps.length === 0) return null;
    
    const fpsValues = this.metrics.fps.map(f => f.value);
    return {
      current: fpsValues[fpsValues.length - 1] || 0,
      average: fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length,
      min: Math.min(...fpsValues),
      max: Math.max(...fpsValues),
      samples: fpsValues.length,
    };
  }

  /**
   * Get memory metrics
   */
  getMemoryMetrics() {
    if (this.metrics.memory.length === 0) return null;
    
    const latestMemory = this.metrics.memory[this.metrics.memory.length - 1];
    const memoryValues = this.metrics.memory.map(m => m.used);
    
    return {
      current: latestMemory.used,
      total: latestMemory.total,
      limit: latestMemory.limit,
      usagePercentage: (latestMemory.used / latestMemory.limit) * 100,
      trend: this.calculateTrend(memoryValues),
      samples: memoryValues.length,
    };
  }

  /**
   * Get resource metrics
   */
  getResourceMetrics() {
    const resourceMetrics = {};
    
    Object.entries(this.metrics.resources).forEach(([name, entries]) => {
      const durations = entries.map(e => e.duration);
      const sizes = entries.map(e => e.size);
      
      resourceMetrics[name] = {
        count: entries.length,
        averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        totalSize: sizes.reduce((a, b) => a + b, 0),
        slowest: Math.max(...durations),
      };
    });
    
    return resourceMetrics;
  }

  /**
   * Calculate trend from array of values
   */
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  /**
   * Get first paint time
   */
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  /**
   * Get first contentful paint time
   */
  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : 0;
  }

  /**
   * Get resource name from URL
   */
  getResourceName(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || urlObj.pathname;
    } catch {
      return url;
    }
  }

  /**
   * Report performance issue
   */
  reportPerformanceIssue(type, data) {
    const issue = {
      type,
      data,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    
    console.error('Performance Issue:', issue);
    
    // You could send this to an analytics service
    if (window.reportAnalytics) {
      window.reportAnalytics('performance_issue', issue);
    }
  }

  /**
   * Track bundle size
   */
  trackBundleSize() {
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    scripts.forEach(script => {
      // Estimate size from src (rough approximation)
      if (script.src.includes('/static/js/')) {
        totalSize += 50000; // Rough estimate per chunk
      }
    });
    
    this.metrics.bundleSize = totalSize;
    
    if (totalSize > 1000000) { // 1MB
      this.reportPerformanceIssue('Large Bundle Size', { size: totalSize });
    }
  }

  /**
   * Create performance report
   */
  createReport() {
    const metrics = this.getMetrics();
    
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      uptime: metrics.uptime,
      pageLoad: metrics.navigation,
      bundleSize: metrics.bundleSize,
      fps: metrics.fps,
      memory: metrics.memory,
      slowFunctions: Object.entries(metrics.renderTimes)
        .filter(([_, data]) => data.duration > 50)
        .map(([name, data]) => ({ name, duration: data.duration })),
      resources: Object.entries(metrics.resources)
        .filter(([_, data]) => data.averageDuration > 1000)
        .map(([name, data]) => ({ name, ...data })),
    };
    
    return report;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Debounce utility for performance optimization
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle utility for performance optimization
 */
export function throttle(func, limit) {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoization utility for expensive computations
 */
export function memoize(fn, getKey = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  
  return function(...args) {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Lazy load utility for components
 */
export function lazyLoad(importFn, fallback = null) {
  return {
    loading: fallback,
    component: importFn().then(module => module.default),
  };
}

/**
 * Measure React component render performance
 */
export function useRenderTiming(componentName) {
  const startTime = useRef(null);
  
  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current) {
        const duration = performance.now() - startTime.current;
        performanceMonitor.markUserTiming(`component-${componentName}`, duration);
      }
    };
  });
}

/**
 * Performance benchmark utility
 */
export class PerformanceBenchmark {
  constructor(name) {
    this.name = name;
    this.measurements = [];
  }
  
  start(label = 'start') {
    performance.mark(`${this.name}-${label}`);
  }
  
  end(label = 'end') {
    performance.mark(`${this.name}-${label}`);
    performance.measure(
      `${this.name}-${label}`,
      `${this.name}-start`,
      `${this.name}-${label}`
    );
    
    const measure = performance.getEntriesByName(`${this.name}-${label}`)[0];
    this.measurements.push({
      label,
      duration: measure.duration,
      timestamp: Date.now(),
    });
    
    return measure.duration;
  }
  
  getResults() {
    return {
      name: this.name,
      measurements: this.measurements,
      averageDuration: this.measurements.reduce((sum, m) => sum + m.duration, 0) / this.measurements.length,
      totalDuration: this.measurements.reduce((sum, m) => sum + m.duration, 0),
    };
  }
  
  reset() {
    this.measurements = [];
    // Clear performance marks
    performance.clearMarks(`${this.name}-start`);
    performance.clearMarks(`${this.name}-end`);
  }
}

/**
 * Performance score calculator
 */
export function calculatePerformanceScore(metrics) {
  let score = 100;
  
  // FPS scoring (40% weight)
  if (metrics.fps) {
    const fpsScore = Math.min(100, (metrics.fps.average / 60) * 100);
    score = score * 0.6 + fpsScore * 0.4;
  }
  
  // Memory usage scoring (30% weight)
  if (metrics.memory) {
    const memoryScore = Math.max(0, 100 - metrics.memory.usagePercentage);
    score = score * 0.7 + memoryScore * 0.3;
  }
  
  // Page load scoring (30% weight)
  if (metrics.navigation && metrics.navigation.totalTime) {
    const loadScore = Math.max(0, 100 - (metrics.navigation.totalTime / 50));
    score = score * 0.7 + loadScore * 0.3;
  }
  
  return Math.round(score);
}

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.startMonitoring();
}