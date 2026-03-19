/**
 * Edge cases utilities
 * Handles all edge cases, boundary conditions, and special scenarios
 */

/**
 * Zero state handlers
 */
export const ZeroStateHandler = {
  /**
   * Handle empty arrays with default values
   */
  handleEmptyArray(array, defaultValue = []) {
    if (!Array.isArray(array) || array.length === 0) {
      return defaultValue;
    }
    return array;
  },

  /**
   * Handle empty objects with default values
   */
  handleEmptyObject(obj, defaultValue = {}) {
    if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) {
      return defaultValue;
    }
    return obj;
  },

  /**
   * Handle empty strings with default values
   */
  handleEmptyString(str, defaultValue = '') {
    if (!str || typeof str !== 'string' || str.trim() === '') {
      return defaultValue;
    }
    return str.trim();
  },

  /**
   * Handle zero numbers with default values
   */
  handleZeroNumber(num, defaultValue = 0) {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
      return defaultValue;
    }
    return num;
  },

  /**
   * Handle null/undefined with default values
   */
  handleNullUndefined(value, defaultValue = null) {
    return value != null ? value : defaultValue;
  },

  /**
   * Handle zero time/date
   */
  handleZeroTime(date, defaultValue = new Date()) {
    if (!date || isNaN(new Date(date).getTime())) {
      return defaultValue;
    }
    return new Date(date);
  },
};

/**
 * Large number handlers
 */
export const LargeNumberHandler = {
  /**
   * Format large numbers with abbreviations
   */
  formatLargeNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    
    if (num >= 1000000000000) {
      return (num / 1000000000000).toFixed(1) + 'T';
    } else if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  },

  /**
   * Handle very large array pagination
   */
  paginateLargeArray(array, pageSize = 100, page = 0) {
    if (!Array.isArray(array)) {
      return { items: [], hasMore: false, totalPages: 0 };
    }
    
    const totalPages = Math.ceil(array.length / pageSize);
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, array.length);
    
    return {
      items: array.slice(startIndex, endIndex),
      hasMore: endIndex < array.length,
      totalPages,
      currentPage: page,
      totalItems: array.length,
    };
  },

  /**
   * Chunk large array for processing
   */
  chunkLargeArray(array, chunkSize = 1000) {
    if (!Array.isArray(array)) return [];
    
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  },

  /**
   * Handle large string display
   */
  truncateLargeString(str, maxLength = 100, suffix = '...') {
    if (typeof str !== 'string') return '';
    
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
  },

  /**
   * Process large datasets in batches
   */
  async processLargeDataset(data, processor, batchSize = 100) {
    if (!Array.isArray(data)) return [];
    
    const results = [];
    const chunks = this.chunkLargeArray(data, batchSize);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkResults = await Promise.all(
        chunk.map(item => processor(item))
      );
      results.push(...chunkResults);
      
      // Yield control to prevent blocking
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return results;
  },
};

/**
 * Date/time handlers
 */
export const DateTimeHandler = {
  /**
   * Handle past dates
   */
  handlePastDate(date, options = {}) {
    const {
      allowNegative = false,
      defaultValue = new Date(),
      roundToNearest = 'day',
    } = options;
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return defaultValue;
    }
    
    const now = new Date();
    
    if (parsedDate > now) {
      return parsedDate; // Future date, return as-is
    }
    
    if (!allowNegative) {
      // For past dates, round up to nearest future time
      switch (roundToNearest) {
        case 'hour':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
        case 'day':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        case 'week':
          const nextWeek = new Date(now);
          nextWeek.setDate(now.getDate() + 7 - now.getDay());
          return new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 0, 0, 0);
        default:
          return defaultValue;
      }
    }
    
    return parsedDate;
  },

  /**
   * Handle far future dates
   */
  handleFarFutureDate(date, options = {}) {
    const {
      maxYears = 10,
      defaultValue = new Date(),
      clampToMax = false,
    } = options;
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return defaultValue;
    }
    
    const now = new Date();
    const maxDate = new Date(now.getFullYear() + maxYears, now.getMonth(), now.getDate());
    
    if (parsedDate > maxDate) {
      if (clampToMax) {
        return maxDate;
      }
      // Warn about far future date
      console.warn('Far future date detected:', parsedDate);
    }
    
    return parsedDate;
  },

  /**
   * Get relative time for dates
   */
  getRelativeTime(date, options = {}) {
    const { showAbsolute = true, maxDays = 30 } = options;
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return showAbsolute ? 'Invalid date' : '';
    }
    
    const now = new Date();
    const diffMs = now - parsedDate;
    const diffDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    
    // If too far in past/future, show absolute date
    if (diffDays > maxDays) {
      return showAbsolute ? parsedDate.toLocaleDateString() : '';
    }
    
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffWeeks = Math.round(diffDays / 7);
    const diffMonths = Math.round(diffDays / 30);
    const diffYears = Math.round(diffDays / 365);
    
    if (Math.abs(diffSeconds) < 60) {
      return rtf.format(-diffSeconds, 'second');
    } else if (Math.abs(diffMinutes) < 60) {
      return rtf.format(-diffMinutes, 'minute');
    } else if (Math.abs(diffHours) < 24) {
      return rtf.format(-diffHours, 'hour');
    } else if (Math.abs(diffDays) < 7) {
      return rtf.format(-diffDays, 'day');
    } else if (Math.abs(diffWeeks) < 4) {
      return rtf.format(-diffWeeks, 'week');
    } else if (Math.abs(diffMonths) < 12) {
      return rtf.format(-diffMonths, 'month');
    } else {
      return rtf.format(-diffYears, 'year');
    }
  },

  /**
   * Validate and normalize date range
   */
  validateDateRange(startDate, endDate, options = {}) {
    const { allowEqual = true, minDuration = 0 } = options;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { valid: false, error: 'Invalid date format' };
    }
    
    if (start > end) {
      return { valid: false, error: 'Start date must be before end date' };
    }
    
    if (!allowEqual && start.getTime() === end.getTime()) {
      return { valid: false, error: 'Start and end dates cannot be the same' };
    }
    
    const duration = end - start;
    if (duration < minDuration) {
      return { valid: false, error: 'Date range too short' };
    }
    
    return {
      valid: true,
      normalized: { start, end, duration },
    };
  },
};

/**
 * Unicode and special character handlers
 */
export const UnicodeHandler = {
  /**
   * Handle Unicode in strings
   */
  handleUnicode(str, options = {}) {
    const { normalize = true, removeControlChars = true, maxCodePoint = 0x10FFFF } = options;
    
    if (typeof str !== 'string') return '';
    
    let result = str;
    
    if (normalize) {
      result = result.normalize('NFC');
    }
    
    if (removeControlChars) {
      result = result.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    }
    
    // Filter out invalid code points
    result = Array.from(result)
      .filter(char => char.codePointAt(0) <= maxCodePoint)
      .join('');
    
    return result;
  },

  /**
   * Handle emojis in text
   */
  handleEmojis(str, options = {}) {
    const { allow = true, maxCount = 10, replaceWith = '' } = options;
    
    if (typeof str !== 'string') return str;
    
    if (allow) {
      // Limit emoji count
      const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
      const matches = str.match(emojiRegex) || [];
      
      if (matches.length > maxCount) {
        let emojiCount = 0;
        return str.replace(emojiRegex, (match) => {
          if (emojiCount < maxCount) {
            emojiCount++;
            return match;
          }
          return replaceWith;
        });
      }
    } else {
      // Remove all emojis
      const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
      return str.replace(emojiRegex, replaceWith);
    }
    
    return str;
  },

  /**
   * Handle bidirectional text
   */
  handleBidiText(str, options = {}) {
    const { detectDirection = true, addMarkers = true } = options;
    
    if (typeof str !== 'string') return str;
    
    let result = str;
    
    if (detectDirection) {
      // Simple RTL detection
      const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
      const hasRTL = rtlRegex.test(str);
      
      if (hasRTL && addMarkers) {
        result = `\u200E${result}\u200E`; // Add LRM markers
      }
    }
    
    return result;
  },

  /**
   * Sanitize text for safe display
   */
  sanitizeText(text, options = {}) {
    const {
      allowHTML = false,
      maxLength = 10000,
      preserveWhitespace = false,
    } = options;
    
    if (typeof text !== 'string') return '';
    
    let result = text;
    
    // Handle Unicode
    result = this.handleUnicode(result, {
      normalize: true,
      removeControlChars: true,
    });
    
    // Handle emojis
    result = this.handleEmojis(result, {
      allow: true,
      maxCount: 50,
    });
    
    // Limit length
    if (result.length > maxLength) {
      result = result.substring(0, maxLength - 3) + '...';
    }
    
    // Handle HTML
    if (!allowHTML) {
      result = result
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }
    
    // Handle whitespace
    if (!preserveWhitespace) {
      result = result.replace(/\s+/g, ' ').trim();
    }
    
    return result;
  },
};

/**
 * Input validation handlers
 */
export const InputValidationHandler = {
  /**
   * Validate email with edge cases
   */
  validateEmail(email, options = {}) {
    const { allowEmpty = false, maxLength = 254 } = options;
    
    if (allowEmpty && !email) return true;
    
    if (typeof email !== 'string') return false;
    
    if (email.length > maxLength) return false;
    
    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    return emailRegex.test(email);
  },

  /**
   * Validate URL with edge cases
   */
  validateURL(url, options = {}) {
    const { allowEmpty = false, allowRelative = false, protocols = ['http:', 'https:'] } = options;
    
    if (allowEmpty && !url) return true;
    
    if (typeof url !== 'string') return false;
    
    try {
      const parsedUrl = new URL(url, allowRelative ? window.location.href : undefined);
      
      if (!allowRelative && !parsedUrl.protocol) return false;
      
      if (protocols.length > 0 && !protocols.includes(parsedUrl.protocol)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate phone number with edge cases
   */
  validatePhone(phone, options = {}) {
    const { allowEmpty = false, country = 'US', allowInternational = true } = options;
    
    if (allowEmpty && !phone) return true;
    
    if (typeof phone !== 'string') return false;
    
    // Remove all non-numeric characters
    const numericOnly = phone.replace(/\D/g, '');
    
    if (country === 'US') {
      // US phone number validation
      if (allowInternational && numericOnly.length > 0 && numericOnly.length !== 10) {
        // Try with country code
        if (numericOnly.length === 11 && numericOnly.startsWith('1')) {
          return true;
        }
        return false;
      }
      
      return numericOnly.length === 10;
    }
    
    // Generic international validation
    return numericOnly.length >= 7 && numericOnly.length <= 15;
  },

  /**
   * Validate numeric input with edge cases
   */
  validateNumber(value, options = {}) {
    const {
      allowEmpty = false,
      min = Number.NEGATIVE_INFINITY,
      max = Number.POSITIVE_INFINITY,
      integer = false,
      allowNegative = true,
      allowZero = true,
    } = options;
    
    if (allowEmpty && (value === '' || value === null || value === undefined)) {
      return true;
    }
    
    const num = Number(value);
    
    if (isNaN(num) || !isFinite(num)) return false;
    
    if (!allowNegative && num < 0) return false;
    
    if (!allowZero && num === 0) return false;
    
    if (integer && !Number.isInteger(num)) return false;
    
    if (num < min || num > max) return false;
    
    return true;
  },

  /**
   * Validate file input with edge cases
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = [],
      allowEmpty = false,
    } = options;
    
    if (allowEmpty && !file) return true;
    
    if (!(file instanceof File)) return false;
    
    if (file.size > maxSize) return false;
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return false;
    }
    
    return true;
  },
};

/**
 * Network timeout handlers
 */
export const NetworkTimeoutHandler = {
  /**
   * Create timeout wrapper for async operations
   */
  withTimeout(promise, timeoutMs, errorMessage = 'Operation timed out') {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
      }),
    ]);
  },

  /**
   * Create retry wrapper with exponential backoff
   */
  withRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      factor = 2,
      jitter = true,
    } = options;
    
    return async (...args) => {
      let lastError;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn(...args);
        } catch (error) {
          lastError = error;
          
          if (attempt === maxRetries) break;
          
          const delay = Math.min(
            baseDelay * Math.pow(factor, attempt),
            maxDelay
          );
          
          const finalDelay = jitter
            ? delay + Math.random() * 0.1 * delay
            : delay;
          
          await new Promise(resolve => setTimeout(resolve, finalDelay));
        }
      }
      
      throw lastError;
    };
  },

  /**
   * Create debounced wrapper
   */
  debounce(fn, delayMs) {
    let timeoutId;
    
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delayMs);
    };
  },

  /**
   * Create throttled wrapper
   */
  throttle(fn, intervalMs) {
    let lastCallTime = 0;
    
    return (...args) => {
      const now = Date.now();
      
      if (now - lastCallTime >= intervalMs) {
        lastCallTime = now;
        return fn(...args);
      }
    };
  },
};

/**
 * Component state edge case handlers
 */
export const ComponentStateHandler = {
  /**
   * Handle loading state edge cases
   */
  handleLoadingState(isLoading, hasError, hasData) {
    if (isLoading && hasError) {
      // Priority: show error over loading
      return { showLoading: false, showError: true, showData: false };
    }
    
    if (isLoading && hasData) {
      // Show loading but keep data visible
      return { showLoading: true, showError: false, showData: true };
    }
    
    return {
      showLoading: isLoading,
      showError: hasError,
      showData: hasData,
    };
  },

  /**
   * Handle list state edge cases
   */
  handleListState(items, loading, error) {
    const hasItems = Array.isArray(items) && items.length > 0;
    
    return {
      isEmpty: !hasItems && !loading && !error,
      isLoading: loading,
      hasError: !!error,
      hasItems,
      itemCount: items?.length || 0,
    };
  },

  /**
   * Handle form state edge cases
   */
  handleFormState(formData, errors, touched, isSubmitting) {
    const hasErrors = Object.values(errors).some(error => error);
    const hasTouchedErrors = Object.entries(touched)
      .some(([field, isTouched]) => isTouched && errors[field]);
    
    return {
      isValid: !hasErrors,
      isDirty: Object.values(touched).some(t => t),
      hasErrors,
      hasTouchedErrors,
      isSubmitting,
      canSubmit: !hasErrors && !isSubmitting,
    };
  },
};

/**
 * Export all handlers
 */
export const EdgeCaseHandlers = {
  ZeroState: ZeroStateHandler,
  LargeNumber: LargeNumberHandler,
  DateTime: DateTimeHandler,
  Unicode: UnicodeHandler,
  InputValidation: InputValidationHandler,
  NetworkTimeout: NetworkTimeoutHandler,
  ComponentState: ComponentStateHandler,
};

/**
 * Generic edge case handler wrapper
 */
export function handleEdgeCases(data, handlers = {}) {
  const result = { ...data };
  
  Object.entries(handlers).forEach(([key, handler]) => {
    if (typeof handler === 'function') {
      result[key] = handler(result[key]);
    } else if (typeof handler === 'object' && handler.handler) {
      result[key] = handler.handler(result[key], handler.options);
    }
  });
  
  return result;
}