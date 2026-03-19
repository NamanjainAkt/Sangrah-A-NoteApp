import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  addPoints,
  addXP,
  updateStreak,
  updateSpecialStreaks,
  incrementStat,
  checkBadges,
  awardBadge,
  persistGamificationData
} from '../store/gamificationSlice';
import { addNotification } from '../store/notificationsSlice';
import soundManager from '../utils/sounds';
import { levelUp, badgeEarned, streakMilestone, goalAchieved } from '../utils/animations';

/**
 * Custom hook for managing gamification features
 * Handles points, badges, streaks, and stats tracking
 * Integrates with useActivityLogger for comprehensive activity tracking
 */
const useGamification = () => {
  const dispatch = useDispatch();
  const toastShown = useRef(new Set());

  // Animation states
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showBadgeEarned, setShowBadgeEarned] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newBadge, setNewBadge] = useState(null);

  // Select all gamification state from Redux store at the top level (React hooks rules)
  const gamificationState = useSelector(state => state.gamification);
  const { enableGamification, enableEnhancedNotifications } = useSelector(state => state.settings);

  // Extract state values for easier access
  const { points, level, xp, badges, currentStreak, specialStreaks, stats, lastActivityDate } = gamificationState;

  /**
   * Show notification for achievement
   * @param {string} type - Type of achievement
   * @param {object} metadata - Achievement metadata
   */
  const notifyAchievement = useCallback((type, metadata) => {
    if (!enableEnhancedNotifications) return;

    const notificationConfigs = {
      badge_earned: {
        title: '🏆 Badge Earned!',
        message: `Congratulations! You earned the "${metadata.name}" badge!`,
        type: 'badge_earned',
      },
      streak_milestone: {
        title: '🔥 Streak Milestone!',
        message: `Amazing! You've maintained a ${metadata.streak}-day streak!`,
        type: 'streak_milestone',
      },
      level_up: {
        title: '⬆️ Level Up!',
        message: `You've reached Level ${metadata.newLevel}! Keep up the great work!`,
        type: 'level_up',
      },
      goal_achieved: {
        title: '🎯 Goal Achieved!',
        message: `You've completed your ${metadata.goalType} goal: ${metadata.goalCategory}!`,
        type: 'goal_achieved',
      },
    };

    const config = notificationConfigs[type];
    if (!config) return;

    // Check if we've already shown this notification
    const notificationKey = `${type}-${JSON.stringify(metadata)}`;
    if (toastShown.current.has(notificationKey)) return;

    // Add notification to store
    dispatch(addNotification({
      ...config,
      metadata,
    }));

    // Show toast
    toast.success(config.message, {
      position: 'top-right',
      autoClose: 5000,
      theme: 'dark',
    });

    // Track that we've shown this notification
    toastShown.current.add(notificationKey);

    // Clean up after 1 hour
    setTimeout(() => {
      toastShown.current.delete(notificationKey);
    }, 3600000);
  }, [dispatch, enableEnhancedNotifications]);

  /**
    * Award points and update stats based on the action type
    * @param {string} action - The type of action ('note_created', 'task_completed', 'kanban_done', 'daily_streak')
    * @param {object} metadata - Additional metadata for the action
    */
  const awardPoints = useCallback((action) => {
    // Check if gamification is enabled
    if (!enableGamification) {
      return;
    }

    // Define points, XP, and stat mapping for each action type
    const actionConfig = {
      note_created: { points: 10, xp: 10, stat: 'notesCreated', badgeCheck: true },
      task_completed: { points: 20, xp: 20, stat: 'tasksCompleted', badgeCheck: true },
      kanban_done: { points: 10, xp: 10, stat: 'kanbanMoves', badgeCheck: true },
      daily_streak: { points: 5, xp: 5, stat: null, badgeCheck: false },
    };

    const config = actionConfig[action];
    if (!config) {
      console.warn(`Unknown gamification action: ${action}`);
      return;
    }

    // Add points to user's total
    dispatch(addPoints(config.points));
    
    // Add XP to user's XP total (XP determines level)
    dispatch(addXP(config.xp));

    // Update streak for daily activities
    if (action === 'daily_streak') {
      dispatch(updateStreak());
    }

    // Increment the appropriate stat counter
    if (config.stat) {
      dispatch(incrementStat(config.stat));
    }

    // Check and award any earned badges
    if (config.badgeCheck) {
      const prevBadges = badges.length;
      dispatch(checkBadges());

      // Check if new badges were earned
      const currentBadges = gamificationState.badges;
      if (currentBadges.length > prevBadges) {
        const newEarnedBadges = currentBadges.slice(prevBadges);
        newEarnedBadges.forEach(badge => {
          notifyAchievement('badge_earned', badge);
          soundManager.playBadgeEarned();
          setNewBadge(badge);
          setShowBadgeEarned(true);
          setShowConfetti(true);
        });
      }
    }

    // Save gamification data to localStorage after each update using Redux thunk
    dispatch(persistGamificationData());
  }, [dispatch, enableGamification]);

  /**
    * Add XP directly (for custom XP awards)
    * @param {number} amount - Amount of XP to add
    */
  const addExperiencePoints = useCallback((amount) => {
    if (!enableGamification) {
      return;
    }

    const oldLevel = Math.floor(xp / 100) + 1;
    dispatch(addXP(amount));

    const newLevel = Math.floor((xp + amount) / 100) + 1;

    // Check for level up
    if (newLevel > oldLevel) {
      notifyAchievement('level_up', { newLevel, oldLevel });
      soundManager.playLevelUp();
      setShowLevelUp(true);
      setShowConfetti(true);
    }

    dispatch(checkBadges());
    dispatch(persistGamificationData());
  }, [dispatch, enableGamification, xp, notifyAchievement]);

  /**
    * Update special streaks (taskStreak, kanbanStreak)
    * @param {object} streaks - Object containing streak updates
    */
  const updateStreaks = useCallback((streaks) => {
    if (!enableGamification) {
      return;
    }

    dispatch(updateSpecialStreaks(streaks));
    
    // Check for streak milestones
    const streakValues = Object.values(streaks);
    streakValues.forEach(streak => {
      if (streak > 0 && streak % 7 === 0) { // Every 7 days
        notifyAchievement('streak_milestone', { streak });
        soundManager.playStreakMilestone();
        setShowConfetti(true);
      }
    });

    dispatch(checkBadges());
    dispatch(persistGamificationData());
  }, [dispatch, enableGamification, notifyAchievement]);

  /**
    * Award a badge to the user and show notification
    * @param {object} badge - Badge object with id, name, and description
    */
  const manuallyAwardBadge = useCallback((badge) => {
    if (!enableGamification) {
      return;
    }
    
    dispatch(awardBadge(badge));
    notifyAchievement('badge_earned', badge);
    dispatch(persistGamificationData());
  }, [dispatch, enableGamification, notifyAchievement]);

  /**
    * Get current level based on XP
    * Each level requires 100 XP
    * @returns {number} Current level
    */
  const getLevel = useCallback(() => {
    return Math.floor(xp / 100) + 1;
  }, [xp]);

/**
     * Get XP progress towards next level
     * @returns {object} Object with current XP, XP needed for next level, and percentage
     */
  const getLevelProgress = useCallback(() => {
    const currentLevel = getLevel();
    const xpForCurrentLevel = (currentLevel - 1) * 100;
    const xpForNextLevel = currentLevel * 100;
    const xpInCurrentLevel = xp - xpForCurrentLevel;
    const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
    
    // Guard against division by zero (edge case at max level)
    const progressPercent = xpNeededForNext === 0 ? 100 : Math.round((xpInCurrentLevel / xpNeededForNext) * 100);
    
    return {
      currentLevel,
      xpInCurrentLevel,
      xpNeededForNext,
      progressPercent,
      xpToNextLevel: xpForNextLevel - xp,
    };
  }, [xp, getLevel]);

  /**
    * Check if user has earned a specific badge
    * @param {string} badgeId - The badge ID to check
    * @returns {boolean} True if badge is earned
    */
  const hasBadge = useCallback((badgeId) => {
    return badges.some(badge => badge.id === badgeId);
  }, [badges]);

  /**
    * Get count of earned badges
    * @returns {number} Number of earned badges
    */
  const getBadgeCount = useCallback(() => {
    return badges.length;
  }, [badges]);

  /**
    * Get all earned badges
    * @returns {Array} Array of earned badge objects
    */
  const getEarnedBadges = useCallback(() => {
    return badges;
  }, [badges]);

  
  /**
    * Get gamification summary for display
    * @returns {object} Summary object with all relevant stats
    */
  const getGamificationSummary = useCallback(() => {
    const levelProgress = getLevelProgress();
    
    return {
      points,
      level: levelProgress.currentLevel,
      xp,
      badges: badges.length,
      currentStreak,
      specialStreaks,
      stats,
      levelProgress: levelProgress.progressPercent,
      xpToNextLevel: levelProgress.xpToNextLevel,
      totalBadgesAvailable: 33, // Total badges in the system
    };
  }, [points, xp, badges, currentStreak, specialStreaks, stats, getLevelProgress]);

  return {
    // State
    points,
    level,
    xp,
    badges,
    currentStreak,
    specialStreaks,
    stats,
    lastActivityDate,
    enableGamification,

    // Animation states
    showLevelUp,
    showBadgeEarned,
    showConfetti,
    newBadge,
    setShowLevelUp,
    setShowBadgeEarned,
    setShowConfetti,

    // Actions
    awardPoints,
    addExperiencePoints,
    updateStreaks,
    manuallyAwardBadge,
    notifyAchievement,

    // Helper functions
    getLevel,
    getLevelProgress,
    hasBadge,
    getBadgeCount,
    getEarnedBadges,
    getGamificationSummary,
  };
};

export default useGamification;