import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  selectAllNotifications, 
  selectUnreadCount, 
  selectPreferences, 
  selectNotificationsLoading,
  selectNotificationsError,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updatePreferences,
  addNotification 
} from '../store/notificationsSlice';
import notificationService, { 
  showNotification as showUnifiedNotification,
  requestNotificationPermission as requestUnifiedPermission,
  clearAllNotifications as clearUnifiedNotifications,
  getNotificationStatus 
} from '../services/notificationService';

/**
 * Custom hook for managing notifications
 * Provides comprehensive notification management with browser notifications and toast support
 */
const useNotifications = () => {
  const dispatch = useDispatch();
  const toastDisplayed = useRef(new Set());

  // Select state from Redux
  const notifications = useSelector(selectAllNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const preferences = useSelector(selectPreferences);
  const loading = useSelector(selectNotificationsLoading);
  const error = useSelector(selectNotificationsError);

  // Initialize notifications on mount
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await dispatch(fetchNotifications()).unwrap();
      } catch (err) {
        console.error('Error initializing notifications:', err);
      }
    };

    initNotifications();
  }, [dispatch]);

  // Show browser notification using unified service
  const showBrowserNotification = useCallback(async (notification) => {
    if (!preferences.enableBrowserNotifications) return;
    
    // Check if we've already shown this notification in this session
    const notificationKey = `${notification.id}-${notification.title}`;
    if (toastDisplayed.current.has(notificationKey)) return;
    
    try {
      await showUnifiedNotification({
        title: notification.title,
        body: notification.message,
        tag: notification.id,
        browser: true,
        toast: false,
        priority: notification.type === 'error' ? 'high' : 'normal',
      });

      toastDisplayed.current.add(notificationKey);
      
      // Clean up after 1 hour to allow showing again
      setTimeout(() => {
        toastDisplayed.current.delete(notificationKey);
      }, 3600000);
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }, [preferences.enableBrowserNotifications]);

  // Show toast notification using unified service
  const showToast = useCallback(async (notification, type = 'default') => {
    if (!preferences.enableToastNotifications) return;

    try {
      await showUnifiedNotification({
        title: notification.title || 'Notification',
        body: notification.message,
        toast: true,
        browser: false,
        priority: type === 'error' ? 'high' : 'normal',
        ttl: type === 'error' ? 10000 : 5000,
      });
    } catch (error) {
      // Fallback to react-toastify
      const toastOptions = {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      };

      switch (type) {
        case 'success':
          toast.success(notification.message, toastOptions);
          break;
        case 'error':
          toast.error(notification.message, toastOptions);
          break;
        case 'warning':
          toast.warn(notification.message, toastOptions);
          break;
        default:
          toast.info(notification.message, toastOptions);
      }
    }
  }, [preferences.enableToastNotifications]);

  // Add a new notification
  const addNewNotification = useCallback((notificationData) => {
    const notification = {
      ...notificationData,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };

    // Add to Redux store
    dispatch(addNotification(notification));

    // Show toast notification
    if (notification.type && preferences[`enable${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}Notifications`] !== false) {
      showToast(notification);
    }

    // Show browser notification
    showBrowserNotification(notification);

    return notification;
  }, [dispatch, preferences, showToast, showBrowserNotification]);

  // Mark notification as read
  const markAsReadNotification = useCallback(async (notificationId) => {
    try {
      await dispatch(markAsRead(notificationId)).unwrap();
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [dispatch]);

  // Mark all notifications as read
  const markAllAsReadNotifications = useCallback(async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [dispatch]);

  // Delete notification
  const deleteNotificationItem = useCallback(async (notificationId) => {
    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  }, [dispatch]);

  // Update notification preferences
  const updateNotificationPreferences = useCallback(async (newPreferences) => {
    try {
      await dispatch(updatePreferences(newPreferences)).unwrap();
      return true;
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      return false;
    }
  }, [dispatch]);

  // Clear all notifications using unified service
  const clearAllNotifications = useCallback(async () => {
    try {
      // Clear unified notifications
      clearUnifiedNotifications();
      
      // Delete all Redux notifications one by one
      const deletePromises = notifications.map(n => deleteNotificationItem(n.id));
      await Promise.all(deletePromises);
      return true;
    } catch (err) {
      console.error('Error clearing notifications:', err);
      return false;
    }
  }, [notifications, deleteNotificationItem]);

  // Request browser notification permission using unified service
  const requestBrowserPermission = useCallback(async () => {
    try {
      const permission = await requestUnifiedPermission();
      
      // Update preferences if permission was granted
      if (permission === 'granted') {
        await updateNotificationPreferences({ enableBrowserNotifications: true });
      }
      
      return permission;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }, [updateNotificationPreferences]);

  // Check if browser notifications are supported using unified service
  const isBrowserNotificationSupported = () => getNotificationStatus().permission !== 'unsupported';

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Get recent notifications (last 10)
  const getRecentNotifications = useCallback((limit = 10) => {
    return notifications.slice(0, limit);
  }, [notifications]);

  return {
    // State
    notifications,
    unreadCount,
    preferences,
    loading,
    error,
    isBrowserNotificationSupported: isBrowserNotificationSupported(),
    
    // Actions
    addNotification: addNewNotification,
    markAsRead: markAsReadNotification,
    markAllAsRead: markAllAsReadNotifications,
    deleteNotification: deleteNotificationItem,
    updatePreferences: updateNotificationPreferences,
    clearAll: clearAllNotifications,
    fetchNotifications: () => dispatch(fetchNotifications()),
    requestBrowserPermission,
    
    // Helpers
    showBrowserNotification,
    showToast,
    getNotificationsByType,
    getRecentNotifications,
    
    // Unified service methods
    getNotificationStatus: getNotificationStatus,
    clearUnifiedNotifications: clearUnifiedNotifications,
  };
};

export default useNotifications;