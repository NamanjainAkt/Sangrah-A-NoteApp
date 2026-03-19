/**
 * Backup utility functions
 * Provides functions for automatic backups and data management
 */

/**
 * Backup types
 */
export const BACKUP_TYPES = {
  FULL: 'full',
  NOTES: 'notes',
  SETTINGS: 'settings',
  AUTO_FULL: 'auto_full',
  AUTO_NOTES: 'auto_notes',
};

/**
 * Default backup configuration
 */
export const BACKUP_CONFIG = {
  maxAutoBackups: 5,
  autoBackupInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  minStorageSpace: 50 * 1024 * 1024, // 50 MB
};

/**
 * Create a manual backup
 * @param {Object} options - Backup options
 * @returns {Object} Backup result
 */
export const createBackup = async (options) => {
  const {
    type = BACKUP_TYPES.FULL,
    state,
    onProgress = () => {},
  } = options;

  onProgress(10);

  let backupData;

  switch (type) {
    case BACKUP_TYPES.NOTES:
      backupData = state.notes.notes;
      break;
    case BACKUP_TYPES.SETTINGS:
      backupData = {
        settings: state.settings,
        gamification: {
          points: state.gamification.points,
          level: state.gamification.level,
          badges: state.gamification.badges,
          stats: state.gamification.stats,
        },
      };
      break;
    case BACKUP_TYPES.FULL:
    default:
      backupData = {
        notes: state.notes.notes,
        settings: state.settings,
        gamification: {
          points: state.gamification.points,
          level: state.gamification.level,
          xp: state.gamification.xp,
          badges: state.gamification.badges,
          currentStreak: state.gamification.currentStreak,
          bestStreak: state.gamification.bestStreak,
          stats: state.gamification.stats,
        },
        tags: state.tags.tags,
        reminders: state.reminders.reminders,
      };
      break;
  }

  onProgress(50);

  const backup = {
    version: '1.0',
    type,
    createdAt: new Date().toISOString(),
    data: backupData,
    size: new Blob([JSON.stringify(backupData)]).size,
  };

  onProgress(100);

  return {
    success: true,
    backup,
    size: backup.size,
  };
};

/**
 * Schedule automatic backup
 * @param {Object} options - Backup schedule options
 * @returns {Object} Schedule result
 */
export const scheduleAutoBackup = (options) => {
  const {
    type = BACKUP_TYPES.AUTO_FULL,
    interval = BACKUP_CONFIG.autoBackupInterval,
    state,
    onBackup = () => {},
  } = options;

  // Check if backup is already scheduled
  if (window.autoBackupIntervalId) {
    clearInterval(window.autoBackupIntervalId);
  }

  // Schedule the backup
  const intervalId = setInterval(async () => {
    const result = await createBackup({ type, state });
    if (result.success) {
      onBackup(result.backup);
    }
  }, interval);

  window.autoBackupIntervalId = intervalId;

  return {
    success: true,
    interval,
    nextBackup: new Date(Date.now() + interval),
  };
};

/**
 * Cancel scheduled backup
 */
export const cancelAutoBackup = () => {
  if (window.autoBackupIntervalId) {
    clearInterval(window.autoBackupIntervalId);
    window.autoBackupIntervalId = null;
  }
};

/**
 * Get backup schedule status
 * @returns {Object} Schedule status
 */
export const getBackupScheduleStatus = () => {
  return {
    isScheduled: !!window.autoBackupIntervalId,
    nextBackup: window.autoBackupIntervalId 
      ? new Date(Date.now() + BACKUP_CONFIG.autoBackupInterval) 
      : null,
  };
};

/**
 * Manage backup storage
 * @param {Object} options - Storage management options
 * @returns {Object} Storage management result
 */
export const manageBackupStorage = async (options) => {
  const {
    backups = [],
    maxBackups = BACKUP_CONFIG.maxAutoBackups,
    onDelete = () => {},
  } = options;

  // Separate auto and manual backups
  const autoBackups = backups.filter(b => b.type.startsWith('auto_'));
  const manualBackups = backups.filter(b => !b.type.startsWith('auto_'));

  // Keep only the most recent auto backups
  const autoBackupsToDelete = autoBackups
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(maxBackups);

  // Delete old auto backups
  for (const backup of autoBackupsToDelete) {
    await onDelete(backup.id);
  }

  return {
    success: true,
    deletedCount: autoBackupsToDelete.length,
    remainingBackups: backups.length - autoBackupsToDelete.length,
  };
};

/**
 * Validate backup integrity
 * @param {Object} backup - Backup to validate
 * @returns {Object} Validation result
 */
export const validateBackupIntegrity = (backup) => {
  const errors = [];
  const warnings = [];

  // Check required fields
  if (!backup.version) {
    warnings.push('Missing version field');
  }

  if (!backup.createdAt) {
    errors.push('Missing creation timestamp');
  }

  if (!backup.data) {
    errors.push('Missing backup data');
  }

  // Check version compatibility
  if (backup.version && backup.version !== '1.0') {
    warnings.push(`Unknown version: ${backup.version}`);
  }

  // Check data structure based on type
  if (backup.data) {
    switch (backup.type) {
      case BACKUP_TYPES.NOTES:
        if (!Array.isArray(backup.data)) {
          errors.push('Notes data must be an array');
        }
        break;
      case BACKUP_TYPES.FULL:
      case BACKUP_TYPES.AUTO_FULL:
        if (!backup.data.notes) {
          warnings.push('Missing notes in full backup');
        }
        break;
    }
  }

  // Calculate age
  const age = Date.now() - new Date(backup.createdAt).getTime();
  const daysOld = Math.floor(age / (24 * 60 * 60 * 1000));
  
  if (daysOld > 30) {
    warnings.push(`Backup is ${daysOld} days old`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    age: {
      days: daysOld,
      readable: `${daysOld} days old`,
    },
  };
};

/**
 * Get backup recommendations
 * @param {Object} options - Analysis options
 * @returns {Array} Array of recommendations
 */
export const getBackupRecommendations = (options) => {
  const {
    lastBackupDate = null,
    backupCount = 0,
    storageUsed = 0,
  } = options;

  const recommendations = [];

  // Check if backups exist
  if (backupCount === 0) {
    recommendations.push({
      type: 'info',
      message: 'Create your first backup to protect your data',
      action: 'Create Backup',
    });
  }

  // Check backup age
  if (lastBackupDate) {
    const daysSinceBackup = Math.floor(
      (Date.now() - new Date(lastBackupDate).getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysSinceBackup > 7) {
      recommendations.push({
        type: 'warning',
        message: `It's been ${daysSinceBackup} days since your last backup`,
        action: 'Backup Now',
      });
    }
  }

  // Check storage usage
  if (storageUsed > BACKUP_CONFIG.minStorageSpace) {
    recommendations.push({
      type: 'info',
      message: 'Consider cleaning up old backups to save storage space',
      action: 'Manage Backups',
    });
  }

  // Recommend enabling auto-backup
  if (backupCount > 0 && backupCount < 3) {
    recommendations.push({
      type: 'info',
      message: 'Enable automatic backups for peace of mind',
      action: 'Enable Auto-Backup',
    });
  }

  return recommendations;
};

/**
 * Estimate backup size
 * @param {Object} state - Full app state
 * @param {string} type - Backup type
 * @returns {number} Estimated size in bytes
 */
export const estimateBackupSize = (state, type = BACKUP_TYPES.FULL) => {
  let data;

  switch (type) {
    case BACKUP_TYPES.NOTES:
      data = state.notes.notes;
      break;
    case BACKUP_TYPES.SETTINGS:
      data = {
        settings: state.settings,
        gamification: state.gamification,
      };
      break;
    case BACKUP_TYPES.FULL:
    default:
      data = {
        notes: state.notes.notes,
        settings: state.settings,
        gamification: state.gamification,
        tags: state.tags.tags,
        reminders: state.reminders.reminders,
      };
      break;
  }

  return new Blob([JSON.stringify(data)]).size;
};

/**
 * Compress backup data
 * @param {Object} data - Data to compress
 * @returns {string} Compressed data string
 */
export const compressBackup = (data) => {
  // Basic compression by removing unnecessary whitespace
  return JSON.stringify(data);
};

/**
 * Restore data from backup
 * @param {Object} backup - Backup to restore from
 * @returns {Object} Restored data
 */
export const restoreFromBackup = (backup) => {
  if (!backup.data) {
    throw new Error('Invalid backup: missing data');
  }

  return {
    notes: backup.data.notes || [],
    settings: backup.data.settings || {},
    gamification: backup.data.gamification || {},
    tags: backup.data.tags || [],
    reminders: backup.data.reminders || [],
    restoredAt: new Date().toISOString(),
    backupCreatedAt: backup.createdAt,
  };
};

/**
 * Generate backup filename
 * @param {string} type - Backup type
 * @returns {string} Generated filename
 */
export const generateBackupFilename = (type) => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19);
  
  return `notesapp_backup_${type}_${timestamp}`;
};