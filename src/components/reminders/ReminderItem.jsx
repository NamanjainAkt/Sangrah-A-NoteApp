import React from 'react';
import useReminders from '../../hooks/useReminders';

/**
 * ReminderItem Component
 * Individual reminder display with snooze/dismiss actions and countdown
 */
const ReminderItem = ({ 
  reminder,
  onSnooze,
  onDismiss,
  onNoteClick,
  className = '',
}) => {
  const { getDueDateInfo, formatRelativeTime } = useReminders();
  
  const dueInfo = getDueDateInfo(reminder.dueDate);
  
  // Calculate time remaining for countdown
  const getTimeRemaining = () => {
    const now = new Date();
    const due = new Date(reminder.dueDate);
    const diff = due - now;
    
    if (diff < 0) {
      const absDiff = Math.abs(diff);
      const hours = Math.floor(absDiff / (1000 * 60 * 60));
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
      return {
        isOverdue: true,
        text: `${hours}h ${minutes}m overdue`,
        urgent: true,
      };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return {
        isOverdue: false,
        text: `${days} day${days > 1 ? 's' : ''} remaining`,
        urgent: false,
      };
    }
    
    if (hours > 0) {
      return {
        isOverdue: false,
        text: `${hours}h ${minutes}m remaining`,
        urgent: hours < 1,
      };
    }
    
    return {
      isOverdue: false,
      text: `${minutes}m remaining`,
      urgent: minutes < 15,
    };
  };

  const timeRemaining = getTimeRemaining();

  // Get urgency styling
  const getUrgencyStyling = () => {
    if (dueInfo.isOverdue) {
      return {
        border: 'border-red-500/50',
        bg: 'bg-red-500/10',
        icon: 'schedule',
        iconColor: 'text-red-500',
      };
    }
    if (timeRemaining.urgent) {
      return {
        border: 'border-orange-500/50',
        bg: 'bg-orange-500/10',
        icon: 'priority_high',
        iconColor: 'text-orange-500',
      };
    }
    return {
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/10',
      icon: 'event',
      iconColor: 'text-blue-500',
    };
  };

  const styling = getUrgencyStyling();

  return (
    <div 
      className={`${styling.bg} ${styling.border} border rounded-xl p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${styling.iconColor} mt-0.5`}>
          <span className="material-symbols-outlined">
            {reminder.snoozeUntil ? 'snooze' : styling.icon}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${
              dueInfo.isOverdue ? 'text-red-400' : 'text-blue-400'
            }`}>
              {dueInfo.formatted}
            </span>
            {reminder.snoozeUntil && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                Snoozed
              </span>
            )}
          </div>
          
          <p className="text-white text-sm font-medium truncate">
            Due Date Reminder
          </p>
          
          <p className={`text-xs mt-1 ${
            timeRemaining.urgent ? 'text-orange-400' : 'text-gray-400'
          }`}>
            {timeRemaining.text}
          </p>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            {/* Snooze options */}
            <div className="relative group">
              <button 
                className="px-3 py-1.5 bg-gray-800 rounded-lg text-xs text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onSnooze?.(reminder.id, 15);
                }}
                onMouseEnter={(e) => {
                  // Show snooze menu on hover
                  e.currentTarget.parentElement.querySelector('.snooze-menu')?.classList.remove('hidden');
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.parentElement.querySelector('.snooze-menu')?.classList.add('hidden');
                }}
              >
                <span className="material-symbols-outlined text-xs">snooze</span>
                Snooze
              </button>
              
              {/* Snooze dropdown */}
              <div className="snooze-menu hidden absolute bottom-full left-0 mb-1 bg-gray-800 rounded-lg shadow-xl py-1 min-w-[120px] z-10">
                {[15, 30, 60, 120].map(minutes => (
                  <button
                    key={minutes}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSnooze?.(reminder.id, minutes);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    {minutes < 60 ? `${minutes} min` : `${minutes / 60} hour`}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss?.(reminder.id);
              }}
              className="px-3 py-1.5 bg-gray-800 rounded-lg text-xs text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">close</span>
              Dismiss
            </button>

            <button
              onClick={() => onNoteClick?.(reminder.noteId)}
              className="ml-auto px-3 py-1.5 bg-blue-600 rounded-lg text-xs text-white hover:bg-blue-500 transition-colors"
            >
              View Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderItem;