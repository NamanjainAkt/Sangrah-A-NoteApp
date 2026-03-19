import React, { memo, useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NotificationItem Component
 * Displays a single notification with icon, title, message, timestamp, and actions
 * Props:
 * - notification: object - Notification data
 * - onMarkRead: function - Mark as read callback
 * - onDelete: function - Delete notification callback
 */
const NotificationItem = memo(({ notification, onMarkRead, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Notification type configuration
  const typeConfig = {
    goal_achieved: {
      icon: '🎯',
      color: 'green',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    streak_milestone: {
      icon: '🔥',
      color: 'orange',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
    },
    badge_earned: {
      icon: '🏆',
      color: 'yellow',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
    },
    streak_broken: {
      icon: '💔',
      color: 'red',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
    level_up: {
      icon: '⬆️',
      color: 'purple',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    task_completed: {
      icon: '✅',
      color: 'green',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    default: {
      icon: '📬',
      color: 'blue',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
  };

  const config = typeConfig[notification.type] || typeConfig.default;
  const timestamp = notification.createdAt 
    ? formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true })
    : 'Unknown time';

  const handleClick = () => {
    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete(notification.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ scale: 1.01 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setShowDeleteConfirm(false)}
      className={`
        notification-item relative p-4 rounded-xl cursor-pointer transition-all duration-200
        bg-[#171717] border ${config.borderColor}
        ${!notification.read ? 'ring-1 ring-blue-500/30' : ''}
        hover:bg-[#1f1f1f]
      `}
      role="article"
      aria-label={`${notification.title} notification`}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
      )}

      {/* Content */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center
          text-xl
        `}>
          {config.icon}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-white font-medium mb-1 ${!notification.read ? 'font-semibold' : ''}`}>
            {notification.title}
          </h4>
          <p className="text-gray-400 text-sm line-clamp-2 mb-2">
            {notification.message}
          </p>
          <span className="text-gray-500 text-xs">
            {timestamp}
          </span>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {/* Mark as read button */}
          {!notification.read && onMarkRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Mark as read"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                done_all
              </span>
            </button>
          )}

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={handleDelete}
              className={`
                p-2 rounded-lg transition-colors
                ${showDeleteConfirm 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                }
              `}
              aria-label={showDeleteConfirm ? 'Confirm delete' : 'Delete notification'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {showDeleteConfirm ? 'check' : 'delete'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Animated border for unread */}
      {!notification.read && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl"
        />
      )}
    </motion.div>
  );
});

NotificationItem.displayName = 'NotificationItem';

export default NotificationItem;