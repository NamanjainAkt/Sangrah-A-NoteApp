import conf from '../conf/conf.js';
import { Client, Databases, Query, Permission, Role } from 'appwrite';

/**
 * Appwrite service for activity tracking and logging
 * Handles activity logs, heatmap data, and analytics
 */
export class ActivityService {
  client = new Client();
  databases;

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);
    this.databases = new Databases(this.client);
  }

  /**
   * Create or update an activity log for a user on a specific date
   * @param {string} userId - The user's ID
   * @param {string} date - The date in 'yyyy-MM-dd' format
   * @param {object} activities - Object containing activity counts
   * @returns {object|null} The created/updated activity log or null on error
   */
  async createActivityLog(userId, date, activities) {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId: must be a non-empty string');
      }
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('Invalid date: must be in yyyy-MM-dd format');
      }
      if (!activities || typeof activities !== 'object') {
        throw new Error('Invalid activities: must be an object');
      }

      // Validate activity counts are non-negative numbers
      const activityFields = ['notesCreated', 'tasksCompleted', 'kanbanMoves', 'streakDays'];
      for (const field of activityFields) {
        if (activities[field] !== undefined) {
          if (typeof activities[field] !== 'number' || activities[field] < 0) {
            throw new Error(`Invalid ${field}: must be a non-negative number`);
          }
        }
      }

      // Check if an activity log already exists for this date
      const existingLogs = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdActivity,
        [
          Query.equal('userId', userId),
          Query.equal('date', date),
        ]
      );

      if (existingLogs.documents.length > 0) {
        // Update existing log
        const existingDoc = existingLogs.documents[0];
        return await this.updateActivityLog(existingDoc.$id, activities);
      }

      // Create new activity log
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdActivity,
        'unique()', // Using 'unique()' for ID generation
        {
          userId,
          date,
          ...activities,
          totalActivity: this.calculateTotalActivity(activities),
        },
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );
    } catch (error) {
      console.error('Appwrite service :: createActivityLog :: error', error);
      // Return structured error object
      return {
        error: {
          code: 'CREATE_ACTIVITY_LOG_FAILED',
          message: error.message || 'Failed to create activity log',
          retryable: this.isRetryableError(error),
        }
      };
    }
  }

  /**
   * Update an existing activity log
   * @param {string} logId - The activity log ID
   * @param {object} activities - Object containing activity updates
   * @returns {object|null} The updated activity log or null on error
   */
  async updateActivityLog(logId, activities) {
    try {
      // First get the existing document to merge activities
      const existingLog = await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdActivity,
        logId
      );

      const updatedActivities = {
        notesCreated: (existingLog.notesCreated || 0) + (activities.notesCreated || 0),
        tasksCompleted: (existingLog.tasksCompleted || 0) + (activities.tasksCompleted || 0),
        kanbanMoves: (existingLog.kanbanMoves || 0) + (activities.kanbanMoves || 0),
        streakDays: (existingLog.streakDays || 0) + (activities.streakDays || 0),
      };

      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdActivity,
        logId,
        {
          ...updatedActivities,
          totalActivity: this.calculateTotalActivity(updatedActivities),
        }
      );
    } catch (error) {
      console.error('Appwrite service :: updateActivityLog :: error', error);
      return null;
    }
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
   * Fetch activity logs for a user within a date range
   * @param {string} userId - The user's ID
   * @param {string} startDate - Start date in 'yyyy-MM-dd' format
   * @param {string} endDate - End date in 'yyyy-MM-dd' format
   * @returns {Array|object} Array of activity logs or error object on error
   */
  async getActivityLogs(userId, startDate, endDate) {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId: must be a non-empty string');
      }
      if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        throw new Error('Invalid startDate: must be in yyyy-MM-dd format');
      }
      if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new Error('Invalid endDate: must be in yyyy-MM-dd format');
      }
      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('startDate must be before or equal to endDate');
      }

      const result = await this.retryWithBackoff(async () => {
        return await this.databases.listDocuments(
          conf.appwriteDatabaseId,
          conf.appwriteCollectionIdActivity,
          [
            Query.equal('userId', userId),
            Query.greaterThanEqual('date', startDate),
            Query.lessThanEqual('date', endDate),
            Query.orderAsc('date'),
          ]
        );
      });

      return result.documents || [];
    } catch (error) {
      console.error('Appwrite service :: getActivityLogs :: error', error);
      return {
        error: {
          code: 'GET_ACTIVITY_LOGS_FAILED',
          message: error.message || 'Failed to fetch activity logs',
          retryable: this.isRetryableError(error),
        }
      };
    }
  }

  /**
   * Get total activity for a specific date
   * @param {string} userId - The user's ID
   * @param {string} date - The date in 'yyyy-MM-dd' format
   * @returns {object|null} Activity data object or null on error
   */
  async getTotalActivity(userId, date) {
    try {
      const result = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdActivity,
        [
          Query.equal('userId', userId),
          Query.equal('date', date),
        ]
      );

      if (result.documents.length > 0) {
        return result.documents[0];
      }

      // Return zero activity if no log exists
      return {
        date,
        notesCreated: 0,
        tasksCompleted: 0,
        kanbanMoves: 0,
        streakDays: 0,
        totalActivity: 0,
      };
    } catch (error) {
      console.error('Appwrite service :: getTotalActivity :: error', error);
      return null;
    }
  }

  /**
   * Get activity statistics for a user
   * @param {string} userId - The user's ID
   * @param {string} period - Period type ('week', 'month', 'year', 'all')
   * @returns {object} Statistics object or empty object on error
   */
  async getActivityStats(userId, period = 'month') {
    try {
      // Calculate date range based on period
      const endDate = new Date().toISOString().split('T')[0];
      let startDate;

      switch (period) {
        case 'week':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'month':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'year':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        default:
          startDate = '2020-01-01'; // All time
      }

      const activityLogs = await this.getActivityLogs(userId, startDate, endDate);

      // Calculate totals
      const stats = activityLogs.reduce((totals, log) => ({
        notesCreated: totals.notesCreated + (log.notesCreated || 0),
        tasksCompleted: totals.tasksCompleted + (log.tasksCompleted || 0),
        kanbanMoves: totals.kanbanMoves + (log.kanbanMoves || 0),
        streakDays: totals.streakDays + (log.streakDays || 0),
        totalActivity: totals.totalActivity + (log.totalActivity || 0),
      }), {
        notesCreated: 0,
        tasksCompleted: 0,
        kanbanMoves: 0,
        streakDays: 0,
        totalActivity: 0,
      });

      return {
        ...stats,
        period: { start: startDate, end: endDate },
        totalDays: activityLogs.length,
      };
    } catch (error) {
      console.error('Appwrite service :: getActivityStats :: error', error);
      return {};
    }
  }

  /**
   * Delete activity logs for a user (for data cleanup)
   * @param {string} userId - The user's ID
   * @returns {boolean} True if successful, false otherwise
   */
  async deleteUserActivityLogs(userId) {
    try {
      const result = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdActivity,
        [Query.equal('userId', userId)]
      );

      // Delete all activity logs for the user
      for (const doc of result.documents) {
        await this.databases.deleteDocument(
          conf.appwriteDatabaseId,
          conf.appwriteCollectionIdActivity,
          doc.$id
        );
      }

      return true;
    } catch (error) {
      console.error('Appwrite service :: deleteUserActivityLogs :: error', error);
      return false;
    }
  }

  /**
   * Calculate total activity from individual activity counts
   * @param {object} activities - Object containing activity counts
   * @returns {number} Total activity count
   */
  calculateTotalActivity(activities) {
    return (
      (activities.notesCreated || 0) +
      (activities.tasksCompleted || 0) +
      (activities.kanbanMoves || 0) +
      (activities.streakDays || 0)
    );
  }
}

const activityService = new ActivityService();
export default activityService;
