/**
 * Export utility functions
 * Provides functions for exporting data in various formats with integrity checking
 */

import { loadFromStorage, STORAGE_KEYS_ENUM } from './persistence';
import CryptoJS from 'crypto-js';

// Export format versions
export const EXPORT_VERSIONS = {
  V1: '1.0',
  V2: '2.0', // Current version with integrity checking
};

/**
 * Generate checksum for data integrity
 */
const generateChecksum = (data) => {
  const dataString = JSON.stringify(data);
  return CryptoJS.SHA256(dataString).toString();
};

/**
 * Validate data integrity
 */
const validateDataIntegrity = (data, checksum) => {
  const calculatedChecksum = generateChecksum(data);
  return calculatedChecksum === checksum;
};

/**
 * Export data to JSON format with integrity checking
 * @param {Object} data - Data to export
 * @param {string} filename - Filename for the download
 * @param {Object} metadata - Optional metadata to include
 */
export const exportToJSON = async (data, filename = 'backup', metadata = {}) => {
  // Validate data before export
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data provided for export');
  }

  const exportData = {
    version: EXPORT_VERSIONS.V2,
    exportedAt: new Date().toISOString(),
    exportedFrom: 'NotesApp',
    ...metadata,
    data,
  };

  // Generate checksum for integrity
  const checksum = generateChecksum(exportData);
  exportData.integrity = {
    checksum,
    algorithm: 'SHA-256',
  };

  // Validate the export data
  try {
    JSON.stringify(exportData);
  } catch (error) {
    throw new Error('Export data cannot be serialized');
  }

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  downloadFile(blob, `${filename}_${getTimestamp()}.json`, 'application/json');
  
  return {
    success: true,
    filename: `${filename}_${getTimestamp()}.json`,
    size: blob.size,
    checksum,
  };
};

/**
 * Export notes to CSV format
 * @param {Array} notes - Array of notes to export
 * @param {string} filename - Filename for the download
 */
export const exportNotesToCSV = (notes, filename = 'notes_export') => {
  // Define CSV columns
  const columns = [
    'Title',
    'Content',
    'Status',
    'Is Archived',
    'Is Important',
    'Is Deleted',
    'Created At',
    'Updated At',
    'Tags',
    'Due Date',
  ];

  // Convert notes to CSV rows
  const rows = notes.map(note => [
    `"${(note.title || '').replace(/"/g, '""')}"`,
    `"${(note.content || '').replace(/"/g, '""')}"`,
    note.status || 'todo',
    note.isArchived ? 'Yes' : 'No',
    note.isImportant ? 'Yes' : 'No',
    note.isDeleted ? 'Yes' : 'No',
    note.$createdAt || '',
    note.$updatedAt || '',
    (note.tags || []).join(', '),
    note.dueDate || '',
  ]);

  const csvContent = [
    columns.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${filename}_${getTimestamp()}.csv`);
};

/**
 * Export full app state to JSON with comprehensive data
 * @param {Object} state - Full Redux state
 * @param {string} filename - Filename for the download
 */
export const exportFullState = async (state, filename = 'full_backup') => {
  // Validate state structure
  if (!state || typeof state !== 'object') {
    throw new Error('Invalid state provided for export');
  }

  const exportData = {
    version: EXPORT_VERSIONS.V2,
    exportedAt: new Date().toISOString(),
    exportedFrom: 'NotesApp',
    type: 'full_state',
    
    // All data sections
    settings: state.settings || {},
    notes: {
      notes: state.notes?.notes || [],
      status: state.notes?.status || 'idle',
      error: state.notes?.error || null,
    },
    gamification: {
      points: state.gamification?.points || 0,
      level: state.gamification?.level || 1,
      xp: state.gamification?.xp || 0,
      badges: state.gamification?.badges || [],
      currentStreak: state.gamification?.currentStreak || 0,
      bestStreak: state.gamification?.bestStreak || 0,
      specialStreaks: state.gamification?.specialStreaks || {
        taskStreak: 0,
        kanbanStreak: 0,
      },
      lastActivityDate: state.gamification?.lastActivityDate || null,
      stats: state.gamification?.stats || {},
    },
    tags: {
      tags: state.tags?.tags || [],
      loading: state.tags?.loading || false,
      error: state.tags?.error || null,
    },
    reminders: {
      reminders: state.reminders?.reminders || [],
      loading: state.reminders?.loading || false,
      error: state.reminders?.error || null,
    },
    goals: {
      goals: state.goals?.goals || [],
      loading: state.goals?.loading || false,
      error: state.goals?.error || null,
    },
    analytics: {
      activityData: state.analytics?.activityData || [],
      timeFilter: state.analytics?.timeFilter || 'month',
      loading: state.analytics?.loading || false,
    },
    notifications: {
      notifications: state.notifications?.notifications || [],
      preferences: state.notifications?.preferences || {},
      loading: state.notifications?.loading || false,
    },
    auth: {
      isAuthenticated: state.auth?.isAuthenticated || false,
      userData: state.auth?.userData || null,
      // Note: Sensitive auth tokens should not be exported
    },
  };

  return await exportToJSON(exportData, filename, { 
    type: 'full_state',
    includes: ['settings', 'notes', 'gamification', 'tags', 'reminders', 'goals', 'analytics', 'notifications']
  });
};

/**
 * Export only notes
 * @param {Array} notes - Array of notes
 * @param {string} filename - Filename for the download
 */
export const exportNotes = (notes, filename = 'notes_backup') => {
  exportToJSON(notes, filename, { type: 'notes_only' });
};

/**
 * Export with filters
 * @param {Object} options - Export options
 * @param {Array} notes - Array of notes
 * @param {Object} settings - Settings state
 * @param {Object} gamification - Gamification state
 */
export const exportWithFilters = (options, notes, settings, gamification) => {
  const {
    format = 'json',
    includeSettings = true,
    includeGamification = false,
    includeTags = false,
    includeReminders = false,
    dateRange = null,
    tags = [],
    status = [],
  } = options;

  let filteredNotes = [...notes];

  // Apply date range filter
  if (dateRange && dateRange.start && dateRange.end) {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    filteredNotes = filteredNotes.filter(note => {
      const createdAt = new Date(note.$createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });
  }

  // Apply tag filter
  if (tags.length > 0) {
    filteredNotes = filteredNotes.filter(note => 
      note.tags && tags.some(tag => note.tags.includes(tag))
    );
  }

  // Apply status filter
  if (status.length > 0) {
    filteredNotes = filteredNotes.filter(note => status.includes(note.status));
  }

  // Export based on format
  if (format === 'csv') {
    exportNotesToCSV(filteredNotes, 'filtered_notes_export');
  } else {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      filters: {
        dateRange,
        tags,
        status,
      },
      data: {
        notes: filteredNotes,
        ...(includeSettings && { settings }),
        ...(includeGamification && { gamification }),
        ...(includeTags && { tags: gamification }),
      },
    };

    exportToJSON(exportData, 'filtered_backup');
  }
};

/**
 * Download file helper with error handling
 * @param {Blob} blob - File blob to download
 * @param {string} filename - Filename for download
 * @param {string} mimeType - MIME type of the file
 */
const downloadFile = (blob, filename, mimeType = 'application/json') => {
  try {
    // Validate blob
    if (!(blob instanceof Blob)) {
      throw new Error('Invalid blob provided');
    }

    if (blob.size === 0) {
      throw new Error('Empty file detected');
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.setAttribute('type', mimeType);
    
    // Add security attributes
    link.setAttribute('rel', 'noopener noreferrer');
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { success: true, filename, size: blob.size };
  } catch (error) {
    console.error('Download failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get timestamp for filename
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}`;
};

/**
 * Generate export preview
 * @param {Object} options - Export options
 * @param {Array} notes - Array of notes
 * @returns {Object} Preview object with stats
 */
export const generateExportPreview = (options, notes) => {
  const {
    format = 'json',
    dateRange = null,
    tags = [],
    status = [],
  } = options;

  let filteredNotes = [...notes];

  if (dateRange && dateRange.start && dateRange.end) {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    filteredNotes = filteredNotes.filter(note => {
      const createdAt = new Date(note.$createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });
  }

  if (tags.length > 0) {
    filteredNotes = filteredNotes.filter(note => 
      note.tags && tags.some(tag => note.tags.includes(tag))
    );
  }

  if (status.length > 0) {
    filteredNotes = filteredNotes.filter(note => status.includes(note.status));
  }

  const totalSize = new Blob([JSON.stringify(filteredNotes)]).size;

  return {
    totalNotes: filteredNotes.length,
    estimatedSize: formatSize(totalSize),
    breakdown: {
      byStatus: status.length > 0 ? null : getNotesByStatus(filteredNotes),
      byTags: tags.length > 0 ? null : getNotesByTags(filteredNotes),
    },
  };
};

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get notes grouped by status
 * @param {Array} notes - Array of notes
 * @returns {Object} Notes grouped by status
 */
const getNotesByStatus = (notes) => {
  return notes.reduce((acc, note) => {
    const status = note.status || 'todo';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
};

/**
 * Get notes grouped by tags
 * @param {Array} notes - Array of notes
 * @returns {Object} Notes grouped by tags
 */
const getNotesByTags = (notes) => {
  return notes.reduce((acc, note) => {
    const noteTags = note.tags || [];
    if (noteTags.length === 0) {
      acc['untagged'] = (acc['untagged'] || 0) + 1;
    } else {
      noteTags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
    }
    return acc;
  }, {});
};

/**
 * Export with compression support for large datasets
 * @param {Object} data - Data to export
 * @param {string} filename - Filename
 * @param {Object} options - Export options
 */
export const exportWithCompression = async (data, filename = 'backup', options = {}) => {
  const {
    compress = false,
    chunkSize = 10000, // Items per chunk
    onProgress = () => {},
  } = options;

  // Estimate size to determine if compression is needed
  const estimatedSize = new Blob([JSON.stringify(data)]).size;
  const shouldCompress = compress || estimatedSize > 50 * 1024 * 1024; // 50MB

  if (shouldCompress) {
    return await exportCompressed(data, filename, options);
  }

  if (Array.isArray(data) && data.length > chunkSize) {
    return await exportChunked(data, filename, options);
  }

  return await exportToJSON(data, filename, { ...options, compression: false });
};

/**
 * Export compressed data as ZIP
 */
const exportCompressed = async (data, filename, options) => {
  try {
    // For now, we'll use a simple approach - in a real implementation,
    // you'd use a library like JSZip
    const exportData = {
      version: EXPORT_VERSIONS.V2,
      exportedAt: new Date().toISOString(),
      exportedFrom: 'NotesApp',
      type: 'compressed_backup',
      originalSize: new Blob([JSON.stringify(data)]).size,
      data,
    };

    // Generate checksum for integrity
    const checksum = generateChecksum(exportData);
    exportData.integrity = {
      checksum,
      algorithm: 'SHA-256',
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create compressed blob (simple implementation)
    // In a real app, use compression library
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const result = await downloadFile(blob, `${filename}_compressed_${getTimestamp()}.json`, 'application/json');
    
    return {
      success: true,
      compressed: true,
      originalSize: exportData.originalSize,
      compressedSize: blob.size,
      filename: result.filename,
      compressionRatio: ((exportData.originalSize - blob.size) / exportData.originalSize * 100).toFixed(2),
    };
  } catch (error) {
    console.error('Compressed export failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export data in chunks for very large datasets
 */
const exportChunked = async (data, filename, options) => {
  const { chunkSize = 10000, onProgress = () => {} } = options;
  const chunks = [];
  const totalChunks = Math.ceil(data.length / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, data.length);
    const chunk = data.slice(start, end);

    const chunkData = {
      version: EXPORT_VERSIONS.V2,
      exportedAt: new Date().toISOString(),
      exportedFrom: 'NotesApp',
      type: 'chunked_backup',
      chunkIndex: i,
      totalChunks,
      totalItems: data.length,
      data: chunk,
    };

    // Generate checksum
    const checksum = generateChecksum(chunkData);
    chunkData.integrity = {
      checksum,
      algorithm: 'SHA-256',
    };

    chunks.push(chunkData);

    // Update progress
    onProgress({
      progress: ((i + 1) / totalChunks) * 100,
      currentChunk: i + 1,
      totalChunks,
    });

    // Yield control to prevent blocking
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  // Create master index file
  const indexData = {
    version: EXPORT_VERSIONS.V2,
    exportedAt: new Date().toISOString(),
    exportedFrom: 'NotesApp',
    type: 'chunked_backup_index',
    totalChunks,
    totalItems: data.length,
    chunks: chunks.map(chunk => ({
      chunkIndex: chunk.chunkIndex,
      checksum: chunk.integrity.checksum,
      itemCount: chunk.data.length,
    })),
  };

  // Download index file
  const indexBlob = new Blob([JSON.stringify(indexData, null, 2)], { type: 'application/json' });
  await downloadFile(indexBlob, `${filename}_index_${getTimestamp()}.json`);

  // Download each chunk
  for (const chunk of chunks) {
    const chunkBlob = new Blob([JSON.stringify(chunk, null, 2)], { type: 'application/json' });
    await downloadFile(chunkBlob, `${filename}_chunk_${chunk.chunkIndex}_${getTimestamp()}.json`);
  }

  return {
    success: true,
    chunked: true,
    totalChunks,
    totalItems: data.length,
    filename: `${filename}_chunked_${getTimestamp()}`,
  };
};

/**
 * Progressive export with progress tracking
 */
export const progressiveExport = async (data, filename, options = {}) => {
  const { onProgress = () => {}, batchSize = 1000 } = options;

  if (!Array.isArray(data)) {
    return await exportToJSON(data, filename, options);
  }

  const total = data.length;
  let processed = 0;
  const chunks = [];

  for (let i = 0; i < total; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    chunks.push(batch);
    processed += batch.length;

    onProgress({
      progress: (processed / total) * 100,
      processed,
      total,
    });

    // Yield control
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  // Combine all chunks
  const exportData = {
    version: EXPORT_VERSIONS.V2,
    exportedAt: new Date().toISOString(),
    exportedFrom: 'NotesApp',
    type: 'progressive_export',
    totalItems: total,
    data: chunks.flat(),
  };

  return await exportToJSON(exportData, filename, options);
};

/**
 * Validate export data before saving
 */
export const validateExportData = (data) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    size: 0,
  };

  try {
    // Check data structure
    if (!data || typeof data !== 'object') {
      validation.isValid = false;
      validation.errors.push('Invalid data structure');
      return validation;
    }

    // Check for circular references
    try {
      JSON.stringify(data);
    } catch (error) {
      validation.isValid = false;
      validation.errors.push('Circular reference detected');
      return validation;
    }

    // Check size
    const size = new Blob([JSON.stringify(data)]).size;
    validation.size = size;

    if (size > 500 * 1024 * 1024) { // 500MB
      validation.warnings.push('Very large export detected (>500MB), consider using chunked export');
    } else if (size > 100 * 1024 * 1024) { // 100MB
      validation.warnings.push('Large export detected (>100MB), compression recommended');
    }

    // Validate specific data types
    if (data.notes && Array.isArray(data.notes)) {
      validateNotesForExport(data.notes, validation);
    }

    if (data.tags && Array.isArray(data.tags)) {
      validateTagsForExport(data.tags, validation);
    }

    if (data.reminders && Array.isArray(data.reminders)) {
      validateRemindersForExport(data.reminders, validation);
    }

  } catch (error) {
    validation.isValid = false;
    validation.errors.push(`Validation failed: ${error.message}`);
  }

  return validation;
};

/**
 * Validate notes for export
 */
const validateNotesForExport = (notes, validation) => {
  notes.forEach((note, index) => {
    if (!note.title && !note.content) {
      validation.warnings.push(`Note ${index}: Empty note detected`);
    }

    if (note.title && note.title.length > 1000) {
      validation.warnings.push(`Note ${index}: Very long title (${note.title.length} chars)`);
    }

    if (note.content && note.content.length > 1000000) {
      validation.warnings.push(`Note ${index}: Very long content (${note.content.length} chars)`);
    }

    if (note.tags && note.tags.length > 50) {
      validation.warnings.push(`Note ${index}: Many tags (${note.tags.length})`);
    }
  });
};

/**
 * Validate tags for export
 */
const validateTagsForExport = (tags, validation) => {
  const tagNames = new Set();
  
  tags.forEach((tag, index) => {
    if (!tag.name) {
      validation.warnings.push(`Tag ${index}: Missing name`);
    } else {
      const lowerName = tag.name.toLowerCase();
      if (tagNames.has(lowerName)) {
        validation.warnings.push(`Tag ${index}: Duplicate name "${tag.name}"`);
      }
      tagNames.add(lowerName);
    }

    if (tag.name && tag.name.length > 100) {
      validation.warnings.push(`Tag ${index}: Very long name (${tag.name.length} chars)`);
    }
  });
};

/**
 * Validate reminders for export
 */
const validateRemindersForExport = (reminders, validation) => {
  const now = new Date();
  
  reminders.forEach((reminder, index) => {
    if (!reminder.reminderTime) {
      validation.warnings.push(`Reminder ${index}: Missing time`);
    } else {
      const reminderTime = new Date(reminder.reminderTime);
      if (isNaN(reminderTime.getTime())) {
        validation.warnings.push(`Reminder ${index}: Invalid time format`);
      } else if (reminderTime < now) {
        validation.warnings.push(`Reminder ${index}: Past reminder time`);
      }
    }

    if (!reminder.noteId) {
      validation.warnings.push(`Reminder ${index}: Missing note ID`);
    }
  });
};

/**
 * Create export manifest
 */
export const createExportManifest = (data, filename, options = {}) => {
  const manifest = {
    version: EXPORT_VERSIONS.V2,
    exportedAt: new Date().toISOString(),
    exportedFrom: 'NotesApp',
    filename,
    ...options,
    summary: {
      totalSize: new Blob([JSON.stringify(data)]).size,
      itemCount: 0,
      dataTypes: [],
    },
  };

  // Analyze data structure
  if (Array.isArray(data)) {
    manifest.summary.itemCount = data.length;
    manifest.summary.dataTypes.push('array');
  } else if (typeof data === 'object') {
    manifest.summary.itemCount = Object.keys(data).length;
    manifest.summary.dataTypes.push('object');
    
    if (data.notes) manifest.summary.dataTypes.push('notes');
    if (data.tags) manifest.summary.dataTypes.push('tags');
    if (data.reminders) manifest.summary.dataTypes.push('reminders');
    if (data.gamification) manifest.summary.dataTypes.push('gamification');
  }

  return manifest;
};