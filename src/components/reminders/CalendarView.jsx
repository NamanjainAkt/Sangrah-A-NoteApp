import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { useSelector } from 'react-redux';
import { selectAllReminders } from '../../store/remindersSlice';
import useReminders from '../../hooks/useReminders';

/**
 * CalendarView Component
 * Calendar showing upcoming due dates with note highlights
 */
const CalendarView = ({ 
  onDateSelect,
  onNoteClick,
  className = '',
}) => {
  const reminders = useSelector(selectAllReminders);
  const { formatDueDate } = useReminders();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get reminders for a specific date
  const getRemindersForDate = (date) => {
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.dueDate);
      return isSameDay(reminderDate, date) && reminder.isActive;
    });
  };

  // Get all days in current month
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get notes with due dates for tooltip
  const getDateContent = (date) => {
    const dayReminders = getRemindersForDate(date);
    
    if (dayReminders.length === 0) return null;

    // Sort by urgency
    const sorted = [...dayReminders].sort((a, b) => 
      new Date(a.dueDate) - new Date(b.dueDate)
    );

    // Show up to 3 indicators
    const indicators = sorted.slice(0, 3).map(reminder => {
      const urgency = getUrgency(new Date(reminder.dueDate));
      const color = urgency === 'overdue' ? 'bg-red-500' 
        : urgency === 'urgent' ? 'bg-orange-500' 
        : 'bg-blue-500';
      
      return (
        <div 
          key={reminder.id} 
          className={`w-2 h-2 rounded-full ${color}`}
          title={formatDueDate(reminder.dueDate)}
        />
      );
    });

    if (sorted.length > 3) {
      indicators.push(
        <span key="more" className="text-xs text-gray-400">
          +{sorted.length - 3}
        </span>
      );
    }

    return (
      <div className="flex gap-1 mt-1 justify-center">
        {indicators}
      </div>
    );
  };

  // Get urgency level
  const getUrgency = (date) => {
    const now = new Date();
    const diffMins = (date - now) / 60000;
    
    if (diffMins < 0) return 'overdue';
    if (diffMins < 60) return 'urgent';
    return 'normal';
  };

  // Handle date click
  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dayReminders = getRemindersForDate(date);
    if (dayReminders.length > 0 && onNoteClick) {
      onNoteClick(dayReminders[0].noteId);
    } else if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Custom tile content
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    return getDateContent(date);
  };

  // Custom tile class
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    
    const classes = ['react-calendar__tile'];
    
    if (isSameDay(date, selectedDate)) {
      classes.push('react-calendar__tile--selected');
    }
    
    const dayReminders = getRemindersForDate(date);
    if (dayReminders.length > 0) {
      classes.push('has-reminders');
    }

    // Highlight overdue
    const hasOverdue = dayReminders.some(r => 
      new Date(r.dueDate) < new Date()
    );
    if (hasOverdue) {
      classes.push('has-overdue');
    }

    return classes.join(' ');
  };

  // Navigation handlers
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className={`bg-[#171717] rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-gray-400">
            chevron_left
          </span>
        </button>
        
        <h3 className="text-white font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-gray-400">
            chevron_right
          </span>
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span className="text-gray-400">Upcoming</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span className="text-gray-400">Soon</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span className="text-gray-400">Overdue</span>
        </div>
      </div>

      {/* Calendar */}
      <Calendar
        onChange={handleDateClick}
        value={selectedDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
        prev2Label={null}
        next2Label={null}
        className="react-calendar-dark"
      />

      {/* Today Button */}
      <button
        onClick={handleToday}
        className="w-full mt-4 py-2 bg-gray-800 rounded-lg text-gray-300 text-sm hover:bg-gray-700 transition-colors"
      >
        Go to Today
      </button>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-white font-medium mb-2">
            {format(selectedDate, 'EEEE, MMMM d')}
          </p>
          {(() => {
            const dayReminders = getRemindersForDate(selectedDate);
            if (dayReminders.length === 0) {
              return (
                <p className="text-gray-500 text-sm">
                  No reminders due
                </p>
              );
            }
            return (
              <div className="space-y-2">
                {dayReminders.map(reminder => (
                  <div 
                    key={reminder.id}
                    className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
                    onClick={() => onNoteClick?.(reminder.noteId)}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      getUrgency(new Date(reminder.dueDate)) === 'overdue' 
                        ? 'bg-red-500' 
                        : 'bg-blue-500'
                    }`} />
                    <span className="text-white text-sm flex-1 truncate">
                      {formatDueDate(reminder.dueDate)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      <style>{`
        .react-calendar-dark {
          background: transparent !important;
          border: none !important;
          font-family: inherit !important;
          width: 100% !important;
        }
        .react-calendar-dark .react-calendar__tile {
          padding: 12px 8px !important;
          border-radius: 8px !important;
        }
        .react-calendar-dark .react-calendar__tile--now {
          background: #1e3a5f !important;
        }
        .react-calendar-dark .react-calendar__tile--selected {
          background: #3b82f6 !important;
        }
        .react-calendar-dark .react-calendar__tile:hover {
          background: #374151 !important;
        }
        .react-calendar-dark .react-calendar__tile.has-reminders {
          background: #1f2937 !important;
        }
        .react-calendar-dark .react-calendar__tile.has-overdue {
          background: #451a1a !important;
        }
        .react-calendar-dark button {
          color: #d1d5db !important;
        }
        .react-calendar-dark .react-calendar__navigation button {
          min-width: auto !important;
          padding: 8px !important;
        }
        .react-calendar-dark .react-calendar__navigation button:hover {
          background: #374151 !important;
        }
        .react-calendar-dark .react-calendar__weekday {
          color: #9ca3af !important;
          font-size: 0.75rem !important;
        }
      `}</style>
    </div>
  );
};

export default CalendarView;