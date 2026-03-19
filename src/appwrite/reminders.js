import conf from '../conf/conf.js';
import { Client, ID, Databases, Query, Permission, Role } from "appwrite";

/**
 * Reminders Service for Appwrite
 * Handles CRUD operations for reminders
 */
class RemindersService {
  client = new Client();
  databases;

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);
    this.databases = new Databases(this.client);
  }

  /**
   * Create a new reminder
   * @param {Object} reminder - Reminder object with dueDate, noteId, etc.
   * @returns {Object} Created reminder document
   */
  async createReminder(reminder) {
    try {
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdReminders || 'reminders',
        ID.unique(),
        {
          userId: reminder.userId,
          noteId: reminder.noteId,
          dueDate: reminder.dueDate,
          reminderTimes: reminder.reminderTimes || [15, 60, 1440], // Default: 15min, 1hr, 1day before
          isActive: reminder.isActive !== false,
          snoozeUntil: reminder.snoozeUntil || null,
          createdAt: new Date().toISOString(),
        },
        [
          Permission.read(Role.user(reminder.userId)),
          Permission.update(Role.user(reminder.userId)),
          Permission.delete(Role.user(reminder.userId))
        ]
      );
    } catch (error) {
      console.log("Appwrite service :: createReminder :: error", error);
      throw error;
    }
  }

  /**
   * Get all reminders for a user
   * @param {string} userId - User ID
   * @param {boolean} includeInactive - Whether to include inactive reminders
   * @returns {Array} List of reminder documents
   */
  async getReminders(userId, includeInactive = false) {
    try {
      const queries = [Query.equal('userId', userId)];
      
      if (!includeInactive) {
        queries.push(Query.equal('isActive', true));
      }

      const response = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdReminders || 'reminders',
        queries
      );
      return response.documents;
    } catch (error) {
      console.log("Appwrite service :: getReminders :: error", error);
      throw error;
    }
  }

  /**
   * Get upcoming reminders for a user
   * @param {string} userId - User ID
   * @param {number} daysAhead - Number of days to look ahead
   * @returns {Array} List of upcoming reminder documents
   */
  async getUpcomingReminders(userId, daysAhead = 7) {
    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const response = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdReminders || 'reminders',
        [
          Query.equal('userId', userId),
          Query.equal('isActive', true),
          Query.greaterThanEqual('dueDate', now.toISOString()),
          Query.lessThanEqual('dueDate', futureDate.toISOString()),
          Query.orderAsc('dueDate'),
        ]
      );
      return response.documents;
    } catch (error) {
      console.log("Appwrite service :: getUpcomingReminders :: error", error);
      throw error;
    }
  }

  /**
   * Get overdue reminders for a user
   * @param {string} userId - User ID
   * @returns {Array} List of overdue reminder documents
   */
  async getOverdueReminders(userId) {
    try {
      const now = new Date().toISOString();

      const response = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdReminders || 'reminders',
        [
          Query.equal('userId', userId),
          Query.equal('isActive', true),
          Query.lessThan('dueDate', now),
          Query.orderAsc('dueDate'),
        ]
      );
      return response.documents;
    } catch (error) {
      console.log("Appwrite service :: getOverdueReminders :: error", error);
      throw error;
    }
  }

  /**
   * Update a reminder
   * @param {string} reminderId - Reminder document ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated reminder document
   */
  async updateReminder(reminderId, updates) {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdReminders || 'reminders',
        reminderId,
        updateData
      );
    } catch (error) {
      console.log("Appwrite service :: updateReminder :: error", error);
      throw error;
    }
  }

  /**
   * Delete a reminder
   * @param {string} reminderId - Reminder document ID
   * @returns {boolean} Success status
   */
  async deleteReminder(reminderId) {
    try {
      await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdReminders || 'reminders',
        reminderId
      );
      return true;
    } catch (error) {
      console.log("Appwrite service :: deleteReminder :: error", error);
      throw error;
    }
  }

  /**
   * Snooze a reminder
   * @param {string} reminderId - Reminder document ID
   * @param {number} duration - Duration in minutes to snooze
   * @returns {Object} Updated reminder document
   */
  async snoozeReminder(reminderId, duration) {
    try {
      const snoozeUntil = new Date(Date.now() + duration * 60 * 1000);

      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdReminders || 'reminders',
        reminderId,
        {
          snoozeUntil: snoozeUntil.toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.log("Appwrite service :: snoozeReminder :: error", error);
      throw error;
    }
  }

  /**
   * Toggle reminder active status
   * @param {string} reminderId - Reminder document ID
   * @param {boolean} isActive - New active status
   * @returns {Object} Updated reminder document
   */
  async toggleReminderActive(reminderId, isActive) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdReminders || 'reminders',
        reminderId,
        {
          isActive,
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.log("Appwrite service :: toggleReminderActive :: error", error);
      throw error;
    }
  }

  /**
   * Get reminders for a specific note
   * @param {string} noteId - Note document ID
   * @returns {Array} List of reminder documents for the note
   */
  async getRemindersByNoteId(noteId) {
    try {
      const response = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdReminders || 'reminders',
        [Query.equal('noteId', noteId)]
      );
      return response.documents;
    } catch (error) {
      console.log("Appwrite service :: getRemindersByNoteId :: error", error);
      throw error;
    }
  }

  /**
   * Check and return overdue reminders
   * @param {string} userId - User ID
   * @returns {Array} List of overdue reminder documents
   */
  async checkOverdueReminders(userId) {
    try {
      const now = new Date().toISOString();

      const response = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdReminders || 'reminders',
        [
          Query.equal('userId', userId),
          Query.equal('isActive', true),
          Query.lessThan('dueDate', now),
          Query.orderAsc('dueDate'),
        ]
      );

      return {
        reminders: response.documents,
        count: response.documents.length,
      };
    } catch (error) {
      console.log("Appwrite service :: checkOverdueReminders :: error", error);
      throw error;
    }
  }
}

const remindersService = new RemindersService();
export default remindersService;