/**
 * Unified Notification Service
 * Centralizes all notification logic including browser notifications, toast notifications, and offline queue
 */

class NotificationService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.isOnline = navigator.onLine;
    this.permission = 'default';
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize notification permission
    this.initPermission();
  }

  setupEventListeners() {
    // Handle online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Handle visibility change for foreground/background
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.processQueue();
      }
    });
  }

  async initPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show notification with automatic fallbacks
   */
  async show(options = {}) {
    const {
      title,
      body,
      icon = '/favicon.ico',
      tag = null,
      requireInteraction = false,
      actions = [],
      toast = true,
      browser = true,
      priority = 'normal',
      ttl = 60000, // 1 minute default TTL
    } = options;

    const notification = {
      id: this.generateId(),
      title,
      body,
      icon,
      tag,
      requireInteraction,
      actions,
      toast,
      browser,
      priority,
      ttl,
      timestamp: Date.now(),
      retryCount: 0,
    };

    // Deduplicate existing notifications
    if (this.isDuplicate(notification)) {
      return null;
    }

    if (this.isOnline) {
      return this.showNotification(notification);
    } else {
      // Queue for offline
      this.queueNotification(notification);
      return this.showFallbackNotification(notification);
    }
  }

  async showNotification(notification) {
    const results = {
      browser: null,
      toast: null,
    };

    // Try browser notification first
    if (notification.browser && this.permission === 'granted') {
      results.browser = await this.showBrowserNotification(notification);
    }

    // Fallback to toast notification
    if (notification.toast && (!results.browser || !notification.browser)) {
      results.toast = await this.showToastNotification(notification);
    }

    return results;
  }

  async showBrowserNotification(notification) {
    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        tag: notification.tag,
        requireInteraction: notification.requireInteraction,
        data: {
          id: notification.id,
          priority: notification.priority,
        },
      });

      // Add click handler
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        this.onNotificationClick(notification);
      };

      // Auto-close after TTL
      if (notification.ttl > 0) {
        setTimeout(() => {
          if (browserNotification.close) {
            browserNotification.close();
          }
        }, notification.ttl);
      }

      return { success: true, id: notification.id };
    } catch (error) {
      console.error('Browser notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  async showToastNotification(notification) {
    // This would integrate with react-toastify or similar
    // For now, we'll create a simple toast implementation
    try {
      const toastElement = this.createToastElement(notification);
      document.body.appendChild(toastElement);
      
      // Auto-remove after TTL
      setTimeout(() => {
        this.removeToast(toastElement);
      }, notification.ttl);

      return { success: true, id: notification.id };
    } catch (error) {
      console.error('Toast notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  createToastElement(notification) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    toast.setAttribute('data-notification-id', notification.id);
    
    toast.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-1">
          <h4 class="font-semibold">${notification.title}</h4>
          ${notification.body ? `<p class="text-sm text-gray-300 mt-1">${notification.body}</p>` : ''}
        </div>
        <button class="text-gray-400 hover:text-white" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;

    return toast;
  }

  removeToast(toastElement) {
    if (toastElement && toastElement.parentNode) {
      toastElement.style.opacity = '0';
      toastElement.style.transform = 'translateX(100%)';
      setTimeout(() => {
        toastElement.parentNode?.removeChild(toastElement);
      }, 300);
    }
  }

  showFallbackNotification(notification) {
    // Show a simple fallback when offline
    const offlineToast = document.createElement('div');
    offlineToast.className = 'fixed bottom-4 left-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    offlineToast.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span>Notification queued: ${notification.title}</span>
      </div>
    `;
    
    document.body.appendChild(offlineToast);
    
    setTimeout(() => {
      this.removeToast(offlineToast);
    }, 3000);
  }

  queueNotification(notification) {
    // Add to queue with priority
    this.queue.push(notification);
    
    // Sort queue by priority (high first) and timestamp (newest first)
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.timestamp - a.timestamp;
    });

    // Limit queue size
    if (this.queue.length > 100) {
      this.queue = this.queue.slice(0, 100);
    }
  }

  async processQueue() {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const notificationsToProcess = [...this.queue];
      this.queue = [];

      for (const notification of notificationsToProcess) {
        try {
          await this.showNotification(notification);
          this.retryAttempts.delete(notification.id);
        } catch (error) {
          // Retry logic
          const retryCount = this.retryAttempts.get(notification.id) || 0;
          if (retryCount < this.maxRetries) {
            this.retryAttempts.set(notification.id, retryCount + 1);
            notification.retryCount = retryCount + 1;
            this.queueNotification(notification);
          } else {
            console.error(`Failed to show notification after ${this.maxRetries} attempts:`, notification);
          }
        }

        // Small delay between notifications
        await this.delay(100);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  isDuplicate(notification) {
    // Check for duplicate notifications with same title in last 30 seconds
    const recentNotifications = this.queue.filter(n => 
      n.title === notification.title && 
      Date.now() - n.timestamp < 30000
    );
    
    return recentNotifications.length > 0;
  }

  onNotificationClick(notification) {
    // Custom click handler - can be overridden
    console.log('Notification clicked:', notification);
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    // Clear queue
    this.queue = [];
    
    // Clear browser notifications
    if ('Notification' in window) {
      // Close all active notifications
      Notification.getNotifications().forEach(notification => {
        notification.close();
      });
    }

    // Clear toast notifications
    document.querySelectorAll('[data-notification-id]').forEach(toast => {
      this.removeToast(toast);
    });
  }

  /**
   * Get notification status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      permission: this.permission,
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      retryAttempts: this.retryAttempts.size,
    };
  }

  generateId() {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Schedule a notification for later
   */
  async schedule(options, delayMs) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const result = await this.show(options);
        resolve(result);
      }, delayMs);
    });
  }

  /**
   * Show persistent notification
   */
  async showPersistent(options) {
    return this.show({
      ...options,
      requireInteraction: true,
      browser: true,
      toast: false,
      ttl: 0, // No auto-close
    });
  }

  /**
   * Show progress notification
   */
  async showProgress(title, progress, options = {}) {
    return this.show({
      title,
      body: `${Math.round(progress)}% complete`,
      tag: `progress-${title}`,
      requireInteraction: true,
      ...options,
    });
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Export convenience methods
export const showNotification = (options) => notificationService.show(options);
export const requestNotificationPermission = () => notificationService.requestPermission();
export const clearAllNotifications = () => notificationService.clearAll();
export const getNotificationStatus = () => notificationService.getStatus();
export const scheduleNotification = (options, delayMs) => notificationService.schedule(options, delayMs);
export const showPersistentNotification = (options) => notificationService.showPersistent(options);
export const showProgressNotification = (title, progress, options) => notificationService.showProgress(title, progress, options);

export default notificationService;