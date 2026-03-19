import conf from '../conf/conf.js';
import { Client, Databases, Query, Permission, Role } from 'appwrite';

/**
 * Appwrite service for managing user notifications
 * Handles notification creation, fetching, and preferences
 */
export class NotificationsService {
  client = new Client();
  databases;

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);
    this.databases = new Databases(this.client);
  }

  /**
   * Check if an error is retryable
   * @param {Error} error - The error to check
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(error) {
    const retryableCodes = ['network_error', 'timeout', 'rate_limit_exceeded'];
    const retryableMessages = ['network', 'timeout', 'rate limit', 'try again'];
    
    return retryableCodes.includes(error.code) ||
           retryableMessages.some(msg => error.message?.toLowerCase().includes(msg));
  }

  /**
   * Retry a function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise} Result of the function
   */
  async retryWithBackoff(fn, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          break;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Create a new notification for a user
   * @param {string} userId - The user's ID
   * @param {object} notification - Notification object with type, title, message
   * @returns {object|null} The created notification or null on error
   */
  async createNotification(userId, notification) {
    try {
      const { type, title, message, metadata } = notification;

      // Input validation
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId: must be a non-empty string');
      }
      if (!type || typeof type !== 'string') {
        throw new Error('Invalid type: must be a non-empty string');
      }
      if (!title || typeof title !== 'string') {
        throw new Error('Invalid title: must be a non-empty string');
      }
      if (!message || typeof message !== 'string') {
        throw new Error('Invalid message: must be a non-empty string');
      }

      const validTypes = ['goal_achieved', 'streak_milestone', 'badge_earned', 'streak_broken', 'activity', 'level_up'];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid type: must be one of ${validTypes.join(', ')}`);
      }

      return await this.retryWithBackoff(async () => {
        return await this.databases.createDocument(
          conf.appwriteDatabaseId,
          conf.appwriteCollectionIdNotifications,
          'unique()',
          {
            userId,
            type, // 'goal_achieved', 'streak_milestone', 'badge_earned', 'streak_broken'
            title,
            message,
            read: false,
            createdAt: new Date().toISOString(),
            metadata: metadata || null,
          },
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ]
        );
      });
    } catch (error) {
      console.error('Appwrite service :: createNotification :: error', error);
      return {
        error: {
          code: 'CREATE_NOTIFICATION_FAILED',
          message: error.message || 'Failed to create notification',
          retryable: this.isRetryableError(error),
        }
      };
    }
  }

  /**
   * Fetch notifications for a user
   * @param {string} userId - The user's ID
   * @param {object} options - Options for filtering and pagination
   * @returns {Array} Array of notifications or empty array on error
   */
  async getNotifications(userId, options = {}) {
    try {
      const { limit = 50, unreadOnly = false, type = null } = options;
      
      const queries = [
        Query.equal('userId', userId),
        Query.orderDesc('createdAt'),
        Query.limit(limit),
      ];

      if (unreadOnly) {
        queries.push(Query.equal('read', false));
      }

      if (type) {
        queries.push(Query.equal('type', type));
      }

      const result = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdNotifications,
        queries
      );

      return result.documents || [];
    } catch (error) {
      console.error('Appwrite service :: getNotifications :: error', error);
      return [];
    }
  }

  /**
   * Get a single notification by ID
   * @param {string} notificationId - The notification's ID
   * @returns {object|null} The notification object or null on error
   */
  async getNotificationById(notificationId) {
    try {
      return await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdNotifications,
        notificationId
      );
    } catch (error) {
      console.error('Appwrite service :: getNotificationById :: error', error);
      return null;
    }
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - The notification's ID
   * @returns {object|null} The updated notification or null on error
   */
  async markAsRead(notificationId) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdNotifications,
        notificationId,
        {
          read: true,
        }
      );
    } catch (error) {
      console.error('Appwrite service :: markAsRead :: error', error);
      return null;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - The user's ID
   * @returns {boolean} True if successful, false otherwise
   */
  async markAllAsRead(userId) {
    try {
      const unreadNotifications = await this.getNotifications(userId, { unreadOnly: true });
      
      for (const notification of unreadNotifications) {
        await this.markAsRead(notification.$id);
      }

      return true;
    } catch (error) {
      console.error('Appwrite service :: markAllAsRead :: error', error);
      return false;
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - The notification's ID
   * @returns {boolean} True if successful, false otherwise
   */
  async deleteNotification(notificationId) {
    try {
      await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdNotifications,
        notificationId
      );
      return true;
    } catch (error) {
      console.error('Appwrite service :: deleteNotification :: error', error);
      return false;
    }
  }

  /**
   * Delete all notifications for a user
   * @param {string} userId - The user's ID
   * @returns {boolean} True if successful, false otherwise
   */
  async deleteAllNotifications(userId) {
    try {
      const notifications = await this.getNotifications(userId, { limit: 1000 });
      
      for (const notification of notifications) {
        await this.deleteNotification(notification.$id);
      }

      return true;
    } catch (error) {
      console.error('Appwrite service :: deleteAllNotifications :: error', error);
      return false;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - The user's ID
   * @returns {number} Number of unread notifications
   */
  async getUnreadCount(userId) {
    try {
      const result = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdNotifications,
        [
          Query.equal('userId', userId),
          Query.equal('read', false),
          Query.limit(1), // We only need to know if there are any
        ]
      );

      // If we get any results, there are unread notifications
      return result.documents.length > 0 ? result.total : 0;
    } catch (error) {
      console.error('Appwrite service :: getUnreadCount :: error', error);
      return 0;
    }
  }

  /**
   * Update notification preferences for a user
   * @param {string} userId - The user's ID
   * @param {object} preferences - Object containing preference updates
   * @returns {object|null} The updated preferences document or null on error
   */
  async updatePreferences(userId, preferences) {
    try {
      // Check if preferences document exists
      const existingPrefs = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdPreferences,
        [Query.equal('userId', userId)]
      );

      const prefsData = {
        userId,
        ...preferences,
        updatedAt: new Date().toISOString(),
      };

      if (existingPrefs.documents.length > 0) {
        // Update existing preferences
        return await this.databases.updateDocument(
          conf.appwriteDatabaseId,
          conf.appwriteCollectionIdPreferences,
          existingPrefs.documents[0].$id,
          prefsData
        );
      } else {
        // Create new preferences document
        return await this.databases.createDocument(
          conf.appwriteDatabaseId,
          conf.appwriteCollectionIdPreferences,
          'unique()',
          {
            ...prefsData,
            createdAt: new Date().toISOString(),
          },
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
          ]
        );
      }
    } catch (error) {
      console.error('Appwrite service :: updatePreferences :: error', error);
      return null;
    }
  }

  /**
   * Get notification preferences for a user
   * @param {string} userId - The user's ID
   * @returns {object} Preferences object with default values
   */
  async getPreferences(userId) {
    try {
      const result = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdPreferences,
        [Query.equal('userId', userId)]
      );

      if (result.documents.length > 0) {
        return result.documents[0];
      }

      // Return default preferences
      return {
        enableBrowserNotifications: false,
        enableToastNotifications: true,
        enableGoalNotifications: true,
        enableStreakNotifications: true,
        enableBadgeNotifications: true,
      };
    } catch (error) {
      console.error('Appwrite service :: getPreferences :: error', error);
      return {
        enableBrowserNotifications: false,
        enableToastNotifications: true,
        enableGoalNotifications: true,
        enableStreakNotifications: true,
        enableBadgeNotifications: true,
      };
    }
  }

  /**
   * Create notification helper methods for common notification types
   */

  /**
   * Create a goal achieved notification
   * @param {string} userId - The user's ID
   * @param {object} goal - The completed goal object
   * @returns {object|null} The created notification or null on error
   */
  async notifyGoalAchieved(userId, goal) {
    return this.createNotification(userId, {
      type: 'goal_achieved',
      title: 'Goal Achieved! 🎯',
      message: `You completed your ${goal.type} goal: ${goal.category.replace('_', ' ')}!`,
      metadata: { goalId: goal.$id, goalType: goal.type },
    });
  }

  /**
   * Create a streak milestone notification
   * @param {string} userId - The user's ID
   * @param {number} streak - The new streak count
   * @returns {object|null} The created notification or null on error
   */
  async notifyStreakMilestone(userId, streak) {
    return this.createNotification(userId, {
      type: 'streak_milestone',
      title: 'Streak Milestone! 🔥',
      message: `Amazing! You've maintained a ${streak} day streak!`,
      metadata: { streak },
    });
  }

  /**
   * Create a badge earned notification
   * @param {string} userId - The user's ID
   * @param {object} badge - The earned badge object
   * @returns {object|null} The created notification or null on error
   */
  async notifyBadgeEarned(userId, badge) {
    return this.createNotification(userId, {
      type: 'badge_earned',
      title: 'New Badge Earned! 🏆',
      message: `Congratulations! You've earned the "${badge.name}" badge!`,
      metadata: { badgeId: badge.id, badgeName: badge.name },
    });
  }

  /**
   * Create a streak broken notification
   * @param {string} userId - The user's ID
   * @param {number} previousStreak - The streak that was broken
   * @returns {object|null} The created notification or null on error
   */
  async notifyStreakBroken(userId, previousStreak) {
    return this.createNotification(userId, {
      type: 'streak_broken',
      title: 'Streak Broken 💔',
      message: `Your ${previousStreak} day streak has ended. Start a new one today!`,
      metadata: { previousStreak },
    });
  }
}

const notificationsService = new NotificationsService();
export default notificationsService;
