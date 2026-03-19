import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePreferences } from '../../store/remindersSlice';
import { toast } from 'react-toastify';

/**
 * ReminderScheduler Component
 * Interface for setting default reminder preferences
 */
const ReminderScheduler = ({ className = '', onClose }) => {
  const dispatch = useDispatch();
  const preferences = useSelector(state => state.reminders.preferences);

  const [defaultTimes, setDefaultTimes] = useState(preferences.defaultReminderTimes || [15, 60, 1440]);
  const [enableSound, setEnableSound] = useState(preferences.enableSoundNotifications);
  const [snoozeDuration, setSnoozeDuration] = useState(preferences.snoozeDuration || 15);

  // Available reminder times in minutes
  const availableTimes = [
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 1440, label: '1 day' },
    { value: 2880, label: '2 days' },
    { value: 10080, label: '1 week' },
  ];

  const handleToggleTime = (timeValue) => {
    if (defaultTimes.includes(timeValue)) {
      setDefaultTimes(defaultTimes.filter(t => t !== timeValue));
    } else {
      setDefaultTimes([...defaultTimes, timeValue].sort((a, b) => a - b));
    }
  };

  const handleSave = () => {
    dispatch(updatePreferences({
      defaultReminderTimes: defaultTimes,
      enableSoundNotifications: enableSound,
      snoozeDuration,
    }));
    toast.success('Reminder preferences saved');
    onClose?.();
  };

  const handleReset = () => {
    setDefaultTimes([15, 60, 1440]);
    setEnableSound(true);
    setSnoozeDuration(15);
  };

  return (
    <div className={`bg-[#171717] rounded-xl p-6 ${className}`}>
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined">notifications</span>
        Reminder Preferences
      </h3>

      {/* Default Reminder Times */}
      <div className="mb-6">
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Default Reminder Times
        </label>
        <p className="text-gray-500 text-xs mb-3">
          Choose when to be reminded before the due date
        </p>
        <div className="flex flex-wrap gap-2">
          {availableTimes.map(time => (
            <button
              key={time.value}
              onClick={() => handleToggleTime(time.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                defaultTimes.includes(time.value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {time.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sound Notifications */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-300 text-sm font-medium">Sound Notifications</p>
            <p className="text-gray-500 text-xs">Play sound when reminder triggers</p>
          </div>
          <button
            onClick={() => setEnableSound(!enableSound)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              enableSound ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                enableSound ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Snooze Duration */}
      <div className="mb-6">
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Default Snooze Duration
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={snoozeDuration}
            onChange={(e) => setSnoozeDuration(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="bg-gray-800 rounded-lg px-3 py-2 min-w-[60px] text-center">
            <span className="text-white font-medium">{snoozeDuration}</span>
            <span className="text-gray-400 text-xs ml-1">min</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-700">
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default ReminderScheduler;