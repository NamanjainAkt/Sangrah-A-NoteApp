/**
 * Touch utilities
 * Enhanced touch interactions and mobile experience
 */

/**
 * Touch gesture detector
 */
export class TouchGestureDetector {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      swipeThreshold: 50,
      swipeVelocity: 0.3,
      tapThreshold: 200,
      longPressThreshold: 500,
      doubleTapThreshold: 300,
      pinchThreshold: 20,
      ...options,
    };
    
    this.touches = new Map();
    this.gestureState = {
      isTracking: false,
      startTime: 0,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      pinchDistance: 0,
      tapCount: 0,
      lastTapTime: 0,
    };
    
    this.callbacks = {
      onTap: null,
      onDoubleTap: null,
      onLongPress: null,
      onSwipe: null,
      onPinch: null,
      onPan: null,
      onTouchStart: null,
      onTouchMove: null,
      onTouchEnd: null,
    };
    
    this.setupEventListeners();
  }

  /**
   * Setup touch event listeners
   */
  setupEventListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
  }

  /**
   * Handle touch start
   */
  handleTouchStart(event) {
    event.preventDefault();
    
    const now = Date.now();
    const touch = event.touches[0];
    
    // Update gesture state
    this.gestureState.isTracking = true;
    this.gestureState.startTime = now;
    this.gestureState.startX = touch.clientX;
    this.gestureState.startY = touch.clientY;
    this.gestureState.lastX = touch.clientX;
    this.gestureState.lastY = touch.clientY;
    
    // Store touch points
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      this.touches.set(touch.identifier, {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
      });
    }
    
    // Check for double tap
    if (now - this.gestureState.lastTapTime < this.options.doubleTapThreshold) {
      this.gestureState.tapCount++;
      if (this.gestureState.tapCount === 2) {
        this.triggerCallback('onDoubleTap', { x: touch.clientX, y: touch.clientY });
        this.gestureState.tapCount = 0;
      }
    } else {
      this.gestureState.tapCount = 1;
      this.gestureState.lastTapTime = now;
    }
    
    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      if (this.gestureState.isTracking) {
        this.triggerCallback('onLongPress', { x: touch.clientX, y: touch.clientY });
      }
    }, this.options.longPressThreshold);
    
    this.triggerCallback('onTouchStart', {
      touches: Array.from(event.touches),
      gestureState: { ...this.gestureState },
    });
  }

  /**
   * Handle touch move
   */
  handleTouchMove(event) {
    event.preventDefault();
    
    if (!this.gestureState.isTracking) return;
    
    const now = Date.now();
    const touch = event.touches[0];
    
    // Update touch positions
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const touchData = this.touches.get(touch.identifier);
      if (touchData) {
        touchData.currentX = touch.clientX;
        touchData.currentY = touch.clientY;
      }
    }
    
    // Cancel long press if moved too much
    const moveThreshold = 10;
    const deltaX = Math.abs(touch.clientX - this.gestureState.startX);
    const deltaY = Math.abs(touch.clientY - this.gestureState.startY);
    
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      clearTimeout(this.longPressTimer);
    }
    
    // Handle different gestures based on number of touches
    if (event.touches.length === 1) {
      // Single touch - pan/swipe
      const deltaX = touch.clientX - this.gestureState.lastX;
      const deltaY = touch.clientY - this.gestureState.lastY;
      
      this.triggerCallback('onPan', {
        deltaX,
        deltaY,
        x: touch.clientX,
        y: touch.clientY,
      });
      
      this.gestureState.lastX = touch.clientX;
      this.gestureState.lastY = touch.clientY;
    } else if (event.touches.length === 2) {
      // Two touches - pinch
      const touch1 = this.touches.get(event.touches[0].identifier);
      const touch2 = this.touches.get(event.touches[1].identifier);
      
      if (touch1 && touch2) {
        const currentDistance = Math.hypot(
          touch2.currentX - touch1.currentX,
          touch2.currentY - touch1.currentY
        );
        
        if (this.gestureState.pinchDistance > 0) {
          const scale = currentDistance / this.gestureState.pinchDistance;
          this.triggerCallback('onPinch', { scale, centerX: (touch1.currentX + touch2.currentX) / 2 });
        }
        
        this.gestureState.pinchDistance = currentDistance;
      }
    }
    
    this.triggerCallback('onTouchMove', {
      touches: Array.from(event.touches),
      gestureState: { ...this.gestureState },
    });
  }

  /**
   * Handle touch end
   */
  handleTouchEnd(event) {
    event.preventDefault();
    
    clearTimeout(this.longPressTimer);
    
    if (!this.gestureState.isTracking) return;
    
    const now = Date.now();
    const duration = now - this.gestureState.startTime;
    
    // Check for tap
    if (duration < this.options.tapThreshold && event.touches.length === 0) {
      const touch = this.gestureState;
      this.triggerCallback('onTap', { x: touch.startX, y: touch.startY });
    }
    
    // Check for swipe
    if (event.touches.length === 0) {
      const deltaX = this.gestureState.lastX - this.gestureState.startX;
      const deltaY = this.gestureState.lastY - this.gestureState.startY;
      const distance = Math.hypot(deltaX, deltaY);
      const velocity = distance / duration;
      
      if (distance > this.options.swipeThreshold && velocity > this.options.swipeVelocity) {
        let direction;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }
        
        this.triggerCallback('onSwipe', {
          direction,
          deltaX,
          deltaY,
          velocity,
          distance,
        });
      }
    }
    
    // Clean up
    this.touches.clear();
    this.gestureState.isTracking = false;
    this.gestureState.pinchDistance = 0;
    
    this.triggerCallback('onTouchEnd', {
      touches: Array.from(event.touches),
      gestureState: { ...this.gestureState },
    });
  }

  /**
   * Handle touch cancel
   */
  handleTouchCancel(event) {
    event.preventDefault();
    
    clearTimeout(this.longPressTimer);
    this.touches.clear();
    this.gestureState.isTracking = false;
    this.gestureState.pinchDistance = 0;
    
    this.triggerCallback('onTouchEnd', {
      touches: [],
      gestureState: { ...this.gestureState },
      cancelled: true,
    });
  }

  /**
   * Register callback
   */
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = callback;
    }
  }

  /**
   * Remove callback
   */
  off(event) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = null;
    }
  }

  /**
   * Trigger callback
   */
  triggerCallback(event, data) {
    if (typeof this.callbacks[event] === 'function') {
      this.callbacks[event](data);
    }
  }

  /**
   * Destroy gesture detector
   */
  destroy() {
    clearTimeout(this.longPressTimer);
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    this.touches.clear();
  }
}

/**
 * Touch target validator
 */
export const TouchTargetValidator = {
  /**
   * Validate touch target size (minimum 44px)
   */
  validateTouchTarget(element, options = {}) {
    const { minSize = 44, warnOnly = false } = options;
    
    if (!(element instanceof HTMLElement)) {
      return { valid: false, message: 'Invalid element' };
    }
    
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const isValid = width >= minSize && height >= minSize;
    
    if (!isValid && !warnOnly) {
      console.warn(
        `Touch target too small: ${width}x${height}px (minimum ${minSize}x${minSize}px)`,
        element
      );
    }
    
    return {
      valid: isValid,
      width,
      height,
      minSize,
      element,
    };
  },

  /**
   * Find and validate all touch targets in container
   */
  validateAllTouchTargets(container, selector = 'button, a, input, [role="button"], [data-touchable]') {
    const targets = container.querySelectorAll(selector);
    const results = [];
    const invalidTargets = [];
    
    targets.forEach(target => {
      const validation = this.validateTouchTarget(target, { warnOnly: true });
      results.push(validation);
      
      if (!validation.valid) {
        invalidTargets.push(validation);
      }
    });
    
    return {
      total: targets.length,
      valid: results.filter(r => r.valid).length,
      invalid: invalidTargets,
      results,
    };
  },

  /**
   * Auto-fix touch target sizes
   */
  fixTouchTarget(element, options = {}) {
    const { minSize = 44, padding = 8 } = options;
    
    const validation = this.validateTouchTarget(element, { warnOnly: true });
    
    if (!validation.valid) {
      const computedStyle = window.getComputedStyle(element);
      const currentPadding = {
        top: parseInt(computedStyle.paddingTop) || 0,
        right: parseInt(computedStyle.paddingRight) || 0,
        bottom: parseInt(computedStyle.paddingBottom) || 0,
        left: parseInt(computedStyle.paddingLeft) || 0,
      };
      
      // Calculate required padding
      const requiredPadding = {
        top: Math.max(padding, minSize - validation.height + currentPadding.top),
        right: Math.max(padding, minSize - validation.width + currentPadding.right),
        bottom: Math.max(padding, minSize - validation.height + currentPadding.bottom),
        left: Math.max(padding, minSize - validation.width + currentPadding.left),
      };
      
      // Apply padding
      element.style.paddingTop = `${requiredPadding.top}px`;
      element.style.paddingRight = `${requiredPadding.right}px`;
      element.style.paddingBottom = `${requiredPadding.bottom}px`;
      element.style.paddingLeft = `${requiredPadding.left}px`;
      
      return { fixed: true, padding: requiredPadding };
    }
    
    return { fixed: false };
  },
};

/**
 * Haptic feedback utilities
 */
export const HapticFeedback = {
  /**
   * Check if haptic feedback is supported
   */
  isSupported() {
    return 'vibrate' in navigator;
  },

  /**
   * Light haptic feedback
   */
  light() {
    if (this.isSupported()) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium haptic feedback
   */
  medium() {
    if (this.isSupported()) {
      navigator.vibrate(25);
    }
  },

  /**
   * Heavy haptic feedback
   */
  heavy() {
    if (this.isSupported()) {
      navigator.vibrate(50);
    }
  },

  /**
   * Success haptic pattern
   */
  success() {
    if (this.isSupported()) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Error haptic pattern
   */
  error() {
    if (this.isSupported()) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  /**
   * Warning haptic pattern
   */
  warning() {
    if (this.isSupported()) {
      navigator.vibrate([50, 30, 50]);
    }
  },

  /**
   * Custom haptic pattern
   */
  pattern(pattern) {
    if (this.isSupported() && Array.isArray(pattern)) {
      navigator.vibrate(pattern);
    }
  },
};

/**
 * Touch-friendly scroll utilities
 */
export const TouchScroll = {
  /**
   * Enable momentum scrolling
   */
  enableMomentumScrolling(element) {
    element.style.webkitOverflowScrolling = 'touch';
    element.style.overflowY = 'auto';
    element.style.overflowX = 'hidden';
  },

  /**
   * Disable momentum scrolling
   */
  disableMomentumScrolling(element) {
    element.style.webkitOverflowScrolling = 'auto';
  },

  /**
   * Enable pull-to-refresh
   */
  enablePullToRefresh(element, callback, options = {}) {
    const { threshold = 80, resistance = 2.5 } = options;
    
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    
    const handleTouchStart = (e) => {
      if (element.scrollTop === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };
    
    const handleTouchMove = (e) => {
      if (!isPulling) return;
      
      currentY = e.touches[0].clientY;
      const deltaY = (currentY - startY) / resistance;
      
      if (deltaY > 0) {
        element.style.transform = `translateY(${deltaY}px)`;
        
        if (deltaY >= threshold) {
          element.classList.add('pull-to-refresh-ready');
        } else {
          element.classList.remove('pull-to-refresh-ready');
        }
      }
    };
    
    const handleTouchEnd = () => {
      if (!isPulling) return;
      
      isPulling = false;
      element.style.transform = '';
      element.classList.remove('pull-to-refresh-ready');
      
      if (currentY - startY >= threshold) {
        callback();
      }
    };
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  },

  /**
   * Enable horizontal swipe navigation
   */
  enableSwipeNavigation(element, callback, options = {}) {
    const { threshold = 100, resistance = 0.5 } = options;
    
    const gestureDetector = new TouchGestureDetector(element, {
      swipeThreshold: threshold,
    });
    
    gestureDetector.on('onSwipe', (data) => {
      callback(data.direction, data);
    });
    
    return gestureDetector;
  },
};

/**
 * Prevent accidental zoom
 */
export const ZoomPrevention = {
  /**
   * Prevent double-tap zoom on input focus
   */
  preventInputZoom() {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      input.addEventListener('touchstart', (e) => {
        e.preventDefault();
        input.focus();
      });
      
      // Prevent font size adjustment on focus
      input.addEventListener('focus', () => {
        input.style.fontSize = '16px';
      });
      
      input.addEventListener('blur', () => {
        input.style.fontSize = '';
      });
    });
  },

  /**
   * Prevent viewport zoom on touch
   */
  preventViewportZoom() {
    let lastTouchEnd = 0;
    
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      
      // Prevent zoom if touches were close together
      if (e.touches.length === 0) {
        if (now - lastTouchEnd < 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }
    }, { passive: false });
  },

  /**
   * Set viewport meta tag for mobile optimization
   */
  setViewportMeta() {
    let viewport = document.querySelector('meta[name="viewport"]');
    
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
  },
};

/**
 * Touch performance optimization
 */
export const TouchPerformance = {
  /**
   * Optimize touch event handling
   */
  optimizeTouchHandling() {
    // Enable passive listeners where possible
    const passiveOptions = { passive: true };
    
    // Replace event listeners with passive versions
    document.addEventListener('touchstart', () => {}, passiveOptions);
    document.addEventListener('touchmove', () => {}, passiveOptions);
    document.addEventListener('touchend', () => {}, passiveOptions);
  },

  /**
   * Enable touch-action CSS property
   */
  enableTouchAction(element, action = 'manipulation') {
    element.style.touchAction = action;
  },

  /**
   * Debounce touch events
   */
  debounceTouchEvents(callback, delay = 100) {
    let timeoutId;
    
    return (event) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(event), delay);
    };
  },

  /**
   * Throttle touch events
   */
  throttleTouchEvents(callback, interval = 16) {
    let lastCall = 0;
    
    return (event) => {
      const now = Date.now();
      
      if (now - lastCall >= interval) {
        lastCall = now;
        callback(event);
      }
    };
  },
};

/**
 * Initialize all touch utilities
 */
export function initializeTouchUtilities(options = {}) {
  const {
    preventZoom = true,
    optimizePerformance = true,
    validateTargets = false,
    enableHaptics = true,
  } = options;

  // Prevent zoom issues
  if (preventZoom) {
    ZoomPrevention.setViewportMeta();
    ZoomPrevention.preventInputZoom();
    ZoomPrevention.preventViewportZoom();
  }

  // Optimize performance
  if (optimizePerformance) {
    TouchPerformance.optimizeTouchHandling();
  }

  // Validate touch targets in development
  if (validateTargets && process.env.NODE_ENV === 'development') {
    const validation = TouchTargetValidator.validateAllTouchTargets(document.body);
    
    if (validation.invalid.length > 0) {
      console.warn('Found invalid touch targets:', validation.invalid);
    }
  }

  // Test haptic feedback
  if (enableHaptics && HapticFeedback.isSupported()) {
    console.log('Haptic feedback is available');
  }

  return {
    TouchGestureDetector,
    TouchTargetValidator,
    HapticFeedback,
    TouchScroll,
    ZoomPrevention,
    TouchPerformance,
  };
}

/**
 * Quick access exports
 */
export {
  TouchGestureDetector as GestureDetector,
  TouchTargetValidator as TargetValidator,
  HapticFeedback as Haptics,
  TouchScroll as Scroll,
  ZoomPrevention as NoZoom,
  TouchPerformance as Performance,
};