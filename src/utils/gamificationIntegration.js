/**
 * Gamification integration utilities
 * Ensures gamification works perfectly across all features
 */

import { saveToStorage, loadFromStorage, STORAGE_KEYS_ENUM } from './persistence';

/**
 * Gamification trigger types
 */
const GAMIFICATION_TRIGGERS = {
  NOTE_CREATED: 'note_created',
  NOTE_UPDATED: 'note_updated',
  NOTE_DELETED: 'note_deleted',
  NOTE_ARCHIVED: 'note_archived',
  TAG_CREATED: 'tag_created',
  TAG_USED: 'tag_used',
  TASK_COMPLETED: 'task_completed',
  REMINDER_SET: 'reminder_set',
  REMINDER_COMPLETED: 'reminder_completed',
  STREAK_MILESTONE: 'streak_milestone',
  LEVEL_UP: 'level_up',
  BADGE_EARNED: 'badge_earned',
  GOAL_ACHIEVED: 'goal_achieved',
  FIRST_DAILY_NOTE: 'first_daily_note',
  WEEKLY_GOAL: 'weekly_goal',
  MONTHLY_GOAL: 'monthly_goal',
};

/**
 * Point values for different actions
 */
const POINT_VALUES = {
  [GAMIFICATION_TRIGGERS.NOTE_CREATED]: 10,
  [GAMIFICATION_TRIGGERS.NOTE_UPDATED]: 5,
  [GAMIFICATION_TRIGGERS.NOTE_DELETED]: 2,
  [GAMIFICATION_TRIGGERS.NOTE_ARCHIVED]: 3,
  [GAMIFICATION_TRIGGERS.TAG_CREATED]: 5,
  [GAMIFICATION_TRIGGERS.TAG_USED]: 2,
  [GAMIFICATION_TRIGGERS.TASK_COMPLETED]: 15,
  [GAMIFICATION_TRIGGERS.REMINDER_SET]: 3,
  [GAMIFICATION_TRIGGERS.REMINDER_COMPLETED]: 10,
  [GAMIFICATION_TRIGGERS.FIRST_DAILY_NOTE]: 20,
  [GAMIFICATION_TRIGGERS.WEEKLY_GOAL]: 50,
  [GAMIFICATION_TRIGGERS.MONTHLY_GOAL]: 100,
};

/**
 * Badge definitions
 */
const BADGE_DEFINITIONS = {
  first_note: {
    id: 'first_note',
    name: 'First Steps',
    description: 'Created your first note',
    icon: '📝',
    condition: { trigger: GAMIFICATION_TRIGGERS.NOTE_CREATED, count: 1 },
  },
  note_collector: {
    id: 'note_collector',
    name: 'Note Collector',
    description: 'Created 10 notes',
    icon: '📚',
    condition: { trigger: GAMIFICATION_TRIGGERS.NOTE_CREATED, count: 10 },
  },
  note_master: {
    id: 'note_master',
    name: 'Note Master',
    description: 'Created 100 notes',
    icon: '👑',
    condition: { trigger: GAMIFICATION_TRIGGERS.NOTE_CREATED, count: 100 },
  },
  task_master: {
    id: 'task_master',
    name: 'Task Master',
    description: 'Completed 50 tasks',
    icon: '✅',
    condition: { trigger: GAMIFICATION_TRIGGERS.TASK_COMPLETED, count: 50 },
  },
  organized: {
    id: 'organized',
    name: 'Organized',
    description: 'Used 10 different tags',
    icon: '🏷️',
    condition: { trigger: GAMIFICATION_TRIGGERS.TAG_USED, unique: true, count: 10 },
  },
  streak_starter: {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Maintained a 7-day streak',
    icon: '🔥',
    condition: { trigger: GAMIFICATION_TRIGGERS.STREAK_MILESTONE, streak: 7 },
  },
  streak_keeper: {
    id: 'streak_keeper',
    name: 'Streak Keeper',
    description: 'Maintained a 30-day streak',
    icon: '💪',
    condition: { trigger: GAMIFICATION_TRIGGERS.STREAK_MILESTONE, streak: 30 },
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Created a note before 8 AM',
    icon: '🌅',
    condition: { trigger: GAMIFICATION_TRIGGERS.NOTE_CREATED, timeBefore: '08:00' },
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Created a note after 10 PM',
    icon: '🌙',
    condition: { trigger: GAMIFICATION_TRIGGERS.NOTE_CREATED, timeAfter: '22:00' },
  },
  productive_day: {
    id: 'productive_day',
    name: 'Productive Day',
    description: 'Completed 10 tasks in one day',
    icon: '🎯',
    condition: { trigger: GAMIFICATION_TRIGGERS.TASK_COMPLETED, daily: true, count: 10 },
  },
};

/**
 * Gamification integration manager
 */
export class GamificationIntegrationManager {
  constructor() {
    this.triggerCounts = new Map();
    this.badgeProgress = new Map();
    this.recentTriggers = new Map(); // Prevent double-awarding
    this.isInitialized = false;
    this.eventQueue = [];
    this.processingQueue = false;
  }

  /**
   * Initialize gamification integration
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load current state
      await this.loadCurrentState();
      
      // Validate current data
      await this.validateCurrentState();
      
      // Start processing queued events
      this.startProcessingQueue();
      
      this.isInitialized = true;
      console.log('Gamification integration initialized');
    } catch (error) {
      console.error('Failed to initialize gamification integration:', error);
    }
  }

  /**
   * Load current gamification state
   */
  async loadCurrentState() {
    const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
    
    if (gamification) {
      // Validate data integrity
      this.validateGamificationData(gamification);
      
      // Initialize trigger counts
      this.initializeTriggerCounts(gamification);
    }
  }

  /**
   * Validate gamification data integrity
   */
  validateGamificationData(data) {
    const errors = [];

    if (data.points < 0) {
      errors.push('Negative points detected');
      data.points = 0;
    }

    if (data.level < 1) {
      errors.push('Invalid level detected');
      data.level = 1;
    }

    if (data.xp < 0) {
      errors.push('Negative XP detected');
      data.xp = 0;
    }

    if (data.currentStreak < 0) {
      errors.push('Negative streak detected');
      data.currentStreak = 0;
    }

    if (data.bestStreak < data.currentStreak) {
      errors.push('Best streak less than current streak');
      data.bestStreak = data.currentStreak;
    }

    // Validate badges
    if (data.badges && Array.isArray(data.badges)) {
      const uniqueBadges = new Set();
      data.badges = data.badges.filter(badge => {
        if (!badge || !badge.id) return false;
        
        if (uniqueBadges.has(badge.id)) {
          errors.push(`Duplicate badge: ${badge.id}`);
          return false;
        }
        
        uniqueBadges.add(badge.id);
        return true;
      });
    }

    if (errors.length > 0) {
      console.warn('Gamification data validation issues:', errors);
      // Save corrected data
      saveToStorage(STORAGE_KEYS_ENUM.GAMIFICATION, data);
    }
  }

  /**
   * Initialize trigger counts from existing data
   */
  initializeTriggerCounts(gamification) {
    // Initialize counters based on current state
    this.triggerCounts.set(GAMIFICATION_TRIGGERS.NOTE_CREATED, gamification.stats?.notesCreated || 0);
    this.triggerCounts.set(GAMIFICATION_TRIGGERS.TASK_COMPLETED, gamification.stats?.tasksCompleted || 0);
    this.triggerCounts.set(GAMIFICATION_TRIGGERS.TAG_CREATED, gamification.stats?.tagsCreated || 0);
  }

  /**
   * Trigger gamification event
   */
  async triggerEvent(triggerType, context = {}) {
    if (!this.isInitialized) {
      this.eventQueue.push({ triggerType, context, timestamp: Date.now() });
      return;
    }

    try {
      // Prevent double-awarding
      const eventKey = this.createEventKey(triggerType, context);
      if (this.isRecentlyTriggered(eventKey)) {
        return;
      }

      // Get settings to check if gamification is enabled
      const settings = await loadFromStorage(STORAGE_KEYS_ENUM.SETTINGS);
      if (!settings?.gamificationEnabled) {
        return;
      }

      // Process the trigger
      const result = await this.processTrigger(triggerType, context);
      
      if (result.success) {
        this.markAsTriggered(eventKey);
        
        // Show notifications for significant events
        if (result.pointsAwarded > 0 || result.badgesEarned.length > 0) {
          this.showGamificationNotification(result);
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to trigger gamification event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process a specific trigger
   */
  async processTrigger(triggerType, context) {
    const result = {
      success: true,
      triggerType,
      pointsAwarded: 0,
      badgesEarned: [],
      levelUp: false,
      streakUpdate: null,
    };

    try {
      // Award points
      const points = await this.awardPoints(triggerType, context);
      result.pointsAwarded = points;

      // Check for badges
      const badges = await this.checkForBadges(triggerType, context);
      result.badgesEarned = badges;

      // Check for level up
      const levelUp = await this.checkForLevelUp();
      result.levelUp = levelUp;

      // Update streaks if applicable
      const streakUpdate = await this.updateStreaks(triggerType, context);
      result.streakUpdate = streakUpdate;

      // Update trigger counts
      this.updateTriggerCount(triggerType);

      // Audit log the event
      this.auditGamificationEvent(triggerType, context, result);

      return result;
    } catch (error) {
      result.success = false;
      result.error = error.message;
      return result;
    }
  }

  /**
   * Award points for trigger
   */
  async awardPoints(triggerType, context) {
    const basePoints = POINT_VALUES[triggerType] || 0;
    
    if (basePoints === 0) return 0;

    // Apply multipliers
    let multiplier = 1;
    
    // Streak multiplier
    const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
    if (gamification.currentStreak > 0) {
      multiplier += Math.min(gamification.currentStreak * 0.01, 0.5); // Max 50% bonus
    }

    // Time-based multipliers
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) {
      multiplier += 0.2; // Morning bonus
    }

    const points = Math.round(basePoints * multiplier);
    
    // Update gamification data
    gamification.points += points;
    gamification.xp += points;
    
    await saveToStorage(STORAGE_KEYS_ENUM.GAMIFICATION, gamification);
    
    return points;
  }

  /**
   * Check for badge eligibility
   */
  async checkForBadges(triggerType, context) {
    const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
    const earnedBadges = [];

    // Check each badge definition
    for (const [badgeId, badgeDef] of Object.entries(BADGE_DEFINITIONS)) {
      // Skip if already earned
      if (gamification.badges?.some(b => b.id === badgeId)) {
        continue;
      }

      // Check if conditions are met
      if (await this.isBadgeEligible(badgeDef, triggerType, context)) {
        await this.awardBadge(badgeId, badgeDef);
        earnedBadges.push(badgeDef);
      }
    }

    return earnedBadges;
  }

  /**
   * Check if badge conditions are met
   */
  async isBadgeEligible(badgeDef, triggerType, context) {
    const condition = badgeDef.condition;

    // Trigger type match
    if (condition.trigger && condition.trigger !== triggerType) {
      return false;
    }

    // Count-based badges
    if (condition.count) {
      const count = this.getTriggerCount(triggerType, condition);
      return count >= condition.count;
    }

    // Streak-based badges
    if (condition.streak) {
      const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
      return gamification.currentStreak >= condition.streak;
    }

    // Time-based badges
    if (condition.timeBefore || condition.timeAfter) {
      const now = new Date();
      const currentHour = `${now.getHours().toString().padStart(2, '0')}:00`;
      
      if (condition.timeBefore && currentHour >= condition.timeBefore) {
        return false;
      }
      
      if (condition.timeAfter && currentHour <= condition.timeAfter) {
        return false;
      }
      
      return true;
    }

    // Daily count badges
    if (condition.daily && condition.count) {
      return this.getDailyTriggerCount(triggerType) >= condition.count;
    }

    return false;
  }

  /**
   * Award badge to user
   */
  async awardBadge(badgeId, badgeDef) {
    const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
    
    if (!gamification.badges) {
      gamification.badges = [];
    }

    const badge = {
      ...badgeDef,
      earnedAt: new Date().toISOString(),
    };

    gamification.badges.push(badge);
    
    // Award bonus points for badge
    gamification.points += 25;
    gamification.xp += 25;
    
    await saveToStorage(STORAGE_KEYS_ENUM.GAMIFICATION, gamification);
    
    console.log(`Badge earned: ${badgeDef.name}`);
  }

  /**
   * Check for level up
   */
  async checkForLevelUp() {
    const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
    const currentLevel = gamification.level;
    const newLevel = Math.floor(gamification.xp / 100) + 1;
    
    if (newLevel > currentLevel) {
      gamification.level = newLevel;
      await saveToStorage(STORAGE_KEYS_ENUM.GAMIFICATION, gamification);
      return true;
    }
    
    return false;
  }

  /**
   * Update streaks
   */
  async updateStreaks(triggerType, context) {
    const update = {
      currentStreak: null,
      bestStreak: null,
      specialStreaks: {},
    };

    // Only certain triggers affect streaks
    if (![GAMIFICATION_TRIGGERS.NOTE_CREATED, GAMIFICATION_TRIGGERS.TASK_COMPLETED].includes(triggerType)) {
      return update;
    }

    const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
    const today = new Date().toDateString();
    const lastActivity = gamification.lastActivityDate ? new Date(gamification.lastActivityDate).toDateString() : null;

    if (lastActivity !== today) {
      // Check if streak continues
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      
      if (lastActivity === yesterday || !lastActivity) {
        // Streak continues
        gamification.currentStreak = (gamification.currentStreak || 0) + 1;
      } else {
        // Streak broken
        gamification.currentStreak = 1;
      }
    }

    // Update best streak
    if (gamification.currentStreak > (gamification.bestStreak || 0)) {
      gamification.bestStreak = gamification.currentStreak;
    }

    // Update last activity date
    gamification.lastActivityDate = new Date().toISOString();

    await saveToStorage(STORAGE_KEYS_ENUM.GAMIFICATION, gamification);

    update.currentStreak = gamification.currentStreak;
    update.bestStreak = gamification.bestStreak;

    return update;
  }

  /**
   * Get trigger count
   */
  getTriggerCount(triggerType, condition) {
    const count = this.triggerCounts.get(triggerType) || 0;
    
    if (condition.unique) {
      // For unique items, this would need to track unique values
      return count; // Simplified for now
    }
    
    return count;
  }

  /**
   * Get daily trigger count
   */
  getDailyTriggerCount(triggerType) {
    // This would need to be tracked separately
    // Simplified implementation
    const today = new Date().toDateString();
    const dailyKey = `${triggerType}_${today}`;
    return this.triggerCounts.get(dailyKey) || 0;
  }

  /**
   * Update trigger count
   */
  updateTriggerCount(triggerType) {
    const current = this.triggerCounts.get(triggerType) || 0;
    this.triggerCounts.set(triggerType, current + 1);
  }

  /**
   * Create event key for deduplication
   */
  createEventKey(triggerType, context) {
    const parts = [triggerType];
    
    if (context.noteId) parts.push(context.noteId);
    if (context.taskId) parts.push(context.taskId);
    if (context.tagId) parts.push(context.tagId);
    if (context.reminderId) parts.push(context.reminderId);
    
    return parts.join('_');
  }

  /**
   * Check if event was recently triggered
   */
  isRecentlyTriggered(eventKey) {
    const lastTriggered = this.recentTriggers.get(eventKey);
    if (!lastTriggered) return false;
    
    const now = Date.now();
    const timeSince = now - lastTriggered;
    
    // Prevent double-awarding within 1 minute
    return timeSince < 60000;
  }

  /**
   * Mark event as triggered
   */
  markAsTriggered(eventKey) {
    this.recentTriggers.set(eventKey, Date.now());
    
    // Clean up old entries (older than 5 minutes)
    const cutoff = Date.now() - 300000;
    for (const [key, timestamp] of this.recentTriggers.entries()) {
      if (timestamp < cutoff) {
        this.recentTriggers.delete(key);
      }
    }
  }

  /**
   * Show gamification notification
   */
  showGamificationNotification(result) {
    let message = '';
    
    if (result.badgesEarned.length > 0) {
      const badgeNames = result.badgesEarned.map(b => b.name).join(', ');
      message = `🎉 Badge${result.badgesEarned.length > 1 ? 's' : ''} earned: ${badgeNames}!`;
    }
    
    if (result.pointsAwarded > 0) {
      if (message) message += ' ';
      message += `+${result.pointsAwarded} points`;
    }
    
    if (result.levelUp) {
      if (message) message += ' ';
      message += '🎊 Level up!';
    }

    if (message && window.showToast) {
      window.showToast({
        type: 'success',
        title: 'Achievement Unlocked!',
        message,
        duration: 3000,
      });
    }
  }

  /**
   * Audit gamification event
   */
  auditGamificationEvent(triggerType, context, result) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      triggerType,
      context: {
        ...context,
        // Remove sensitive data
        noteContent: undefined,
        userId: undefined,
      },
      result: {
        pointsAwarded: result.pointsAwarded,
        badgesEarned: result.badgesEarned.map(b => b.id),
        levelUp: result.levelUp,
        streakUpdate: result.streakUpdate,
      },
    };

    // Store audit log (in production, this would go to a secure backend)
    const auditLog = JSON.parse(localStorage.getItem('gamification_audit_log') || '[]');
    auditLog.push(auditEntry);
    
    // Keep only last 1000 entries
    if (auditLog.length > 1000) {
      auditLog.splice(0, auditLog.length - 1000);
    }
    
    localStorage.setItem('gamification_audit_log', JSON.stringify(auditLog));
  }

  /**
   * Start processing queued events
   */
  startProcessingQueue() {
    if (this.processingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.processingQueue = true;
    
    const processNext = async () => {
      if (this.eventQueue.length === 0) {
        this.processingQueue = false;
        return;
      }

      const event = this.eventQueue.shift();
      try {
        await this.triggerEvent(event.triggerType, event.context);
      } catch (error) {
        console.error('Failed to process queued event:', error);
      }
      
      // Process next event
      setTimeout(processNext, 100);
    };

    processNext();
  }

  /**
   * Validate cross-feature gamification consistency
   */
  async validateGamificationIntegration() {
    const issues = [];
    
    try {
      // Check that XP and points are consistent
      const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
      
      const expectedLevel = Math.floor(gamification.xp / 100) + 1;
      if (gamification.level !== expectedLevel) {
        issues.push({
          type: 'inconsistency',
          message: `Level ${gamification.level} doesn't match XP ${gamification.xp}`,
          severity: 'medium',
        });
      }

      // Check for duplicate badges
      if (gamification.badges) {
        const badgeIds = gamification.badges.map(b => b.id);
        const duplicates = badgeIds.filter((id, index) => badgeIds.indexOf(id) !== index);
        if (duplicates.length > 0) {
          issues.push({
            type: 'duplicate',
            message: `Duplicate badges found: ${duplicates.join(', ')}`,
            severity: 'high',
          });
        }
      }

      // Check streak consistency
      if (gamification.currentStreak > gamification.bestStreak) {
        issues.push({
          type: 'inconsistency',
          message: 'Current streak exceeds best streak',
          severity: 'medium',
        });
      }

      // Check for orphaned special streaks
      if (gamification.specialStreaks) {
        Object.entries(gamification.specialStreaks).forEach(([type, streak]) => {
          if (streak < 0) {
            issues.push({
              type: 'invalid',
              message: `Negative ${type} streak: ${streak}`,
              severity: 'low',
            });
          }
        });
      }

    } catch (error) {
      issues.push({
        type: 'error',
        message: `Validation failed: ${error.message}`,
        severity: 'high',
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get gamification analytics
   */
  async getGamificationAnalytics() {
    const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
    const auditLog = JSON.parse(localStorage.getItem('gamification_audit_log') || '[]');
    
    return {
      overview: {
        totalPoints: gamification.points,
        currentLevel: gamification.level,
        currentXP: gamification.xp,
        currentStreak: gamification.currentStreak,
        bestStreak: gamification.bestStreak,
        totalBadges: gamification.badges?.length || 0,
      },
      recentActivity: auditLog.slice(-10),
      triggerBreakdown: this.getTriggerBreakdown(auditLog),
      badgeProgress: this.getBadgeProgress(),
    };
  }

  /**
   * Get trigger breakdown from audit log
   */
  getTriggerBreakdown(auditLog) {
    const breakdown = {};
    
    auditLog.forEach(entry => {
      const trigger = entry.triggerType;
      breakdown[trigger] = (breakdown[trigger] || 0) + 1;
    });
    
    return breakdown;
  }

  /**
   * Get badge progress for unearned badges
   */
  getBadgeProgress() {
    const progress = {};
    
    Object.entries(BADGE_DEFINITIONS).forEach(([badgeId, badgeDef]) => {
      const condition = badgeDef.condition;
      let current = 0;
      let required = 0;
      
      if (condition.count) {
        current = this.getTriggerCount(condition.trigger, condition);
        required = condition.count;
      } else if (condition.streak) {
        // Would need current gamification data
        required = condition.streak;
      }
      
      progress[badgeId] = {
        name: badgeDef.name,
        description: badgeDef.description,
        current,
        required,
        percentage: required > 0 ? Math.min(100, (current / required) * 100) : 0,
        earned: false, // Would check against current badges
      };
    });
    
    return progress;
  }
}

// Create singleton instance
export const gamificationIntegration = new GamificationIntegrationManager();

/**
 * Convenience function to trigger gamification events
 */
export function triggerGamification(triggerType, context = {}) {
  return gamificationIntegration.triggerEvent(triggerType, context);
}

/**
 * Initialize gamification integration
 */
export function initializeGamification() {
  return gamificationIntegration.initialize();
}

/**
 * Validate gamification integration
 */
export function validateGamification() {
  return gamificationIntegration.validateGamificationIntegration();
}

/**
 * Get gamification analytics
 */
export function getGamificationAnalytics() {
  return gamificationIntegration.getGamificationAnalytics();
}