import conf from '../conf/conf.js';
import { Client, Databases, Query, Permission, Role } from 'appwrite';
import { format } from 'date-fns';

/**
 * Appwrite service for managing user goals
 * Handles goal creation, progress tracking, and completion
 */
export class GoalsService {
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
   * Create a new goal for a user
   * @param {object} goal - Goal object with type, category, target, period
   * @returns {object|null} The created goal or null on error
   */
  async createGoal(goal) {
    try {
      const { userId, type, category, target, period } = goal;

      // Input validation
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId: must be a non-empty string');
      }
      if (!['daily', 'weekly'].includes(type)) {
        throw new Error('Invalid type: must be "daily" or "weekly"');
      }
      if (!['notes_created', 'tasks_completed', 'kanban_moves', 'streak_maintenance'].includes(category)) {
        throw new Error('Invalid category: must be one of the allowed categories');
      }
      if (typeof target !== 'number' || target <= 0) {
        throw new Error('Invalid target: must be a positive number');
      }
      if (!period || typeof period !== 'string') {
        throw new Error('Invalid period: must be a non-empty string');
      }

      return await this.retryWithBackoff(async () => {
        return await this.databases.createDocument(
          conf.appwriteDatabaseId,
          conf.appwriteCollectionIdGoals,
          'unique()',
          {
            userId,
            type, // 'daily' or 'weekly'
            category, // 'notes_created', 'tasks_completed', 'kanban_moves', 'streak_maintenance'
            target,
            current: 0,
            period, // '2024-01-15' for daily, '2024-W03' for weekly
            createdAt: new Date().toISOString(),
            completedAt: null,
          },
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ]
        );
      });
    } catch (error) {
      console.error('Appwrite service :: createGoal :: error', error);
      return {
        error: {
          code: 'CREATE_GOAL_FAILED',
          message: error.message || 'Failed to create goal',
          retryable: this.isRetryableError(error),
        }
      };
    }
  }

  /**
   * Fetch all goals for a user
   * @param {string} userId - The user's ID
   * @param {object} filters - Optional filters (type, category, completed)
   * @returns {Array} Array of goals or empty array on error
   */
  async getGoals(userId, filters = {}) {
    try {
      const queries = [Query.equal('userId', userId)];

      // Add optional filters
      if (filters.type) {
        queries.push(Query.equal('type', filters.type));
      }
      if (filters.category) {
        queries.push(Query.equal('category', filters.category));
      }
      if (filters.completed !== undefined) {
        if (filters.completed) {
          queries.push(Query.isNotNull('completedAt'));
        } else {
          queries.push(Query.isNull('completedAt'));
        }
      }
      if (filters.period) {
        queries.push(Query.equal('period', filters.period));
      }

      // Sort by creation date descending
      queries.push(Query.orderDesc('createdAt'));

      const result = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdGoals,
        queries
      );

      return result.documents || [];
    } catch (error) {
      console.error('Appwrite service :: getGoals :: error', error);
      return [];
    }
  }

  /**
   * Get a specific goal by ID
   * @param {string} goalId - The goal's ID
   * @returns {object|null} The goal object or null on error
   */
  async getGoalById(goalId) {
    try {
      return await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdGoals,
        goalId
      );
    } catch (error) {
      console.error('Appwrite service :: getGoalById :: error', error);
      return null;
    }
  }

  /**
   * Update goal progress
   * @param {string} goalId - The goal's ID
   * @param {number} progress - Amount to add to current progress
   * @returns {object|null} The updated goal or null on error
   */
  async updateGoal(goalId, progress) {
    try {
      // First get the current goal
      const currentGoal = await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdGoals,
        goalId
      );

      const newCurrent = (currentGoal.current || 0) + progress;
      const isCompleted = newCurrent >= currentGoal.target;

      const updateData = {
        current: newCurrent,
      };

      // Set completedAt if goal is now complete
      if (isCompleted && !currentGoal.completedAt) {
        updateData.completedAt = new Date().toISOString();
      }

      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdGoals,
        goalId,
        updateData
      );
    } catch (error) {
      console.error('Appwrite service :: updateGoal :: error', error);
      return null;
    }
  }

  /**
   * Update goal with specific data (not just progress)
   * @param {string} goalId - The goal's ID
   * @param {object} updates - Object containing fields to update
   * @returns {object|null} The updated goal or null on error
   */
  async updateGoalData(goalId, updates) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdGoals,
        goalId,
        updates
      );
    } catch (error) {
      console.error('Appwrite service :: updateGoalData :: error', error);
      return null;
    }
  }

  /**
   * Delete a goal
   * @param {string} goalId - The goal's ID
   * @returns {boolean} True if successful, false otherwise
   */
  async deleteGoal(goalId) {
    try {
      await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdGoals,
        goalId
      );
      return true;
    } catch (error) {
      console.error('Appwrite service :: deleteGoal :: error', error);
      return false;
    }
  }

  /**
   * Get goals for the current period (today or current week)
   * @param {string} userId - The user's ID
   * @param {string} type - 'daily' or 'weekly'
   * @returns {Array} Array of active goals for the period
   */
  async getCurrentPeriodGoals(userId, type = 'daily') {
    try {
      const period = type === 'daily' 
        ? format(new Date(), 'yyyy-MM-dd')
        : format(new Date(), "yyyy-'W'ww");

      return await this.getGoals(userId, { type, period });
    } catch (error) {
      console.error('Appwrite service :: getCurrentPeriodGoals :: error', error);
      return [];
    }
  }

  /**
   * Check and update goals based on current stats
   * This would typically be called after completing activities
   * @param {string} userId - The user's ID
   * @param {string} category - The category of activity ('notes_created', 'tasks_completed', etc.)
   * @param {number} amount - Amount of activity to credit
   * @returns {Array} Array of updated/completed goals
   */
  async checkAndUpdateGoals(userId, category, amount = 1) {
    try {
      // Get active goals for current period that match the category
      const activeGoals = await this.getGoals(userId, {
        category,
        completed: false,
      });

      const updatedGoals = [];

      for (const goal of activeGoals) {
        const updatedGoal = await this.updateGoal(goal.$id, amount);
        if (updatedGoal) {
          updatedGoals.push(updatedGoal);
        }
      }

      return updatedGoals;
    } catch (error) {
      console.error('Appwrite service :: checkAndUpdateGoals :: error', error);
      return [];
    }
  }

  /**
   * Get goal statistics for a user
   * @param {string} userId - The user's ID
   * @returns {object} Statistics object
   */
  async getGoalStats(userId) {
    try {
      const allGoals = await this.getGoals(userId);
      
      const stats = {
        totalGoals: allGoals.length,
        completedGoals: allGoals.filter(g => g.completedAt).length,
        activeGoals: allGoals.filter(g => !g.completedAt).length,
        dailyGoals: allGoals.filter(g => g.type === 'daily').length,
        weeklyGoals: allGoals.filter(g => g.type === 'weekly').length,
        goalsByCategory: {},
        completionRate: 0,
      };

      // Calculate goals by category
      allGoals.forEach(goal => {
        if (!stats.goalsByCategory[goal.category]) {
          stats.goalsByCategory[goal.category] = { total: 0, completed: 0 };
        }
        stats.goalsByCategory[goal.category].total += 1;
        if (goal.completedAt) {
          stats.goalsByCategory[goal.category].completed += 1;
        }
      });

      // Calculate overall completion rate
      if (stats.totalGoals > 0) {
        stats.completionRate = Math.round((stats.completedGoals / stats.totalGoals) * 100);
      }

      return stats;
    } catch (error) {
      console.error('Appwrite service :: getGoalStats :: error', error);
      return {
        totalGoals: 0,
        completedGoals: 0,
        activeGoals: 0,
        dailyGoals: 0,
        weeklyGoals: 0,
        goalsByCategory: {},
        completionRate: 0,
      };
    }
  }

  /**
   * Generate period string for daily goals
   * @param {Date} date - The date
   * @returns {string} Date string in 'yyyy-MM-dd' format
   */
  getDailyPeriod(date = new Date()) {
    return format(date, 'yyyy-MM-dd');
  }

  /**
   * Generate period string for weekly goals
   * @param {Date} date - The date
   * @returns {string} Week string in "yyyy-'W'ww" format
   */
  getWeeklyPeriod(date = new Date()) {
    return format(date, "yyyy-'W'ww");
  }
}

const goalsService = new GoalsService();
export default goalsService;
