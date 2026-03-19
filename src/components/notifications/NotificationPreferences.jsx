import React, { memo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePreferences } from '../../store/notificationsSlice';
import { selectPreferences } from '../../store/notificationsSlice';
import { toast } from 'react-toastify';

/**
 * NotificationPreferences Component
 * Toggle switches for configuring notification preferences
 * Props:
 * - preferences: object - Notification preferences
 * - onUpdatePreferences: function - Update preferences callback
 */
const NotificationPreferences = memo(({ preferences: propPreferences, onUpdatePreferences: propOnUpdate }) => {
  const dispatch = useDispatch();
  const storePreferences = useSelector(selectPreferences);
  
  const [localPreferences, setLocalPreferences] = useState(propPreferences || storePreferences);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when store changes
  useEffect(() => {
    if (propPreferences) {
      setLocalPreferences(propPreferences);
    } else {
      setLocalPreferences(storePreferences);
    }
  }, [propPreferences, storePreferences]);

  // Check for changes
  useEffect(() => {
    const preferences = propPreferences || storePreferences;
    const isChanged = Object.keys(localPreferences).some(
      key => localPreferences[key] !== preferences[key]
    );
    setHasChanges(isChanged);
  }, [localPreferences, propPreferences, storePreferences]);

  // Handle preference toggle
  const handleToggle = async (key) => {
    const newValue = !localPreferences[key];
    
    // For browser notifications, request permission first
    if (key === 'enableBrowserNotifications' && newValue) {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('Browser notifications were denied. Please enable them in your browser settings.');
          return;
        }
        toast.success('Browser notifications enabled!');
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        toast.error('Failed to enable browser notifications');
        return;
      }
    }

    setLocalPreferences(prev => ({
      ...prev,
      [key]: newValue,
    }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      if (propOnUpdate) {
        await propOnUpdate(localPreferences);
      } else {
        await dispatch(updatePreferences(localPreferences)).unwrap();
      }
      toast.success('Notification preferences saved!');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  // Reset to default preferences
  const handleReset = () => {
    const defaultPreferences = {
      enableBrowserNotifications: false,
      enableToastNotifications: true,
      enableGoalNotifications: true,
      enableStreakNotifications: true,
      enableBadgeNotifications: true,
    };
    setLocalPreferences(defaultPreferences);
    setHasChanges(true);
  };

  const preferenceOptions = [
    {
      key: 'enableBrowserNotifications',
      icon: 'notifications',
      title: 'Browser Notifications',
      description: 'Show native browser notifications for important events',
    },
    {
      key: 'enableToastNotifications',
      icon: 'toast',
      title: 'Toast Notifications',
      description: 'Show in-app toast notifications for quick updates',
    },
    {
      key: 'enableGoalNotifications',
      icon: 'track_changes',
      title: 'Goal Notifications',
      description: 'Get notified when you complete or achieve goals',
    },
    {
      key: 'enableStreakNotifications',
      icon: 'local_fire_department',
      title: 'Streak Notifications',
      description: 'Receive updates about streak milestones and broken streaks',
    },
    {
      key: 'enableBadgeNotifications',
      icon: 'military_tech',
      title: 'Badge Notifications',
      description: 'Get notified when you earn new badges',
    },
  ];

  return (
    <div className="notification-preferences bg-[#171717] rounded-xl p-6">
      <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-gray-400">settings</span>
        Notification Preferences
      </h3>

      {/* Preference Toggles */}
      <div className="space-y-4 mb-6">
        {preferenceOptions.map(option => {
          const isEnabled = localPreferences[option.key];
          
          return (
            <div
              key={option.key}
              className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg hover:bg-[#161b22] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${isEnabled ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-700/10 text-gray-500'}
                `}>
                  <span className="material-symbols-outlined">
                    {option.icon}
                  </span>
                </div>
                <div>
                  <h4 className="text-white font-medium">{option.title}</h4>
                  <p className="text-gray-400 text-sm">{option.description}</p>
                </div>
              </div>

              <button
                onClick={() => handleToggle(option.key)}
                className={`
                  relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300
                  ${isEnabled ? 'bg-green-500' : 'bg-gray-600'}
                `}
                role="switch"
                aria-checked={isEnabled}
              >
                <span
                  className={`
                    inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300
                    ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2
            ${hasChanges 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            save
          </span>
          Save Preferences
        </button>

        <button
          onClick={handleReset}
          className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          Reset to Default
        </button>
      </div>

      {/* Browser Permission Info */}
      {localPreferences.enableBrowserNotifications && (
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              info
            </span>
            <span className="font-medium">Browser Permission Active</span>
          </div>
          <p className="text-gray-400 text-sm">
            You'll receive browser notifications for achievements, milestones, and important updates.
            Make sure your browser allows notifications for this site.
          </p>
        </div>
      )}
    </div>
  );
});

NotificationPreferences.displayName = 'NotificationPreferences';

export default NotificationPreferences;