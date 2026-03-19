import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  fetchReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  snoozeReminder,
  checkOverdue,
  selectAllReminders,
  selectOverdueCount,
  selectUpcomingCount,
  selectRemindersPreferences,
  selectOverdueReminders,
  selectUpcomingReminders,
  selectRemindersByNoteId,
  toggleReminderActive,
  dismissReminder,
  recalculateCounts,
} from '../store/remindersSlice';
import { incrementStat, checkBadges } from '../store/gamificationSlice';
import { playSound, SOUND_TYPES } from '../utils/timer';

/**
 * Default reminder times in minutes
 */
const DEFAULT_REMINDER_TIMES = [15, 60, 1440]; // 15 min, 1 hour, 1 day

/**
 * Custom hook for managing reminders
 * Provides reminder management, due date checking, and notification scheduling
 */
const useReminders = () => {
  const dispatch = useDispatch();
  const checkIntervalRef = useRef(null);
  const notifiedRemindersRef = useRef(new Set());

  // Select state from Redux
  const reminders = useSelector(selectAllReminders);
  const overdueCount = useSelector(selectOverdueCount);
  const upcomingCount = useSelector(selectUpcomingCount);
  const preferences = useSelector(selectRemindersPreferences);
  const overdueReminders = useSelector(selectOverdueReminders);
  const upcomingReminders = useSelector(selectUpcomingReminders);

  // Check for due reminders periodically
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      
      reminders.forEach(reminder => {
        if (!reminder.isActive) return;
        if (reminder.snoozeUntil && new Date(reminder.snoozeUntil) > now) return;
        
        const dueDate = new Date(reminder.dueDate);
        const timeUntilDue = dueDate - now;
        
        // Check if reminder should trigger (within 1 minute of due time)
        if (timeUntilDue <= 60000 && timeUntilDue > -60000 && !notifiedRemindersRef.current.has(reminder.id)) {
          notifiedRemindersRef.current.add(reminder.id);
          
          // Play sound
          if (preferences.enableSoundNotifications) {
            playSound(SOUND_TYPES.ALARM);
          }
          
          // Show notification
          toast.warning(`Reminder: ${formatRelativeTime(dueDate)}`, {
            autoClose: false,
            closeOnClick: false,
          });
          
          // Clear notification after 5 minutes
          setTimeout(() => {
            notifiedRemindersRef.current.delete(reminder.id);
          }, 300000);
        }
      });
    };

    // Check every 30 seconds
    checkIntervalRef.current = setInterval(checkReminders, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [reminders, preferences]);

  // Fetch all reminders
  const fetchAllReminders = useCallback(async () => {
    try {
      await dispatch(fetchReminders()).unwrap();
      dispatch(recalculateCounts());
    } catch (err) {
      console.error('Error fetching reminders:', err);
      throw err;
    }
  }, [dispatch]);

  // Create a new reminder
  const createNewReminder = useCallback(async (reminderData) => {
    try {
      const result = await dispatch(createReminder(reminderData)).unwrap();
      toast.success('Reminder created successfully');
      dispatch(incrementStat('remindersSet'));
      dispatch(checkBadges());
      dispatch(recalculateCounts());
      return result;
    } catch (err) {
      toast.error(`Failed to create reminder: ${err}`);
      throw err;
    }
  }, [dispatch]);

  // Update an existing reminder
  const updateExistingReminder = useCallback(async (reminderId, updates) => {
    try {
      const result = await dispatch(updateReminder({ reminderId, updates })).unwrap();
      toast.success('Reminder updated successfully');
      dispatch(recalculateCounts());
      return result;
    } catch (err) {
      toast.error(`Failed to update reminder: ${err}`);
      throw err;
    }
  }, [dispatch]);

  // Delete a reminder
  const removeReminder = useCallback(async (reminderId) => {
    try {
      await dispatch(deleteReminder(reminderId)).unwrap();
      toast.success('Reminder deleted successfully');
      dispatch(recalculateCounts());
      return true;
    } catch (err) {
      toast.error(`Failed to delete reminder: ${err}`);
      throw err;
    }
  }, [dispatch]);

  // Snooze a reminder
  const snooze = useCallback(async (reminderId, duration = null) => {
    try {
      await dispatch(snoozeReminder({ reminderId, duration })).unwrap();
      toast.info(`Reminder snoozed for ${duration || preferences.snoozeDuration} minutes`);
      dispatch(recalculateCounts());
      return true;
    } catch (err) {
      toast.error(`Failed to snooze reminder: ${err}`);
      throw err;
    }
  }, [dispatch, preferences]);

  // Toggle reminder active status
  const toggleActive = useCallback((reminderId) => {
    dispatch(toggleReminderActive(reminderId));
    dispatch(recalculateCounts());
  }, [dispatch]);

  // Dismiss a reminder
  const dismiss = useCallback(async (reminderId) => {
    dispatch(dismissReminder(reminderId));
    dispatch(incrementStat('remindersCompleted'));
    dispatch(checkBadges());
    toast.success('Reminder dismissed');
    return true;
  }, [dispatch]);

  // Get reminders for a specific note
  const getNoteReminders = useCallback((noteId) => {
    return reminders.filter(r => r.noteId === noteId);
  }, [reminders]);

  // Check if note has reminders
  const hasReminders = useCallback((noteId) => {
    return reminders.some(r => r.noteId === noteId && r.isActive);
  }, [reminders]);

  // Get due date info for display
  const getDueDateInfo = useCallback((dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const isOverdue = due < now;
    const isToday = due.toDateString() === now.toDateString();
    const isTomorrow = due.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    return {
      isOverdue,
      isToday,
      isTomorrow,
      formatted: formatDueDate(due),
      relative: isOverdue ? `Overdue by ${formatRelativeTime(due)}` : formatRelativeTime(due),
      urgency: getUrgency(due),
    };
  }, []);

  // Format due date for display
  const formatDueDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format relative time
  const formatRelativeTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = d - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      const absMins = Math.abs(diffMins);
      if (absMins < 60) return `${absMins} minutes ago`;
      if (absMins < 1440) return `${Math.floor(absMins / 60)} hours ago`;
      return `${Math.floor(absMins / 1440)} days ago`;
    }

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `in ${diffMins} minutes`;
    if (diffHours < 24) return `in ${diffHours} hours`;
    return `in ${diffDays} days`;
  };

  // Get urgency level
  const getUrgency = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diffMins = (d - now) / 60000;

    if (diffMins < 0) return 'overdue';
    if (diffMins < 15) return 'urgent';
    if (diffMins < 60) return 'soon';
    if (diffMins < 1440) return 'later';
    return 'normal';
  };

  // Create reminder with default times
  const createWithDefaults = useCallback((noteId, dueDate, userId) => {
    return createNewReminder({
      noteId,
      dueDate,
      userId,
      reminderTimes: preferences.defaultReminderTimes || DEFAULT_REMINDER_TIMES,
    });
  }, [createNewReminder, preferences]);

  // Get reminder statistics
  const getStats = useCallback(() => {
    const now = new Date();
    
    return {
      total: reminders.length,
      active: reminders.filter(r => r.isActive).length,
      overdue: overdueCount,
      upcoming: upcomingCount,
      snoozed: reminders.filter(r => r.snoozeUntil && new Date(r.snoozeUntil) > now).length,
      dueToday: reminders.filter(r => {
        const due = new Date(r.dueDate);
        return r.isActive && due.toDateString() === now.toDateString();
      }).length,
      dueThisWeek: reminders.filter(r => {
        const due = new Date(r.dueDate);
        const weekFromNow = new Date(now.getTime() + 7 * 86400000);
        return r.isActive && due >= now && due <= weekFromNow;
      }).length,
    };
  }, [reminders, overdueCount, upcomingCount]);

  // Check overdue reminders
  const checkOverdueReminders = useCallback(async () => {
    try {
      await dispatch(checkOverdue()).unwrap();
    } catch (err) {
      console.error('Error checking overdue reminders:', err);
    }
  }, [dispatch]);

  // Clear all dismissed reminders
  const clearDismissed = useCallback(() => {
    const dismissed = reminders.filter(r => !r.isActive);
    dismissed.forEach(r => dispatch(dismissReminder(r.id)));
  }, [dispatch, reminders]);

  return {
    // State
    reminders,
    overdueCount,
    upcomingCount,
    preferences,
    overdueReminders,
    upcomingReminders,
    
    // Actions
    fetchAllReminders,
    createNewReminder,
    updateExistingReminder,
    removeReminder,
    snooze,
    toggleActive,
    dismiss,
    checkOverdueReminders,
    
    // Helpers
    getNoteReminders,
    hasReminders,
    getDueDateInfo,
    formatDueDate,
    formatRelativeTime,
    getStats,
    createWithDefaults,
    
    // Computed
    hasRemindersArray: reminders.length > 0,
    hasOverdue: overdueCount > 0,
    hasUpcoming: upcomingCount > 0,
  };
};

export default useReminders;