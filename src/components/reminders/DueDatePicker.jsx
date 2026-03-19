import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, addMinutes, addDays, addHours, startOfDay, isSameDay } from 'date-fns';
import useReminders from '../../hooks/useReminders';

/**
 * DueDatePicker Component
 * Date/time picker for setting due dates and reminders
 */
const DueDatePicker = ({ 
  value = null, 
  onChange,
  onRemove,
  className = '',
}) => {
  const { preferences } = useReminders();
  
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(value ? new Date(value) : new Date());
  const [time, setTime] = useState(value 
    ? format(new Date(value), 'HH:mm') 
    : format(addHours(new Date(), 1), 'HH:mm')
  );
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Quick time presets
  const timePresets = [
    { label: 'In 15 minutes', getValue: () => addMinutes(new Date(), 15) },
    { label: 'In 1 hour', getValue: () => addHours(new Date(), 1) },
    { label: 'Tomorrow morning', getValue: () => addDays(startOfDay(new Date()), 1).setHours(9, 0, 0, 0) },
    { label: 'End of day', getValue: () => addDays(startOfDay(new Date()), 1).setHours(23, 59, 0, 0) },
    { label: 'Next week', getValue: () => addDays(startOfDay(new Date()), 7) },
  ];

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setShowTimePicker(true);
  };

  const handleTimeChange = (e) => {
    setTime(e.target.value);
  };

  const handleConfirm = () => {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    
    onChange(newDate.toISOString());
    setIsOpen(false);
  };

  const handlePresetClick = (preset) => {
    const presetDate = preset.getValue();
    onChange(presetDate.toISOString());
    setIsOpen(false);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    
    if (isSameDay(d, now)) {
      return `Today at ${format(d, 'h:mm a')}`;
    }
    if (isSameDay(d, addDays(now, 1))) {
      return `Tomorrow at ${format(d, 'h:mm a')}`;
    }
    return format(d, 'MMM d, yyyy h:mm a');
  };

  // Custom calendar theme
  const calendarTileClassName = ({ date, view }) => {
    if (view === 'month') {
      const isToday = isSameDay(date, new Date());
      return isToday ? 'react-calendar__tile--now' : '';
    }
    return '';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Current Value Display */}
      <div 
        className="flex items-center gap-2 p-3 bg-[#171717] rounded-lg cursor-pointer hover:bg-[#2a2a2a] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="material-symbols-outlined text-gray-400">
          event
        </span>
        {value ? (
          <span className="text-white text-sm flex-1">
            {formatDateDisplay(value)}
          </span>
        ) : (
          <span className="text-gray-500 text-sm flex-1">Set due date...</span>
        )}
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
        <span className="material-symbols-outlined text-gray-400">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-[#171717] rounded-lg shadow-xl p-4">
          {/* Quick Presets */}
          <div className="mb-4">
            <p className="text-gray-400 text-xs mb-2">Quick Select</p>
            <div className="flex flex-wrap gap-2">
              {timePresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetClick(preset)}
                  className="px-3 py-1.5 bg-gray-800 rounded-lg text-xs text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="mb-4">
            <Calendar
              onChange={handleDateChange}
              value={date}
              minDate={new Date()}
              tileClassName={calendarTileClassName}
              prev2Label={null}
              next2Label={null}
              className="react-calendar-dark"
            />
          </div>

          {/* Time Picker */}
          <div className="mb-4">
            <label className="block text-gray-400 text-xs mb-2">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={handleTimeChange}
              className="px-3 py-2 bg-gray-800 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                onRemove?.();
                setIsOpen(false);
              }}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors"
            >
              Remove
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      <style>{`
        .react-calendar-dark {
          background: transparent !important;
          border: none !important;
          font-family: inherit !important;
        }
        .react-calendar-dark .react-calendar__tile--now {
          background: #3b82f6 !important;
          border-radius: 8px !important;
        }
        .react-calendar-dark .react-calendar__tile--active {
          background: #2563eb !important;
          border-radius: 8px !important;
        }
        .react-calendar-dark .react-calendar__tile:hover {
          background: #374151 !important;
          border-radius: 8px !important;
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
      `}</style>
    </div>
  );
};

export default DueDatePicker;