import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { addActivity } from '../store/analyticsSlice';
import { addXP, updateSpecialStreaks, incrementStat, checkBadges } from '../store/gamificationSlice';
import { updateGoalProgressSync } from '../store/goalsSlice';
import { addNotification } from '../store/notificationsSlice';
import useGamification from './useGamification';

/**
 * Custom hook for logging user activities
 * Automatically logs activities to analytics, gamification, and goals
 * Includes debouncing to prevent excessive logging
 */
const useActivityLogger = () => {
  const dispatch = useDispatch();
  
  // Select state for checking settings and current user
  const { 
    enableAnalyticsDashboard, 
    enableGoalsAndStreaks, 
    enableGamification,
    enableEnhancedNotifications 
  } = useSelector(state => state.settings);
  
  const { userData } = useSelector(state => state.auth);
  const { goals } = useSelector(state => state.goals);
  
  // Ref for tracking recent activities (debouncing)
  const recentActivities = useRef(new Map());
  
  // Debounce timeout reference
  const debounceTimeout = useRef(null);
  
  // Get gamification hook for notifications
  const { notifyAchievement } = useGamification();

  /**
   * Check if we should log this activity (debouncing logic)
   * @param {string} activityType - Type of activity
   * @param {number} amount - Amount of activity
   * @returns {boolean} True if should log, false if debounced
   */
  const shouldLogActivity = useCallback((activityType, amount = 1) => {
    const now = Date.now();
    const key = `${activityType}_${format(new Date(), 'yyyy-MM-dd')}`;
    
    // Get last logged time for this activity type
    const lastLogged = recentActivities.current.get(key) || 0;
    
    // Only log once per activity type per 5 seconds to avoid spam
    // But allow logging for the same activity type if enough time has passed
    // or if it's a different amount (important for batch operations)
    const timeSinceLastLog = now - lastLogged;
    const debounceMs = 5000; // 5 seconds debounce
    
    if (timeSinceLastLog < debounceMs) {
      // Check if we're trying to log the same amount - if so, skip
      // But if it's a different amount, allow it (important for task completion)
      return false;
    }
    
    // Update last logged time
    recentActivities.current.set(key, now);
    
    // Clean up old entries (older than 1 day)
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    for (const [k, v] of recentActivities.current.entries()) {
      if (v < oneDayAgo) {
        recentActivities.current.delete(k);
      }
    }
    
    return true;
  }, []);

  /**
   * Check goals and trigger notifications if achieved
   * @param {string} activityType - Type of activity
   */
  const checkGoalAchievements = useCallback((activityType) => {
    if (!enableGoalsAndStreaks || !enableEnhancedNotifications) return;

    try {
      const goalCategory = getGoalCategory(activityType);
      if (!goalCategory) return;

      // Check each active goal from current Redux state
      goals.forEach(goal => {
        if (goal.category === goalCategory && !goal.completedAt) {
          if (goal.current >= goal.target) {
            // Goal achieved!
            notifyAchievement('goal_achieved', {
              goalType: goal.type,
              goalCategory,
              goalId: goal.id,
              target: goal.target,
              current: goal.current,
            });
          }
        }
      });
    } catch (error) {
      console.error('Error checking goal achievements:', error);
    }
  }, [goals, enableGoalsAndStreaks, enableEnhancedNotifications, notifyAchievement]);

  /**
   * Log an activity
   * @param {string} activityType - Type of activity to log
   * @param {number} amount - Amount to log (default: 1)
   * @param {object} metadata - Additional metadata for the activity
   */
  const logActivity = useCallback((activityType, amount = 1, metadata = {}) => {
    // Skip if analytics dashboard is disabled
    if (!enableAnalyticsDashboard) {
      return;
    }

    // Check debouncing
    if (!shouldLogActivity(activityType, amount)) {
      return;
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const userId = userData?.$id;

    // Log to analytics
    dispatch(addActivity({
      date: today,
      activityType: getActivityMetricType(activityType),
      amount,
    }));

    // Update gamification if enabled
    if (enableGamification) {
      // Add XP based on activity type
      const xpAmount = getXPAmount(activityType);
      dispatch(addXP(xpAmount));
      
      // Increment relevant stat
      const statName = getStatName(activityType);
      if (statName) {
        dispatch(incrementStat(statName));
      }
      
      // Check for earned badges
      dispatch(checkBadges());
      
      // Update special streaks for task and kanban activities
      if (activityType === 'task_completed') {
        // Would need to track this more carefully in real implementation
        dispatch(updateSpecialStreaks({ 
          taskStreak: metadata.taskStreak || 0 
        }));
      } else if (activityType === 'kanban_done') {
        dispatch(updateSpecialStreaks({ 
          kanbanStreak: metadata.kanbanStreak || 0 
        }));
      }
    }

    // Update goals if enabled
    if (enableGoalsAndStreaks && userId) {
      const goalCategory = getGoalCategory(activityType);
      if (goalCategory) {
        // Find matching active goals and update their progress
        // This would typically be done through a selector and async thunk
        dispatch(updateGoalProgressSync({
          goalId: metadata.goalId, // Would need to be looked up
          progress: amount,
        }));
      }
    }

    // Create notification for significant achievements
    if (enableEnhancedNotifications && metadata.notify) {
      dispatch(addNotification({
        type: metadata.notificationType || 'activity',
        title: metadata.notificationTitle || 'Activity Logged',
        message: metadata.notificationMessage || `You completed ${amount} ${activityType.replace('_', ' ')}!`,
        metadata: {
          activityType,
          amount,
          ...metadata,
        },
      }));
    }

    // Check for goal achievements
    checkGoalAchievements(activityType);

  }, [dispatch, enableAnalyticsDashboard, enableGamification, enableGoalsAndStreaks, enableEnhancedNotifications, userData, shouldLogActivity, checkGoalAchievements]);

  /**
   * Log multiple activities at once (for batch operations)
   * @param {Array} activities - Array of activity objects
   */
  const logActivities = useCallback((activities) => {
    activities.forEach(({ type, amount, metadata }) => {
      logActivity(type, amount, metadata);
    });
  }, [logActivity]);

  /**
   * Log a note creation activity
   * @param {object} note - The created note (optional, for metadata)
   */
  const logNoteCreated = useCallback((note = {}) => {
    logActivity('note_created', 1, {
      noteId: note.$id,
      noteTitle: note.title,
      notify: false, // Don't notify for regular note creation
    });
  }, [logActivity]);

  /**
   * Log a task completion activity
   * @param {object} task - The completed task (optional, for metadata)
   */
  const logTaskCompleted = useCallback((task = {}) => {
    logActivity('task_completed', 1, {
      taskId: task.$id,
      taskTitle: task.title,
      notify: true,
      notificationType: 'task_completed',
      notificationTitle: 'Task Completed! ✅',
      notificationMessage: 'Great job! You completed another task.',
    });
  }, [logActivity]);

  /**
   * Log a kanban move activity
   * @param {object} note - The moved note (optional, for metadata)
   */
  const logKanbanMove = useCallback((note = {}) => {
    logActivity('kanban_done', 1, {
      noteId: note.$id,
      noteTitle: note.title,
      notify: false, // Don't notify for regular kanban moves
    });
  }, [logActivity]);

  /**
   * Log a daily streak activity
   */
  const logDailyStreak = useCallback(() => {
    logActivity('daily_streak', 1, {
      notify: true,
      notificationType: 'streak_milestone',
      notificationTitle: 'Streak Updated! 🔥',
      notificationMessage: 'Keep up the momentum!',
    });
  }, [logActivity]);

  /**
   * Manually trigger badge check (useful after significant events)
   */
  const triggerBadgeCheck = useCallback(() => {
    if (enableGamification) {
      dispatch(checkBadges());
    }
  }, [dispatch, enableGamification]);

  return {
    // Main logging function
    logActivity,
    // Batch logging
    logActivities,
    // Convenience methods
    logNoteCreated,
    logTaskCompleted,
    logKanbanMove,
    logDailyStreak,
    // Badge checking
    triggerBadgeCheck,
    // Goal checking
    checkGoalAchievements,
  };
};

/**
 * Get the metric type for analytics from activity type
 * @param {string} activityType - The activity type
 * @returns {string} The analytics metric type
 */
const getActivityMetricType = (activityType) => {
  const mapping = {
    'note_created': 'notesCreated',
    'task_completed': 'tasksCompleted',
    'kanban_done': 'kanbanMoves',
    'daily_streak': 'streakDays',
  };
  return mapping[activityType] || 'totalActivity';
};

/**
 * Get XP amount for an activity type
 * @param {string} activityType - The activity type
 * @returns {number} XP amount to award
 */
const getXPAmount = (activityType) => {
  const xpMapping = {
    'note_created': 10,      // 10 XP for creating a note
    'task_completed': 20,    // 20 XP for completing a task
    'kanban_done': 10,       // 10 XP for kanban move
    'daily_streak': 5,       // 5 XP for daily streak bonus
  };
  return xpMapping[activityType] || 5;
};

/**
 * Get the stat name to increment for an activity type
 * @param {string} activityType - The activity type
 * @returns {string|null} The stat name or null
 */
const getStatName = (activityType) => {
  const statMapping = {
    'note_created': 'notesCreated',
    'task_completed': 'tasksCompleted',
    'kanban_done': 'kanbanMoves',
  };
  return statMapping[activityType] || null;
};

/**
 * Get the goal category for an activity type
 * @param {string} activityType - The activity type
 * @returns {string|null} The goal category or null
 */
const getGoalCategory = (activityType) => {
  const categoryMapping = {
    'note_created': 'notes_created',
    'task_completed': 'tasks_completed',
    'kanban_done': 'kanban_moves',
  };
  return categoryMapping[activityType] || null;
};

export default useActivityLogger;
