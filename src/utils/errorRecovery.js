/**
 * Error recovery utilities
 * Provides comprehensive error handling, recovery mechanisms, and graceful degradation
 */

import { saveToStorage, loadFromStorage, STORAGE_KEYS_ENUM } from './persistence';

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Error types
 */
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  QUOTA: 'quota',
  PARSE: 'parse',
  RUNTIME: 'runtime',
  STORAGE: 'storage',
  AUTH: 'auth',
  CONFLICT: 'conflict',
  TIMEOUT: 'timeout',
};

/**
 * Circuit breaker states
 */
const CIRCUIT_STATES = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open',
};

/**
 * Error recovery manager
 */
export class ErrorRecoveryManager {
  constructor() {
    this.errorLog = [];
    this.recoveryStrategies = new Map();
    this.circuitBreakers = new Map();
    this.retryQueues = new Map();
    this.maxRetries = 3;
    this.baseDelay = 1000;
    this.maxDelay = 30000;
    
    this.initializeDefaultStrategies();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Initialize default recovery strategies
   */
  initializeDefaultStrategies() {
    // Network error recovery
    this.addRecoveryStrategy(ERROR_TYPES.NETWORK, async (error, context) => {
      if (navigator.onLine) {
        // Online, try immediate retry
        return this.executeWithBackoff(context.operation, context.retryCount + 1);
      } else {
        // Offline, queue for later
        return this.queueForRetry(context);
      }
    });

    // Storage error recovery
    this.addRecoveryStrategy(ERROR_TYPES.STORAGE, async (error, context) => {
      // Try to clear space
      await this.cleanupStorage();
      // Retry with exponential backoff
      return this.executeWithBackoff(context.operation, context.retryCount + 1);
    });

    // Validation error recovery
    this.addRecoveryStrategy(ERROR_TYPES.VALIDATION, async (error, context) => {
      // Try to repair the data
      if (context.data) {
        const repaired = await this.repairData(context.data, context.dataType);
        if (repaired) {
          return context.operation(repaired);
        }
      }
      throw new Error('Validation error cannot be recovered');
    });

    // Permission error recovery
    this.addRecoveryStrategy(ERROR_TYPES.PERMISSION, async (error, context) => {
      // Try to request permission
      if (context.permissionRequest) {
        const granted = await context.permissionRequest();
        if (granted) {
          return context.operation();
        }
      }
      throw new Error('Permission denied');
    });

    // Quota error recovery
    this.addRecoveryStrategy(ERROR_TYPES.QUOTA, async (error, context) => {
      // Try to free up space
      await this.freeUpQuotaSpace();
      return this.executeWithBackoff(context.operation, context.retryCount + 1);
    });

    // Timeout error recovery
    this.addRecoveryStrategy(ERROR_TYPES.TIMEOUT, async (error, context) => {
      // Retry with increased timeout
      const newContext = {
        ...context,
        timeout: (context.timeout || 5000) * 2,
      };
      return this.executeWithBackoff(newContext.operation, context.retryCount + 1);
    });
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: ERROR_TYPES.RUNTIME,
        severity: ERROR_SEVERITY.HIGH,
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        originalError: event.reason,
      });
    });

    // Global errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: ERROR_TYPES.RUNTIME,
        severity: ERROR_SEVERITY.HIGH,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        originalError: event.error,
      });
    });
  }

  /**
   * Handle error with recovery
   */
  async handleError(error) {
    const errorInfo = this.normalizeError(error);
    
    // Log error
    this.logError(errorInfo);
    
    // Try recovery
    const strategy = this.recoveryStrategies.get(errorInfo.type);
    if (strategy && errorInfo.context) {
      try {
        const result = await strategy(errorInfo, errorInfo.context);
        this.logRecovery(errorInfo, true);
        return result;
      } catch (recoveryError) {
        this.logRecovery(errorInfo, false, recoveryError);
      }
    }
    
    // Fallback to graceful degradation
    return this.gracefulDegradation(errorInfo);
  }

  /**
   * Normalize error object
   */
  normalizeError(error) {
    return {
      type: error.type || this.determineErrorType(error),
      severity: error.severity || ERROR_SEVERITY.MEDIUM,
      message: error.message || error.toString(),
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context: error.context,
      originalError: error.originalError || error,
    };
  }

  /**
   * Determine error type from error object
   */
  determineErrorType(error) {
    if (error.name === 'QuotaExceededError') return ERROR_TYPES.QUOTA;
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return ERROR_TYPES.NETWORK;
    }
    if (error.message?.includes('permission') || error.message?.includes('denied')) {
      return ERROR_TYPES.PERMISSION;
    }
    if (error.message?.includes('timeout')) return ERROR_TYPES.TIMEOUT;
    if (error.message?.includes('parse') || error.message?.includes('JSON')) {
      return ERROR_TYPES.PARSE;
    }
    if (error.message?.includes('storage') || error.name === 'StorageError') {
      return ERROR_TYPES.STORAGE;
    }
    return ERROR_TYPES.RUNTIME;
  }

  /**
   * Log error
   */
  logError(error) {
    this.errorLog.push(error);
    
    // Keep only last 1000 errors
    if (this.errorLog.length > 1000) {
      this.errorLog.shift();
    }
    
    // Log to console with appropriate level
    switch (error.severity) {
      case ERROR_SEVERITY.CRITICAL:
        console.error('CRITICAL ERROR:', error);
        break;
      case ERROR_SEVERITY.HIGH:
        console.error('HIGH SEVERITY ERROR:', error);
        break;
      case ERROR_SEVERITY.MEDIUM:
        console.warn('MEDIUM SEVERITY ERROR:', error);
        break;
      default:
        console.log('LOW SEVERITY ERROR:', error);
    }
  }

  /**
   * Log recovery attempt
   */
  logRecovery(error, success, recoveryError = null) {
    const recoveryLog = {
      originalError: error,
      success,
      recoveryError,
      timestamp: Date.now(),
    };
    
    if (success) {
      console.info('Error recovery successful:', recoveryLog);
    } else {
      console.error('Error recovery failed:', recoveryLog);
    }
  }

  /**
   * Execute operation with exponential backoff
   */
  async executeWithBackoff(operation, retryCount = 0) {
    if (retryCount >= this.maxRetries) {
      throw new Error(`Max retries (${this.maxRetries}) exceeded`);
    }
    
    try {
      return await operation();
    } catch (error) {
      const delay = Math.min(this.baseDelay * Math.pow(2, retryCount), this.maxDelay);
      await this.delay(delay + Math.random() * 0.1 * delay);
      return this.executeWithBackoff(operation, retryCount + 1);
    }
  }

  /**
   * Queue operation for retry
   */
  queueForRetry(context) {
    const queueKey = context.queueKey || 'default';
    
    if (!this.retryQueues.has(queueKey)) {
      this.retryQueues.set(queueKey, []);
    }
    
    this.retryQueues.get(queueKey).push({
      ...context,
      timestamp: Date.now(),
    });
    
    // Setup retry when online
    if (!this.onlineListener) {
      this.onlineListener = () => this.processRetryQueues();
      window.addEventListener('online', this.onlineListener);
    }
    
    return {
      queued: true,
      queueKey,
      queueLength: this.retryQueues.get(queueKey).length,
    };
  }

  /**
   * Process retry queues when back online
   */
  async processRetryQueues() {
    for (const [queueKey, queue] of this.retryQueues.entries()) {
      while (queue.length > 0) {
        const context = queue.shift();
        try {
          await context.operation();
        } catch (error) {
          console.error('Retry failed:', error);
        }
      }
    }
  }

  /**
   * Add recovery strategy
   */
  addRecoveryStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy);
  }

  /**
   * Graceful degradation fallback
   */
  gracefulDegradation(error) {
    const fallbacks = {
      [ERROR_TYPES.NETWORK]: () => {
        return { offline: true, cached: true };
      },
      [ERROR_TYPES.STORAGE]: () => {
        return { memory: true, temporary: true };
      },
      [ERROR_TYPES.PERMISSION]: () => {
        return { limited: true, readOnly: true };
      },
      [ERROR_TYPES.QUOTA]: () => {
        return { reduced: true, minimal: true };
      },
    };
    
    const fallback = fallbacks[error.type];
    if (fallback) {
      console.warn('Applying graceful degradation for', error.type);
      return fallback();
    }
    
    throw error;
  }

  /**
   * Cleanup storage to free space
   */
  async cleanupStorage() {
    try {
      // Clear old caches
      const keys = Object.keys(localStorage);
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      for (const key of keys) {
        if (key.includes('cache') || key.includes('temp')) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const data = JSON.parse(item);
              if (data._meta?.savedAt && new Date(data._meta.savedAt) < cutoff) {
                localStorage.removeItem(key);
              }
            } catch {
              // Remove invalid items
              localStorage.removeItem(key);
            }
          }
        }
      }
      
      // Clear error log if too large
      if (this.errorLog.length > 100) {
        this.errorLog = this.errorLog.slice(-50);
      }
    } catch (error) {
      console.error('Storage cleanup failed:', error);
    }
  }

  /**
   * Free up quota space
   */
  async freeUpQuotaSpace() {
    try {
      // Clear activity cache first
      localStorage.removeItem(STORAGE_KEYS_ENUM.ACTIVITY_CACHE);
      
      // Clear notes cache
      localStorage.removeItem(STORAGE_KEYS_ENUM.NOTES_CACHE);
      
      // Clear old error logs
      await this.cleanupStorage();
    } catch (error) {
      console.error('Quota cleanup failed:', error);
    }
  }

  /**
   * Repair corrupted data
   */
  async repairData(data, dataType) {
    try {
      switch (dataType) {
        case 'notes':
          return this.repairNotesData(data);
        case 'tags':
          return this.repairTagsData(data);
        case 'gamification':
          return this.repairGamificationData(data);
        case 'reminders':
          return this.repairRemindersData(data);
        default:
          return data;
      }
    } catch (error) {
      console.error('Data repair failed:', error);
      return null;
    }
  }

  /**
   * Repair notes data
   */
  repairNotesData(data) {
    if (!Array.isArray(data)) return [];
    
    return data.filter(note => {
      if (!note || typeof note !== 'object') return false;
      return note.title || note.content;
    }).map(note => ({
      ...note,
      title: note.title || 'Untitled Note',
      content: note.content || '',
      tags: Array.isArray(note.tags) ? note.tags : [],
      tasks: Array.isArray(note.tasks) ? note.tasks : [],
      status: note.status || 'todo',
      isArchived: Boolean(note.isArchived),
      isImportant: Boolean(note.isImportant),
      isDeleted: false,
    }));
  }

  /**
   * Repair tags data
   */
  repairTagsData(data) {
    if (!Array.isArray(data)) return [];
    
    return data.filter(tag => {
      if (!tag || typeof tag !== 'object') return false;
      return tag.name && typeof tag.name === 'string';
    }).map(tag => ({
      ...tag,
      name: tag.name.trim(),
      color: tag.color || '#007AFF',
      count: Math.max(0, Number(tag.count) || 0),
    }));
  }

  /**
   * Repair gamification data
   */
  repairGamificationData(data) {
    if (typeof data !== 'object') return {};
    
    return {
      points: Math.max(0, Number(data.points) || 0),
      level: Math.max(1, Number(data.level) || 1),
      xp: Math.max(0, Number(data.xp) || 0),
      badges: Array.isArray(data.badges) ? data.badges.filter(Boolean) : [],
      currentStreak: Math.max(0, Number(data.currentStreak) || 0),
      bestStreak: Math.max(0, Number(data.bestStreak) || 0),
      specialStreaks: {
        taskStreak: Math.max(0, Number(data.specialStreaks?.taskStreak) || 0),
        kanbanStreak: Math.max(0, Number(data.specialStreaks?.kanbanStreak) || 0),
      },
      stats: typeof data.stats === 'object' ? data.stats : {},
      lastActivityDate: data.lastActivityDate || null,
    };
  }

  /**
   * Repair reminders data
   */
  repairRemindersData(data) {
    if (!Array.isArray(data)) return [];
    
    return data.filter(reminder => {
      if (!reminder || typeof reminder !== 'object') return false;
      return reminder.reminderTime && reminder.noteId;
    }).map(reminder => ({
      ...reminder,
      reminderTime: reminder.reminderTime,
      noteId: reminder.noteId,
      status: reminder.status || 'pending',
    }));
  }

  /**
   * Circuit breaker pattern
   */
  createCircuitBreaker(name, options = {}) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000,
      monitoringPeriod = 10000,
    } = options;
    
    const breaker = {
      name,
      state: CIRCUIT_STATES.CLOSED,
      failureCount: 0,
      lastFailureTime: null,
      successCount: 0,
      
      async execute(operation) {
        if (breaker.state === CIRCUIT_STATES.OPEN) {
          if (Date.now() - breaker.lastFailureTime > resetTimeout) {
            breaker.state = CIRCUIT_STATES.HALF_OPEN;
            breaker.successCount = 0;
          } else {
            throw new Error(`Circuit breaker ${name} is OPEN`);
          }
        }
        
        try {
          const result = await operation();
          breaker.onSuccess();
          return result;
        } catch (error) {
          breaker.onFailure();
          throw error;
        }
      },
      
      onSuccess() {
        breaker.failureCount = 0;
        
        if (breaker.state === CIRCUIT_STATES.HALF_OPEN) {
          breaker.successCount++;
          if (breaker.successCount >= 3) {
            breaker.state = CIRCUIT_STATES.CLOSED;
          }
        }
      },
      
      onFailure() {
        breaker.failureCount++;
        breaker.lastFailureTime = Date.now();
        
        if (breaker.failureCount >= failureThreshold) {
          breaker.state = CIRCUIT_STATES.OPEN;
        }
      },
    };
    
    this.circuitBreakers.set(name, breaker);
    return breaker;
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    const status = {};
    for (const [name, breaker] of this.circuitBreakers.entries()) {
      status[name] = {
        state: breaker.state,
        failureCount: breaker.failureCount,
        lastFailureTime: breaker.lastFailureTime,
      };
    }
    return status;
  }

  /**
   * Create safe API wrapper
   */
  createSafeAPI(apiFunction, options = {}) {
    const {
      retries = 3,
      timeout = 10000,
      circuitBreaker = null,
      fallback = null,
      onError = null,
    } = options;
    
    return async (...args) => {
      let lastError;
      
      const operation = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const result = await apiFunction(...args, { signal: controller.signal });
          clearTimeout(timeoutId);
          return result;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };
      
      // Use circuit breaker if provided
      if (circuitBreaker) {
        try {
          return await circuitBreaker.execute(operation);
        } catch (error) {
          lastError = error;
          if (onError) onError(error);
          return fallback ? fallback() : null;
        }
      }
      
      // Regular retry logic
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          
          if (attempt < retries) {
            await this.delay(Math.pow(2, attempt) * 1000);
          }
        }
      }
      
      if (onError) onError(lastError);
      return fallback ? fallback() : null;
    };
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      bySeverity: {},
      recent: this.errorLog.slice(-10),
    };
    
    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
export const errorRecovery = new ErrorRecoveryManager();

/**
 * Safe storage wrapper with error recovery
 */
export class SafeStorage {
  constructor(storage = localStorage) {
    this.storage = storage;
  }
  
  async getItem(key) {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      await errorRecovery.handleError({
        type: ERROR_TYPES.STORAGE,
        message: `Failed to get item ${key}`,
        originalError: error,
        context: { operation: () => this.getItem(key) },
      });
      return null;
    }
  }
  
  async setItem(key, value) {
    try {
      return this.storage.setItem(key, value);
    } catch (error) {
      await errorRecovery.handleError({
        type: ERROR_TYPES.STORAGE,
        message: `Failed to set item ${key}`,
        originalError: error,
        context: { 
          operation: () => this.setItem(key, value),
          data: value,
          dataType: 'storage',
        },
      });
      return false;
    }
  }
  
  async removeItem(key) {
    try {
      return this.storage.removeItem(key);
    } catch (error) {
      await errorRecovery.handleError({
        type: ERROR_TYPES.STORAGE,
        message: `Failed to remove item ${key}`,
        originalError: error,
        context: { operation: () => this.removeItem(key) },
      });
      return false;
    }
  }
  
  async clear() {
    try {
      return this.storage.clear();
    } catch (error) {
      await errorRecovery.handleError({
        type: ERROR_TYPES.STORAGE,
        message: 'Failed to clear storage',
        originalError: error,
        context: { operation: () => this.clear() },
      });
      return false;
    }
  }
}

export const safeStorage = new SafeStorage();

/**
 * Wrapper for API calls with automatic retry and circuit breaker
 */
export function withErrorRecovery(apiFunction, options = {}) {
  return errorRecovery.createSafeAPI(apiFunction, options);
}

/**
 * Handle specific error types
 */
export function handleNetworkError(error, context) {
  return errorRecovery.handleError({
    type: ERROR_TYPES.NETWORK,
    message: error.message,
    originalError: error,
    context,
  });
}

export function handleValidationError(error, data, dataType) {
  return errorRecovery.handleError({
    type: ERROR_TYPES.VALIDATION,
    message: error.message,
    originalError: error,
    context: { data, dataType },
  });
}

export function handleStorageError(error, operation, data = null) {
  return errorRecovery.handleError({
    type: ERROR_TYPES.STORAGE,
    message: error.message,
    originalError: error,
    context: { operation, data },
  });
}