import React, { memo, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  selectAllNotifications, 
  selectUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from '../../store/notificationsSlice';
import NotificationItem from './NotificationItem';

/**
 * NotificationCenter Component
 * Displays all notifications in a scrollable list with header and actions
 * Props:
 * - notifications: array - Notification list (uses store if not provided)
 * - unreadCount: number - Unread count (uses store if not provided)
 * - onMarkRead: function - Mark as read callback
 * - onDelete: function - Delete notification callback
 * - isOpen: boolean - Control visibility
 * - onClose: function - Close callback
 */
const NotificationCenter = memo(({
  notifications: propNotifications,
  unreadCount: propUnreadCount,
  onMarkRead: propOnMarkRead,
  onDelete: propOnDelete,
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const listRef = useRef(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Use store values if props not provided
  const storeNotifications = useSelector(selectAllNotifications);
  const storeUnreadCount = useSelector(selectUnreadCount);
  
  const notifications = propNotifications || storeNotifications;
  const unreadCount = propUnreadCount ?? storeUnreadCount;
  
  const handleMarkRead = propOnMarkRead || ((id) => dispatch(markAsRead(id)));
  const handleMarkAllRead = () => dispatch(markAllAsRead());
  const handleDelete = propOnDelete || ((id) => dispatch(deleteNotification(id)));

  // Debounced mark as read
  const debouncedMarkRead = useCallback(
    debounce((id) => handleMarkRead(id), 300),
    [handleMarkRead]
  );

  // Virtualization for large lists
  const virtualizedNotifications = useMemo(() => {
    if (notifications.length <= 50) {
      return notifications;
    }
    
    // Only show first 50 for performance
    return notifications.slice(0, 50);
  }, [notifications]);

  // Close on escape key and keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      // Ctrl/Cmd + K to focus search (future feature)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Focus search input when implemented
        return;
      }

      // Arrow key navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = e.key === 'ArrowDown' 
          ? Math.min(focusedIndex + 1, virtualizedNotifications.length - 1)
          : Math.max(focusedIndex - 1, -1);
        
        setFocusedIndex(newIndex);
        
        // Focus the notification element
        const notificationElements = listRef.current?.querySelectorAll('[data-notification-item]');
        if (notificationElements && notificationElements[newIndex]) {
          notificationElements[newIndex].focus();
        }
      }

      // Escape to close
      if (e.key === 'Escape') {
        onClose();
      }

      // Enter to mark as read
      if (e.key === 'Enter' && focusedIndex >= 0) {
        const notification = virtualizedNotifications[focusedIndex];
        if (notification && !notification.read) {
          debouncedMarkRead(notification.id);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, focusedIndex, virtualizedNotifications, debouncedMarkRead]);

  // Debounce utility
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && listRef.current) {
      // Focus the first focusable element
      const focusableElements = listRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
    
    // Return focus to trigger element when closing
    return () => {
      if (!isOpen) {
        const notificationButton = document.querySelector('[aria-label*="notification"]');
        if (notificationButton) {
          notificationButton.focus();
        }
      }
    };
  }, [isOpen]);

  // Close when clicking outside
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClick}
            className="fixed inset-0 bg-black/60 z-40"
            aria-hidden="true"
          />

          {/* Notification Center Panel */}
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="notification-center fixed top-16 right-0 bottom-0 w-full sm:w-96 max-w-full bg-[#0d1117] border-l border-gray-800 z-[50] flex flex-col shadow-2xl max-h-[calc(100vh-4rem)]"
            role="dialog"
            aria-label="Notification Center"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Mark all as read */}
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="px-3 py-1.5 text-sm text-blue-400 hover:text-white hover:bg-blue-600/20 rounded-lg transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      done_all
                    </span>
                    Mark all read
                  </button>
                )}

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close notifications"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    close
                  </span>
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div 
              ref={listRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700"
              role="region"
              aria-label="Notifications list"
            >
               {notifications.length === 0 ? (
                 <div className="empty-state text-center py-16">
                   <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">
                     notifications_none
                   </span>
                   <h3 className="text-xl font-semibold text-white mb-2">
                     No Notifications Yet
                   </h3>
                   <p className="text-gray-400 max-w-sm mx-auto">
                     When you earn badges, reach streak milestones, or complete goals, 
                     your notifications will appear here.
                   </p>
                   <p className="text-gray-500 text-sm mt-4">
                     Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Esc</kbd> to close
                   </p>
                 </div>
               ) : (
                 <div>
                   {/* Show virtualization warning for large lists */}
                   {notifications.length > 50 && (
                     <div className="mb-4 p-3 bg-yellow-600/20 border border-yellow-600/40 rounded-lg">
                       <p className="text-yellow-400 text-sm">
                         Showing {virtualizedNotifications.length} of {notifications.length} notifications for performance
                       </p>
                     </div>
                   )}
                   
                   <AnimatePresence mode="popLayout">
                     {virtualizedNotifications.map((notification, index) => (
                       <div
                         key={notification.id}
                         data-notification-item
                         tabIndex={0}
                         style={{ transitionDelay: `${index * 20}ms` }}
                         onFocus={() => setFocusedIndex(index)}
                         onBlur={() => setFocusedIndex(-1)}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter' && !notification.read) {
                             debouncedMarkRead(notification.id);
                           }
                         }}
                         aria-label={`Notification: ${notification.title} - ${notification.read ? 'read' : 'unread'}`}
                         aria-setsize={virtualizedNotifications.length}
                         aria-posinset={index + 1}
                       >
                         <NotificationItem
                           notification={notification}
                           onMarkRead={handleMarkRead}
                           onDelete={handleDelete}
                           isFocused={focusedIndex === index}
                         />
                       </div>
                     ))}
                   </AnimatePresence>
                   
                   {/* Show more indicator for large lists */}
                   {notifications.length > 50 && (
                     <div className="text-center py-4">
                       <p className="text-gray-500 text-sm">
                         And {notifications.length - 50} more notifications...
                       </p>
                     </div>
                   )}
                 </div>
               )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    notifications.forEach(n => {
                      if (!n.read) handleMarkRead(n.id);
                    });
                  }}
                  className="w-full py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

NotificationCenter.displayName = 'NotificationCenter';

export default NotificationCenter;