import conf from '../conf/conf.js';
import { Client, ID, Databases, Storage, Query, Permission, Role } from "appwrite";

/**
 * Backups Service for Appwrite
 * Handles data backup and restore operations
 */
class BackupsService {
  client = new Client();
  databases;
  bucket;

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);
    this.databases = new Databases(this.client);
    this.bucket = new Storage(this.client);
  }

  /**
   * Create a backup
   * @param {string} userId - User ID
   * @param {string} type - Backup type: 'full', 'notes', 'settings'
   * @param {Object} data - Data to backup
   * @returns {Object} Created backup document
   */
  async createBackup(userId, type, data) {
    try {
      const backupData = {
        userId,
        type,
        data: JSON.stringify(data),
        size: new Blob([JSON.stringify(data)]).size,
        createdAt: new Date().toISOString(),
      };

      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdBackups || 'backups',
        ID.unique(),
        backupData,
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId))
        ]
      );
    } catch (error) {
      console.log("Appwrite service :: createBackup :: error", error);
      throw error;
    }
  }

  /**
   * Get all backups for a user
   * @param {string} userId - User ID
   * @param {string} type - Optional filter by backup type
   * @returns {Array} List of backup documents
   */
  async getBackups(userId, type = null) {
    try {
      const queries = [Query.equal('userId', userId), Query.orderDesc('createdAt')];
      
      if (type) {
        queries.push(Query.equal('type', type));
      }

      const response = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdBackups || 'backups',
        queries
      );
      return response.documents;
    } catch (error) {
      console.log("Appwrite service :: getBackups :: error", error);
      throw error;
    }
  }

  /**
   * Get a specific backup
   * @param {string} backupId - Backup document ID
   * @returns {Object} Backup document with data
   */
  async getBackup(backupId) {
    try {
      const backup = await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdBackups || 'backups',
        backupId
      );

      return {
        ...backup,
        data: JSON.parse(backup.data),
      };
    } catch (error) {
      console.log("Appwrite service :: getBackup :: error", error);
      throw error;
    }
  }

  /**
   * Delete a backup
   * @param {string} backupId - Backup document ID
   * @returns {boolean} Success status
   */
  async deleteBackup(backupId) {
    try {
      await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionIdBackups || 'backups',
        backupId
      );
      return true;
    } catch (error) {
      console.log("Appwrite service :: deleteBackup :: error", error);
      throw error;
    }
  }

  /**
   * Auto backup user data
   * @param {string} userId - User ID
   * @param {string} type - Backup type
   * @param {Object} data - Data to backup
   * @returns {Object} Created backup document
   */
  async autoBackup(userId, type, data) {
    try {
      // Check if we should create an auto backup
      // This could be limited by time or frequency
      return await this.createBackup(userId, `auto_${type}`, data);
    } catch (error) {
      console.log("Appwrite service :: autoBackup :: error", error);
      throw error;
    }
  }

  /**
   * Restore from backup
   * @param {string} backupId - Backup document ID
   * @returns {Object} Parsed backup data
   */
  async restoreFromBackup(backupId) {
    try {
      const backup = await this.getBackup(backupId);
      return backup.data;
    } catch (error) {
      console.log("Appwrite service :: restoreFromBackup :: error", error);
      throw error;
    }
  }

  /**
   * Get backup statistics for a user
   * @param {string} userId - User ID
   * @returns {Object} Backup statistics
   */
  async getBackupStats(userId) {
    try {
      const allBackups = await this.getBackups(userId);
      
      const stats = {
        totalBackups: allBackups.length,
        totalSize: allBackups.reduce((sum, b) => sum + (b.size || 0), 0),
        lastBackup: allBackups[0]?.createdAt || null,
        backupTypes: {},
      };

      // Count by type
      allBackups.forEach(backup => {
        const type = backup.type;
        stats.backupTypes[type] = (stats.backupTypes[type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.log("Appwrite service :: getBackupStats :: error", error);
      throw error;
    }
  }

  /**
   * Clean up old auto backups (keep last N)
   * @param {string} userId - User ID
   * @param {string} type - Backup type pattern
   * @param {number} keepCount - Number of backups to keep
   * @returns {number} Number of deleted backups
   */
  async cleanupOldBackups(userId, type, keepCount = 5) {
    try {
      const allBackups = await this.getBackups(userId, type);
      const autoBackups = allBackups.filter(b => b.type.startsWith('auto_'));

      if (autoBackups.length <= keepCount) {
        return 0;
      }

      // Sort by date and keep the most recent
      const toDelete = autoBackups
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(keepCount);

      let deletedCount = 0;
      for (const backup of toDelete) {
        await this.deleteBackup(backup.$id);
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.log("Appwrite service :: cleanupOldBackups :: error", error);
      throw error;
    }
  }

  /**
   * Export backup to file (download)
   * @param {Object} backup - Backup document
   * @returns {Blob} File blob for download
   */
  async exportBackupToFile(backup) {
    try {
      const dataStr = JSON.stringify({
        version: '1.0',
        exportedAt: new Date().toISOString(),
        backupType: backup.type,
        data: JSON.parse(backup.data),
      }, null, 2);

      return new Blob([dataStr], { type: 'application/json' });
    } catch (error) {
      console.log("Appwrite service :: exportBackupToFile :: error", error);
      throw error;
    }
  }
}

const backupsService = new BackupsService();
export default backupsService;