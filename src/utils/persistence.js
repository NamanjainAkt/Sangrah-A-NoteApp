/**
 * Centralized Persistence Layer
 * Single source of truth for data synchronization between localStorage and Redux
 * Provides conflict resolution, backoff strategy, and data integrity validation
 */

import { v4 as uuidv4 } from 'uuid';

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: 'notesapp_settings',
  GAMIFICATION: 'notesapp_gamification',
  TAGS: 'notesapp_tags',
  REMINDERS: 'notesapp_reminders',
  ACTIVITY_CACHE: 'notesapp_activity_cache',
  NOTES_CACHE: 'notesapp_notes_cache',
};

// Conflict resolution strategies
const CONFLICT_STRATEGIES = {
  LAST_WRITE_WINS: 'last_write_wins',
  MERGE: 'merge',
  PROMPT_USER: 'prompt_user',
};

// Data validators
const validators = {
  settings: (data) => {
    return typeof data === 'object' && data !== null;
  },
  gamification: (data) => {
    return typeof data === 'object' && 
           typeof data.points === 'number' && 
           typeof data.level === 'number' && 
           typeof data.xp === 'number' &&
           Array.isArray(data.badges);
  },
  tags: (data) => {
    return Array.isArray(data);
  },
  reminders: (data) => {
    return Array.isArray(data);
  },
  activityCache: (data) => {
    return Array.isArray(data);
  },
  notesCache: (data) => {
    return Array.isArray(data);
  },
};

/**
 * Centralized Persistence Manager
 */
class PersistenceManager {
  constructor() {
    this.pendingWrites = new Map();
    this.writeQueue = [];
    this.isProcessingQueue = false;
    this.lastSyncTimes = new Map();
    this.conflictStrategy = CONFLICT_STRATEGIES.LAST_WRITE_WINS;
    this.maxRetries = 5;
    this.retryDelay = 1000; // 1 second
    this.maxRetryDelay = 30000; // 30 seconds max
    this.locks = new Map(); // For concurrent write handling
    this.dataVersions = new Map(); // Track data versions
    this.inProgressOperations = new Set(); // Track ongoing operations
    this.heartbeatInterval = null;
    this.isOnline = navigator.onLine;
    this.setupNetworkListeners();
  }

  /**
   * Initialize persistence manager
   */
  async init() {
    // Load all cached data on initialization
    await this.loadAllFromStorage();
    
    // Set up periodic sync
    setInterval(() => {
      this.syncWithRemote();
    }, 60000); // Sync every minute

    // Set up beforeunload handler to save pending data
    window.addEventListener('beforeunload', () => {
      this.flushPendingWrites();
    });
  }

  /**
   * Setup network status listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Save data to localStorage with conflict resolution and concurrent handling
   */
  async save(key, data, options = {}) {    const {
      strategy = this.conflictStrategy,
      retryCount = 0,
      immediate = false,
      operationId = uuidv4(),
      timeout = 30000, // 30 seconds default timeout
    } = options;

    // Add to in-progress operations
    this.inProgressOperations.add(operationId);

    try {
      // Check if we're online
      if (!this.isOnline && !immediate) {
        this.queueWrite(key, data, options);
        return { success: false, error: 'Offline - queued for later', queued: true };
      }

      // Implement write locking for concurrent operations
      if (this.locks.has(key)) {
        if (immediate) {
          // Wait for lock to be released
          await this.waitForLock(key, timeout);
        } else {
          // Queue the operation
          this.queueWrite(key, data, options);
          return { success: false, error: 'Locked - queued for later', queued: true };
        }
      }

      // Acquire lock
      this.locks.set(key, {
        operationId,
        timestamp: Date.now(),
        timeout: setTimeout(() => this.releaseLock(key), timeout)
      });

      try {
        // Validate data before saving
        const validator = validators[key.replace('notesapp_', '')];
        if (validator && !validator(data)) {
          throw new Error(`Invalid data for key: ${key}`);
        }

        // Get existing data for conflict resolution
        const existingData = this.getFromStorage(key);
      
      let finalData = data;
      if (existingData && strategy === CONFLICT_STRATEGIES.MERGE) {
        finalData = this.mergeData(key, existingData, data);
      } else if (existingData && strategy === CONFLICT_STRATEGIES.PROMPT_USER) {
        const userChoice = await this.promptForConflict(key, existingData, data);
        if (userChoice === 'existing') {
          finalData = existingData;
        }
      }

        // Add metadata with version tracking
        const currentVersion = this.dataVersions.get(key) || 1;
        const dataWithMetadata = {
          ...finalData,
          _meta: {
            savedAt: new Date().toISOString(),
            version: currentVersion,
            id: uuidv4(),
            checksum: this.calculateChecksum(finalData),
          },
        };

        // Save to localStorage
        localStorage.setItem(key, JSON.stringify(dataWithMetadata));
        
        // Update version tracking
        this.dataVersions.set(key, currentVersion + 1);
        
        // Update last sync time
        this.lastSyncTimes.set(key, Date.now());
        
        // Clear any pending writes for this key
        this.pendingWrites.delete(key);
        
        // Run consistency check after save
        await this.runConsistencyCheck(key, dataWithMetadata);
        
        return { success: true, data: dataWithMetadata };
      } finally {
        // Always release the lock
        this.releaseLock(key);
      }
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error);
      
      // Release lock on error
      this.releaseLock(key);
      
      // Enhanced retry logic with exponential backoff
      if (retryCount < this.maxRetries) {
        const delay = Math.min(
          this.retryDelay * Math.pow(2, retryCount),
          this.maxRetryDelay
        );
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        await this.delay(delay + jitter);
        
        return this.save(key, data, { ...options, retryCount: retryCount + 1 });
      }
      
      // Queue for later if immediate save failed
      if (!immediate) {
        this.queueWrite(key, data, options);
      }
      
      return { success: false, error: error.message };
    } finally {
      // Remove from in-progress operations
      this.inProgressOperations.delete(operationId);
    }
  }

  /**
   * Load data from localStorage with integrity check
   */
  async load(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const data = JSON.parse(item);
      
      // Validate data
      const validator = validators[key.replace('notesapp_', '')];
      if (validator && !validator(data)) {
        console.warn(`Invalid data found for key: ${key}, clearing cache`);
        localStorage.removeItem(key);
        return null;
      }

      // Check for data corruption
      if (this.isDataCorrupted(data)) {
        console.warn(`Corrupted data found for key: ${key}, attempting recovery`);
        const recovered = this.recoverData(key, data);
        if (recovered) {
          await this.save(key, recovered);
          return recovered;
        } else {
          localStorage.removeItem(key);
          return null;
        }
      }

      return data;
    } catch (error) {
      console.error(`Error loading data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Load all data from storage
   */
  async loadAllFromStorage() {
    const results = {};
    
    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      const data = await this.load(key);
      if (data) {
        results[name.toLowerCase()] = data;
      }
    }
    
    return results;
  }

  /**
   * Sync data with remote storage (Appwrite)
   */
  async syncWithRemote() {
    // This would integrate with Appwrite services
    // For now, we'll just ensure local data integrity
    try {
      for (const key of Object.values(STORAGE_KEYS)) {
        const data = await this.load(key);
        if (data && this.needsRemoteSync(key, data)) {
          // Queue for remote sync
          this.queueRemoteSync(key, data);
        }
      }
    } catch (error) {
      console.error('Error syncing with remote:', error);
    }
  }

  /**
   * Check if data needs remote sync
   */
  needsRemoteSync(key, data) {
    const lastSync = this.lastSyncTimes.get(key);
    const lastModified = data._meta?.savedAt;
    
    if (!lastSync && lastModified) {
      return true;
    }
    
    if (lastModified) {
      const modifiedTime = new Date(lastModified).getTime();
      return modifiedTime > lastSync;
    }
    
    return false;
  }

  /**
   * Queue a write operation
   */
  queueWrite(key, data, options) {
    this.writeQueue.push({ key, data, options, timestamp: Date.now() });
    this.processWriteQueue();
  }

  /**
   * Process write queue with backoff strategy
   */
  async processWriteQueue() {
    if (this.isProcessingQueue || this.writeQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    while (this.writeQueue.length > 0) {
      const write = this.writeQueue.shift();
      
      // Check if write is too old (older than 5 minutes)
      if (Date.now() - write.timestamp > 300000) {
        console.warn(`Skipping old write for key: ${write.key}`);
        continue;
      }
      
      await this.save(write.key, write.data, { ...write.options, immediate: true });
      
      // Small delay between writes to prevent overwhelming
      await this.delay(100);
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Flush all pending writes immediately
   */
  async flushPendingWrites() {
    const promises = [];
    for (const [key, data] of this.pendingWrites) {
      promises.push(this.save(key, data, { immediate: true }));
    }
    await Promise.all(promises);
    this.pendingWrites.clear();
  }

  /**
   * Merge data based on conflict resolution strategy
   */
  mergeData(key, existing, incoming) {
    switch (key) {
      case STORAGE_KEYS.GAMIFICATION:
        return this.mergeGamificationData(existing, incoming);
      case STORAGE_KEYS.TAGS:
        return this.mergeTagsData(existing, incoming);
      case STORAGE_KEYS.REMINDERS:
        return this.mergeRemindersData(existing, incoming);
      default:
        // Default merge strategy: prefer incoming for most recent
        const existingModified = existing._meta?.savedAt;
        const incomingModified = incoming._meta?.savedAt;
        
        if (existingModified && incomingModified) {
          return new Date(existingModified) > new Date(incomingModified) ? existing : incoming;
        }
        
        return incoming;
    }
  }

  /**
   * Merge gamification data
   */
  mergeGamificationData(existing, incoming) {
    return {
      points: Math.max(existing.points || 0, incoming.points || 0),
      level: Math.max(existing.level || 1, incoming.level || 1),
      xp: Math.max(existing.xp || 0, incoming.xp || 0),
      badges: this.mergeBadges(existing.badges || [], incoming.badges || []),
      currentStreak: Math.max(existing.currentStreak || 0, incoming.currentStreak || 0),
      bestStreak: Math.max(existing.bestStreak || 0, incoming.bestStreak || 0),
      specialStreaks: {
        taskStreak: Math.max(existing.specialStreaks?.taskStreak || 0, incoming.specialStreaks?.taskStreak || 0),
        kanbanStreak: Math.max(existing.specialStreaks?.kanbanStreak || 0, incoming.specialStreaks?.kanbanStreak || 0),
      },
      stats: this.mergeStats(existing.stats || {}, incoming.stats || {}),
      lastActivityDate: this.getMostRecentDate(existing.lastActivityDate, incoming.lastActivityDate),
    };
  }

  /**
   * Merge badges arrays
   */
  mergeBadges(existing, incoming) {
    const badgeMap = new Map();
    
    existing.forEach(badge => badgeMap.set(badge.id, badge));
    incoming.forEach(badge => badgeMap.set(badge.id, badge));
    
    return Array.from(badgeMap.values());
  }

  /**
   * Merge stats objects
   */
  mergeStats(existing, incoming) {
    const merged = { ...existing };
    
    for (const [key, value] of Object.entries(incoming)) {
      if (typeof value === 'number' && typeof merged[key] === 'number') {
        merged[key] = Math.max(merged[key], value);
      } else {
        merged[key] = value;
      }
    }
    
    return merged;
  }

  /**
   * Merge tags arrays
   */
  mergeTagsData(existing, incoming) {
    const tagMap = new Map();
    
    existing.forEach(tag => tagMap.set(tag.id, tag));
    incoming.forEach(tag => tagMap.set(tag.id, tag));
    
    return Array.from(tagMap.values());
  }

  /**
   * Merge reminders arrays
   */
  mergeRemindersData(existing, incoming) {
    const reminderMap = new Map();
    
    existing.forEach(reminder => reminderMap.set(reminder.id, reminder));
    incoming.forEach(reminder => reminderMap.set(reminder.id, reminder));
    
    return Array.from(reminderMap.values());
  }

  /**
   * Check if data is corrupted
   */
  isDataCorrupted(data) {
    // Basic corruption checks
    if (!data || typeof data !== 'object') return true;
    
    // Check for circular references
    try {
      JSON.stringify(data);
    } catch {
      return true;
    }
    
    return false;
  }

  /**
   * Attempt to recover corrupted data
   */
  recoverData(key, data) {
    try {
      // Simple recovery: try to extract valid parts
      const recovered = { ...data };
      delete recovered._meta;
      
      // Validate the recovered data
      const validator = validators[key.replace('notesapp_', '')];
      if (validator && validator(recovered)) {
        return recovered;
      }
    } catch (error) {
      console.error('Data recovery failed:', error);
    }
    
    return null;
  }

  /**
   * Get data version
   */
  getDataVersion(key) {
    const existing = this.getFromStorage(key);
    return existing?._meta?.version || 1;
  }

  /**
   * Get data from localStorage
   */
  getFromStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get most recent date
   */
  getMostRecentDate(date1, date2) {
    if (!date1) return date2;
    if (!date2) return date1;
    return new Date(date1) > new Date(date2) ? date1 : date2;
  }

  /**
   * Queue remote sync operation
   */
  queueRemoteSync(key, data) {
    // This would integrate with Appwrite
    console.log(`Queueing remote sync for ${key}`);
  }

  /**
   * Prompt user for conflict resolution
   */
  async promptForConflict(key, existing, incoming) {
    return new Promise((resolve) => {
      // This would show a modal to the user
      // For now, default to incoming
      resolve('incoming');
    });
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for lock to be released
   */
  async waitForLock(key, timeout = 30000) {
    const startTime = Date.now();
    
    while (this.locks.has(key) && Date.now() - startTime < timeout) {
      await this.delay(100);
    }
    
    if (this.locks.has(key)) {
      throw new Error(`Lock timeout exceeded for key: ${key}`);
    }
  }

  /**
   * Release a lock
   */
  releaseLock(key) {
    const lock = this.locks.get(key);
    if (lock) {
      clearTimeout(lock.timeout);
      this.locks.delete(key);
    }
  }

  /**
   * Calculate checksum for data integrity
   */
  calculateChecksum(data) {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Run consistency check after save
   */
  async runConsistencyCheck(key, data) {
    try {
      // Verify the data was saved correctly
      const saved = this.getFromStorage(key);
      if (!saved) {
        throw new Error('Data not found after save');
      }

      // Check checksum
      if (saved._meta?.checksum) {
        const calculatedChecksum = this.calculateChecksum(data);
        if (saved._meta.checksum !== calculatedChecksum) {
          throw new Error('Data corruption detected - checksum mismatch');
        }
      }

      // Cross-store consistency checks
      if (key === STORAGE_KEYS.NOTES_CACHE) {
        await this.validateNoteTagConsistency();
      } else if (key === STORAGE_KEYS.TAGS) {
        await this.validateTagNoteConsistency();
      } else if (key === STORAGE_KEYS.REMINDERS) {
        await this.validateReminderNoteConsistency();
      }
    } catch (error) {
      console.error(`Consistency check failed for ${key}:`, error);
      // Try to recover
      await this.attemptRecovery(key, error);
    }
  }

  /**
   * Validate note-tag consistency
   */
  async validateNoteTagConsistency() {
    const notes = this.getFromStorage(STORAGE_KEYS.NOTES_CACHE) || [];
    const tags = this.getFromStorage(STORAGE_KEYS.TAGS) || [];
    
    const tagIdMap = new Map(tags.map(tag => [tag.id, tag]));
    let issues = 0;

    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tagRef => {
          const tagId = typeof tagRef === 'object' ? tagRef.id : tagRef;
          if (!tagIdMap.has(tagId)) {
            issues++;
          }
        });
      }
    });

    if (issues > 0) {
      console.warn(`Found ${issues} invalid tag references in notes`);
    }
  }

  /**
   * Validate tag-note consistency
   */
  async validateTagNoteConsistency() {
    const notes = this.getFromStorage(STORAGE_KEYS.NOTES_CACHE) || [];
    const tags = this.getFromStorage(STORAGE_KEYS.TAGS) || [];
    
    const usedTagIds = new Set();
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          const tagId = typeof tag === 'object' ? tag.id : tag;
          usedTagIds.add(tagId);
        });
      }
    });

    const orphanedTags = tags.filter(tag => !usedTagIds.has(tag.id));
    if (orphanedTags.length > 0) {
      console.warn(`Found ${orphanedTags.length} orphaned tags`);
    }
  }

  /**
   * Validate reminder-note consistency
   */
  async validateReminderNoteConsistency() {
    const notes = this.getFromStorage(STORAGE_KEYS.NOTES_CACHE) || [];
    const reminders = this.getFromStorage(STORAGE_KEYS.REMINDERS) || [];
    
    const noteIdMap = new Map(notes.map(note => [note.$id || note.id, note]));
    const orphanedReminders = reminders.filter(reminder => 
      reminder.noteId && !noteIdMap.has(reminder.noteId)
    );

    if (orphanedReminders.length > 0) {
      console.warn(`Found ${orphanedReminders.length} orphaned reminders`);
    }
  }

  /**
   * Attempt recovery from consistency issues
   */
  async attemptRecovery(key, error) {
    console.log(`Attempting recovery for ${key} due to:`, error.message);
    
    try {
      // Try to load from backup if available
      const backup = this.loadFromBackup(key);
      if (backup) {
        localStorage.setItem(key, JSON.stringify(backup));
        console.log(`Recovery successful for ${key} from backup`);
        return;
      }
      
      // If no backup, try to repair the data
      const corrupted = this.getFromStorage(key);
      if (corrupted) {
        const repaired = this.repairData(key, corrupted);
        if (repaired) {
          localStorage.setItem(key, JSON.stringify(repaired));
          console.log(`Recovery successful for ${key} - data repaired`);
          return;
        }
      }
      
      // Last resort - clear corrupted data
      console.warn(`Recovery failed for ${key} - clearing corrupted data`);
      localStorage.removeItem(key);
    } catch (recoveryError) {
      console.error(`Recovery failed for ${key}:`, recoveryError);
    }
  }

  /**
   * Load data from backup
   */
  loadFromBackup(key) {
    try {
      const backupKey = `${key}_backup`;
      const backup = localStorage.getItem(backupKey);
      return backup ? JSON.parse(backup) : null;
    } catch {
      return null;
    }
  }

  /**
   * Repair corrupted data
   */
  repairData(key, data) {
    try {
      const validator = validators[key.replace('notesapp_', '')];
      if (!validator) return null;
      
      // Remove metadata and try to repair
      const { _meta, ...cleanData } = data;
      
      // Apply type-specific repairs
      if (key === STORAGE_KEYS.NOTES_CACHE) {
        return this.repairNotesData(cleanData);
      } else if (key === STORAGE_KEYS.TAGS) {
        return this.repairTagsData(cleanData);
      } else if (key === STORAGE_KEYS.GAMIFICATION) {
        return this.repairGamificationData(cleanData);
      }
      
      return cleanData;
    } catch (error) {
      console.error('Data repair failed:', error);
      return null;
    }
  }

  /**
   * Repair notes data
   */
  repairNotesData(data) {
    if (!Array.isArray(data)) return [];
    
    return data.filter(note => {
      if (!note) return false;
      if (!note.title && !note.content) return false;
      return true;
    }).map(note => ({
      title: note.title || 'Untitled Note',
      content: note.content || '',
      tags: Array.isArray(note.tags) ? note.tags : [],
      tasks: Array.isArray(note.tasks) ? note.tasks : [],
      status: note.status || 'todo',
      isArchived: Boolean(note.isArchived),
      isImportant: Boolean(note.isImportant),
      isDeleted: false,
      dueDate: note.dueDate || null,
    }));
  }

  /**
   * Repair tags data
   */
  repairTagsData(data) {
    if (!Array.isArray(data)) return [];
    
    return data.filter(tag => {
      if (!tag) return false;
      if (!tag.name || typeof tag.name !== 'string') return false;
      return true;
    }).map(tag => ({
      id: tag.id || `tag-${Date.now()}-${Math.random()}`,
      name: tag.name.trim(),
      color: tag.color || '#007AFF',
      count: Math.max(0, Number(tag.count) || 0),
    }));
  }

  /**
   * Repair gamification data
   */
  repairGamificationData(data) {
    if (typeof data !== 'object') return {};
    
    return {
      points: Math.max(0, Number(data.points) || 0),
      level: Math.max(1, Number(data.level) || 1),
      xp: Math.max(0, Number(data.xp) || 0),
      badges: Array.isArray(data.badges) ? data.badges.filter(Boolean) : [],
      currentStreak: Math.max(0, Number(data.currentStreak) || 0),
      bestStreak: Math.max(0, Number(data.bestStreak) || 0),
      specialStreaks: {
        taskStreak: Math.max(0, Number(data.specialStreaks?.taskStreak) || 0),
        kanbanStreak: Math.max(0, Number(data.specialStreaks?.kanbanStreak) || 0),
      },
      stats: typeof data.stats === 'object' ? data.stats : {},
      lastActivityDate: data.lastActivityDate || null,
    };
  }

  /**
   * Process pending operations when coming back online
   */
  async processPendingOperations() {
    console.log('Processing pending operations after reconnection');
    
    // Process write queue
    if (this.writeQueue.length > 0) {
      this.processWriteQueue();
    }
    
    // Sync with remote
    this.syncWithRemote();
  }

  /**
   * Create backup before critical operations
   */
  async createBackup(key) {
    try {
      const data = this.getFromStorage(key);
      if (data) {
        const backupKey = `${key}_backup`;
        localStorage.setItem(backupKey, JSON.stringify({
          ...data,
          _backupTimestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  /**
   * Get operation status
   */
  getOperationStatus() {
    return {
      inProgress: this.inProgressOperations.size,
      queued: this.writeQueue.length,
      locks: this.locks.size,
      isOnline: this.isOnline,
    };
  }

  /**
   * Clear all data
   */
  async clearAll() {
    for (const key of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(key);
    }
    this.pendingWrites.clear();
    this.writeQueue = [];
    this.lastSyncTimes.clear();
  }

  /**
   * Export all data
   */
  async exportAll() {
    const data = {};
    
    for (const key of Object.values(STORAGE_KEYS)) {
      const item = await this.load(key);
      if (item) {
        data[key] = item;
      }
    }
    
    return {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data,
    };
  }

  /**
   * Import data with validation
   */
  async importAll(exportData, strategy = CONFLICT_STRATEGIES.MERGE) {
    if (!exportData.data) {
      throw new Error('Invalid export data format');
    }

    const results = {};
    
    for (const [key, data] of Object.entries(exportData.data)) {
      try {
        const result = await this.save(key, data, { strategy });
        results[key] = result;
      } catch (error) {
        results[key] = { success: false, error: error.message };
      }
    }
    
    return results;
  }
}

// Create singleton instance
const persistenceManager = new PersistenceManager();

// Export convenience functions
export const saveToStorage = (key, data, options) => 
  persistenceManager.save(key, data, options);

export const loadFromStorage = (key) => 
  persistenceManager.load(key);

export const loadAllFromStorage = () => 
  persistenceManager.loadAllFromStorage();

export const syncWithRemote = () => 
  persistenceManager.syncWithRemote();

export const clearAllStorage = () => 
  persistenceManager.clearAll();

export const exportAllData = () => 
  persistenceManager.exportAll();

export const importAllData = (data, strategy) => 
  persistenceManager.importAll(data, strategy);

export const STORAGE_KEYS_ENUM = STORAGE_KEYS;
export const CONFLICT_STRATEGIES_ENUM = CONFLICT_STRATEGIES;

// Initialize the persistence manager
export const initPersistence = () => persistenceManager.init();

export default persistenceManager;