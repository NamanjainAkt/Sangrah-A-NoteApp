/**
 * Import utility functions
 * Provides functions for importing data from various formats with versioning and merge strategies
 */

import CryptoJS from 'crypto-js';
import { EXPORT_VERSIONS } from './export';
import { saveToStorage, STORAGE_KEYS_ENUM, CONFLICT_STRATEGIES_ENUM } from './persistence';

/**
 * Parse JSON file content with integrity checking
 * @param {string} content - File content as string
 * @returns {Object} Parsed data with validation
 */
export const parseJSON = (content) => {
  try {
    const data = JSON.parse(content);
    
    // Check version
    const version = data.version;
    if (!version) {
      return {
        success: false,
        data: null,
        error: 'Missing version information in export file',
      };
    }

    // Validate integrity for v2 and above
    if (version !== EXPORT_VERSIONS.V1 && data.integrity) {
      const { checksum, algorithm } = data.integrity;
      if (!checksum) {
        return {
          success: false,
          data: null,
          error: 'Missing integrity checksum',
        };
      }

      // Remove integrity for checksum calculation
      const dataWithoutIntegrity = { ...data };
      delete dataWithoutIntegrity.integrity;

      const calculatedChecksum = CryptoJS.SHA256(JSON.stringify(dataWithoutIntegrity)).toString();
      if (calculatedChecksum !== checksum) {
        return {
          success: false,
          data: null,
          error: 'Data integrity check failed - file may be corrupted',
        };
      }
    }

    return {
      success: true,
      data,
      error: null,
      version,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: `Invalid JSON: ${error.message}`,
    };
  }
};

/**
 * Parse CSV file content
 * @param {string} content - File content as string
 * @returns {Object} Parsed data with validation
 */
export const parseCSV = (content) => {
  try {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      return {
        success: false,
        data: null,
        error: 'CSV file must have at least a header row and one data row',
      };
    }

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] || '';
      });
      return row;
    });

    return {
      success: true,
      data: rows,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: `Invalid CSV: ${error.message}`,
    };
  }
};

/**
 * Parse a single CSV line handling quoted values
 * @param {string} line - CSV line
 * @returns {Array} Parsed values
 */
const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
};

/**
 * Validate backup file structure with comprehensive checks
 * @param {Object} data - Parsed backup data
 * @returns {Object} Validation result
 */
export const validateBackup = (data) => {
  const errors = [];
  const warnings = [];

  // Check version compatibility
  if (!data.version) {
    errors.push('Missing version information');
    return { isValid: false, errors, warnings };
  }

  // Check if version is supported
  const supportedVersions = Object.values(EXPORT_VERSIONS);
  if (!supportedVersions.includes(data.version)) {
    warnings.push(`Unknown version ${data.version}. Attempting to import anyway.`);
  }

  // Check exportedAt
  if (!data.exportedAt) {
    warnings.push('Missing export timestamp');
  } else {
    const exportDate = new Date(data.exportedAt);
    if (isNaN(exportDate.getTime())) {
      warnings.push('Invalid export timestamp format');
    }
  }

  // Check export source
  if (data.exportedFrom && data.exportedFrom !== 'NotesApp') {
    warnings.push(`Export created by ${data.exportedFrom}, may not be fully compatible`);
  }

  // Check data structure based on type
  if (data.type === 'full_state') {
    if (!data.data) {
      errors.push('Missing data field in full state backup');
    } else {
      // Validate each data section
      if (data.data.settings && typeof data.data.settings !== 'object') {
        errors.push('Settings data must be an object');
      }

      if (data.data.notes && !Array.isArray(data.data.notes?.notes)) {
        errors.push('Notes data must contain a notes array');
      }

      if (data.data.gamification && typeof data.data.gamification !== 'object') {
        errors.push('Gamification data must be an object');
      }

      if (data.data.tags && !Array.isArray(data.data.tags?.tags)) {
        errors.push('Tags data must contain a tags array');
      }

      if (data.data.reminders && !Array.isArray(data.data.reminders?.reminders)) {
        errors.push('Reminders data must contain a reminders array');
      }
    }
  } else if (data.type === 'notes_only') {
    if (!Array.isArray(data.data)) {
      errors.push('Notes data must be an array');
    } else {
      // Validate each note
      data.data.forEach((note, index) => {
        if (!note.title && !note.content) {
          errors.push(`Note at index ${index} missing both title and content`);
        }
      });
    }
  } else {
    // Generic backup validation
    if (!data.data) {
      errors.push('Missing data field');
    }
  }

  // Size validation (warn if very large)
  const dataSize = JSON.stringify(data).length;
  if (dataSize > 10 * 1024 * 1024) { // 10MB
    warnings.push('Large import file detected, may take some time to process');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    dataSize,
  };
};

/**
 * Validate imported notes
 * @param {Array} notes - Notes to validate
 * @returns {Object} Validation result
 */
export const validateNotes = (notes) => {
  if (!Array.isArray(notes)) {
    return {
      isValid: false,
      errors: ['Notes must be an array'],
      validNotes: [],
      invalidNotes: [],
    };
  }

  const validNotes = [];
  const invalidNotes = [];
  const errors = [];

  notes.forEach((note, index) => {
    const noteErrors = [];

    if (!note.title || typeof note.title !== 'string') {
      noteErrors.push('Invalid or missing title');
    }

    if (!note.content || typeof note.content !== 'string') {
      noteErrors.push('Invalid or missing content');
    }

    if (note.tags && !Array.isArray(note.tags)) {
      noteErrors.push('Tags must be an array');
    }

    if (note.tasks && !Array.isArray(note.tasks)) {
      noteErrors.push('Tasks must be an array');
    }

    if (noteErrors.length > 0) {
      invalidNotes.push({ note, index, errors: noteErrors });
      errors.push(`Note at index ${index}: ${noteErrors.join(', ')}`);
    } else {
      // Normalize note structure
      validNotes.push({
        title: note.title,
        content: note.content,
        tags: note.tags || [],
        tasks: note.tasks || [],
        status: note.status || 'todo',
        isArchived: note.isArchived || false,
        isImportant: note.isImportant || false,
        isDeleted: false,
        dueDate: note.dueDate || null,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    validNotes,
    invalidNotes,
    summary: {
      total: notes.length,
      valid: validNotes.length,
      invalid: invalidNotes.length,
    },
  };
};

/**
 * Import strategy types with conflict resolution
 */
export const IMPORT_STRATEGIES = {
  REPLACE: 'replace', // Replace all existing data
  MERGE: 'merge', // Merge with existing data intelligently
  SKIP_DUPLICATES: 'skip_duplicates', // Skip if duplicate exists
  UPDATE_EXISTING: 'update_existing', // Update existing, skip new
  CONFIRM: 'confirm', // Ask user for conflicts
};

// Re-export for compatibility
export const CONFLICT_STRATEGIES = CONFLICT_STRATEGIES_ENUM;

/**
 * Advanced merge strategy implementation
 */
export const advancedMergeStrategy = async (existingData, importData, onConflict) => {
  const conflicts = [];
  const merged = { ...existingData };

  // Handle different data types
  for (const [key, value] of Object.entries(importData)) {
    if (key === '_meta') continue; // Skip metadata

    if (merged[key] === undefined) {
      // New data, just add it
      merged[key] = value;
    } else if (Array.isArray(merged[key]) && Array.isArray(value)) {
      // Merge arrays intelligently
      if (key === 'tags' || key === 'reminders' || key === 'goals') {
        // For arrays with unique IDs, merge by ID
        const existingMap = new Map(merged[key].map(item => [item.id || item.$id, item]));
        value.forEach(item => {
          const id = item.id || item.$id;
          if (id && existingMap.has(id)) {
            // Item exists, compare timestamps
            const existing = existingMap.get(id);
            const existingTime = new Date(existing.$updatedAt || existing.updatedAt).getTime();
            const newTime = new Date(item.$updatedAt || item.updatedAt).getTime();
            
            if (newTime > existingTime) {
              existingMap.set(id, item);
            }
          } else {
            // New item
            existingMap.set(id || `temp-${Date.now()}`, item);
          }
        });
        merged[key] = Array.from(existingMap.values());
      } else {
        // For simple arrays, combine and deduplicate
        merged[key] = [...new Set([...merged[key], ...value])];
      }
    } else if (typeof merged[key] === 'object' && typeof value === 'object') {
      // For objects, merge recursively
      if (key === 'gamification') {
        // Special handling for gamification data
        merged[key] = {
          points: Math.max(merged[key].points || 0, value.points || 0),
          level: Math.max(merged[key].level || 1, value.level || 1),
          xp: Math.max(merged[key].xp || 0, value.xp || 0),
          badges: [...new Set([...(merged[key].badges || []), ...(value.badges || [])])],
          currentStreak: Math.max(merged[key].currentStreak || 0, value.currentStreak || 0),
          bestStreak: Math.max(merged[key].bestStreak || 0, value.bestStreak || 0),
          specialStreaks: {
            taskStreak: Math.max(merged[key].specialStreaks?.taskStreak || 0, value.specialStreaks?.taskStreak || 0),
            kanbanStreak: Math.max(merged[key].specialStreaks?.kanbanStreak || 0, value.specialStreaks?.kanbanStreak || 0),
          },
          stats: { ...(merged[key].stats || {}), ...(value.stats || {}) },
          lastActivityDate: getMostRecentDate(merged[key].lastActivityDate, value.lastActivityDate),
        };
      } else {
        merged[key] = { ...merged[key], ...value };
      }
    } else {
      // Simple value, check for conflict
      if (merged[key] !== value) {
        conflicts.push({
          key,
          existing: merged[key],
          incoming: value,
        });
        
        // For now, use incoming value
        merged[key] = value;
      }
    }
  }

  // Handle conflicts if callback provided
  if (conflicts.length > 0 && onConflict) {
    const resolutions = await onConflict(conflicts);
    resolutions.forEach(({ key, resolution }) => {
      if (resolution === 'existing') {
        merged[key] = existingData[key];
      } else if (resolution === 'incoming') {
        merged[key] = importData[key];
      }
      // 'custom' resolution handled in callback
    });
  }

  return merged;
};

/**
 * Get most recent date
 */
const getMostRecentDate = (date1, date2) => {
  if (!date1) return date2;
  if (!date2) return date1;
  return new Date(date1) > new Date(date2) ? date1 : date2;
};

/**
 * Process import based on strategy with rollback capability
 * @param {Object} options - Import options
 * @returns {Object} Import result
 */
export const processImport = async (options) => {
  const {
    strategy = IMPORT_STRATEGIES.MERGE,
    data,
    existingData = {},
    onProgress = () => {},
    onConflict = null,
  } = options;

  // Create backup for rollback
  const backup = { ...existingData };

  try {
    let result;

    switch (strategy) {
      case IMPORT_STRATEGIES.REPLACE:
        result = await importReplace(data, onProgress);
        break;
      case IMPORT_STRATEGIES.SKIP_DUPLICATES:
        result = await importSkipDuplicates(data, existingData, onProgress);
        break;
      case IMPORT_STRATEGIES.UPDATE_EXISTING:
        result = await importUpdateExisting(data, existingData, onProgress);
        break;
      case IMPORT_STRATEGIES.CONFIRM:
        result = await importWithConfirmation(data, existingData, onProgress, onConflict);
        break;
      case IMPORT_STRATEGIES.MERGE:
      default:
        result = await importMergeAdvanced(data, existingData, onProgress, onConflict);
        break;
    }

    return {
      ...result,
      backup,
      canRollback: true,
    };
  } catch (error) {
    // Return backup information for rollback
    return {
      success: false,
      error: error.message,
      backup,
      canRollback: true,
    };
  }
};

/**
 * Import with confirmation for conflicts
 */
const importWithConfirmation = async (data, existingData, onProgress, onConflict) => {
  const conflicts = detectConflicts(existingData, data);
  
  if (conflicts.length > 0) {
    if (!onConflict) {
      throw new Error('Conflicts detected but no conflict handler provided');
    }
    
    const resolutions = await onConflict(conflicts);
    return await applyImportResolutions(data, existingData, resolutions, onProgress);
  }
  
  return await importMergeAdvanced(data, existingData, onProgress);
};

/**
 * Detect conflicts between existing and import data
 */
const detectConflicts = (existing, imported) => {
  const conflicts = [];
  
  for (const [key, value] of Object.entries(imported)) {
    if (existing[key] !== undefined && JSON.stringify(existing[key]) !== JSON.stringify(value)) {
      conflicts.push({
        key,
        type: typeof value,
        existing: existing[key],
        imported: value,
      });
    }
  }
  
  return conflicts;
};

/**
 * Apply user resolutions to conflicts
 */
const applyImportResolutions = async (importData, existingData, resolutions, onProgress) => {
  const resolved = { ...existingData };
  
  resolutions.forEach(({ key, resolution }) => {
    switch (resolution) {
      case 'existing':
        // Keep existing value
        break;
      case 'imported':
        resolved[key] = importData[key];
        break;
      case 'merge':
        if (typeof importData[key] === 'object' && typeof existingData[key] === 'object') {
          resolved[key] = { ...existingData[key], ...importData[key] };
        } else {
          resolved[key] = importData[key];
        }
        break;
      default:
        // Keep existing
        break;
    }
  });
  
  return {
    success: true,
    data: resolved,
    strategy: IMPORT_STRATEGIES.CONFIRM,
    resolvedConflicts: resolutions.length,
  };
};

/**
 * Rollback import using backup
 */
export const rollbackImport = async (backup) => {
  try {
    // Save backup data to all relevant storage locations
    for (const [key, data] of Object.entries(backup)) {
      const storageKey = STORAGE_KEYS_ENUM[key.toUpperCase()];
      if (storageKey) {
        await saveToStorage(storageKey, data, { immediate: true });
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Replace strategy - replace all existing data
 */
const importReplace = (data, onProgress) => {
  const notes = Array.isArray(data) ? data : (data.data || data);
  
  onProgress(50);
  
  const validation = validateNotes(notes);
  
  return {
    strategy: IMPORT_STRATEGIES.REPLACE,
    notes: validation.validNotes,
    ...validation,
  };
};

/**
 * Merge strategy - combine with existing data
 */
const importMerge = (data, existingNotes, onProgress) => {
  const notes = Array.isArray(data) ? data : (data.data || data);
  
  onProgress(50);
  
  const validation = validateNotes(notes);
  
  // Merge with existing notes
  const existingIds = new Set(existingNotes.map(n => n.$id || n.title));
  const newNotes = validation.validNotes.filter(n => !existingIds.has(n.title));
  
  onProgress(100);
  
  return {
    strategy: IMPORT_STRATEGIES.MERGE,
    notes: [...existingNotes, ...newNotes],
    ...validation,
    merged: {
      existing: existingNotes.length,
      imported: newNotes.length,
      skipped: 0,
    },
  };
};

/**
 * Skip duplicates strategy - don't import if title exists
 */
const importSkipDuplicates = (data, existingNotes, onProgress) => {
  const notes = Array.isArray(data) ? data : (data.data || data);
  
  onProgress(50);
  
  const validation = validateNotes(notes);
  const existingTitles = new Set(existingNotes.map(n => n.title.toLowerCase()));
  
  const uniqueNotes = validation.validNotes.filter(n => 
    !existingTitles.has(n.title.toLowerCase())
  );
  
  onProgress(100);
  
  return {
    strategy: IMPORT_STRATEGIES.SKIP_DUPLICATES,
    notes: uniqueNotes,
    ...validation,
    skipped: validation.validNotes.length - uniqueNotes.length,
  };
};

/**
 * Update existing strategy - only update existing notes
 */
const importUpdateExisting = (data, existingNotes, onProgress) => {
  const notes = Array.isArray(data) ? data : (data.data || data);
  
  onProgress(50);
  
  const validation = validateNotes(notes);
  const existingMap = new Map(existingNotes.map(n => [n.title.toLowerCase(), n]));
  
  const updatedNotes = validation.validNotes.filter(n => 
    existingMap.has(n.title.toLowerCase())
  );
  
  onProgress(100);
  
  return {
    strategy: IMPORT_STRATEGIES.UPDATE_EXISTING,
    notes: updatedNotes,
    ...validation,
    updated: updatedNotes.length,
    skipped: validation.validNotes.length - updatedNotes.length,
  };
};

/**
 * Read file as text
 * @param {File} file - File to read
 * @returns {Promise<string>} File content
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
};

/**
 * Detect file format
 * @param {string} content - File content
 * @returns {string} Detected format: 'json' | 'csv' | 'unknown'
 */
export const detectFormat = (content) => {
  const trimmed = content.trim();
  
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    // Try to parse as JSON
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      return 'unknown';
    }
  }
  
  // Check if it looks like CSV (has commas and newlines)
  if (trimmed.includes(',') && trimmed.includes('\n')) {
    return 'csv';
  }
  
  return 'unknown';
};

/**
 * Parse imported file based on format with large file support
 * @param {File} file - File to parse
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Parsed data with format info
 */
export const parseImportFile = async (file, onProgress = () => {}) => {
  // Check file size
  const fileSize = file.size;
  const isLargeFile = fileSize > 10 * 1024 * 1024; // 10MB
  
  if (isLargeFile) {
    console.log(`Processing large file: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
  }

  try {
    // For very large files, use streaming approach
    if (fileSize > 100 * 1024 * 1024) { // 100MB
      return await parseLargeFile(file, onProgress);
    }

    const content = await readFileWithProgress(file, onProgress);
    const format = detectFormat(content);
    
    if (format === 'unknown') {
      return {
        success: false,
        format: 'unknown',
        error: 'Unable to detect file format',
        data: null,
      };
    }

    let parseResult;
    
    if (format === 'json') {
      parseResult = await parseJSONLarge(content, isLargeFile);
    } else {
      parseResult = await parseCSVLarge(content, isLargeFile);
    }

    if (!parseResult.success) {
      return {
        success: false,
        format,
        error: parseResult.error,
        data: null,
      };
    }

    // If it's a backup file, extract the data
    if (format === 'json' && parseResult.data.data) {
      return {
        success: true,
        format,
        isBackup: true,
        backupType: parseResult.data.type || 'unknown',
        data: parseResult.data.data,
        metadata: {
          version: parseResult.data.version,
          exportedAt: parseResult.data.exportedAt,
          fileSize,
          itemCount: countItems(parseResult.data.data),
        },
      };
    }

    return {
      success: true,
      format,
      isBackup: false,
      data: parseResult.data,
      metadata: {
        fileSize,
        itemCount: Array.isArray(parseResult.data) ? parseResult.data.length : 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `File parsing failed: ${error.message}`,
      data: null,
    };
  }
};

/**
 * Read file with progress tracking
 */
const readFileWithProgress = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const chunkSize = 1024 * 1024; // 1MB chunks
    let offset = 0;
    
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };

    // For progress tracking with large files
    if (file.size > 10 * 1024 * 1024) {
      const readChunk = () => {
        const chunk = file.slice(offset, offset + chunkSize);
        reader.readAsText(chunk);
        
        offset += chunkSize;
        const progress = Math.min(100, (offset / file.size) * 100);
        onProgress({ loaded: offset, total: file.size, progress });
      };
      
      readChunk();
    } else {
      reader.readAsText(file);
    }
  });
};

/**
 * Parse very large files using streaming
 */
const parseLargeFile = async (file, onProgress) => {
  return {
    success: false,
    error: 'File too large for direct import (>100MB). Please use chunked import or split the file.',
    data: null,
    suggestions: [
      'Split the file into smaller chunks',
      'Use the chunked import option',
      'Remove unnecessary data to reduce file size',
    ],
  };
};

/**
 * Parse JSON with memory optimization for large files
 */
const parseJSONLarge = async (content, isLargeFile) => {
  try {
    // For large files, validate structure before full parse
    if (isLargeFile) {
      // Quick validation
      const trimmed = content.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        return {
          success: false,
          error: 'Invalid JSON format',
          data: null,
        };
      }
    }

    const data = JSON.parse(content);
    
    // Check version
    const version = data.version;
    if (!version) {
      return {
        success: false,
        data: null,
        error: 'Missing version information in export file',
      };
    }

    // Validate integrity for v2 and above
    if (version !== EXPORT_VERSIONS.V1 && data.integrity) {
      const { checksum, algorithm } = data.integrity;
      if (!checksum) {
        return {
          success: false,
          data: null,
          error: 'Missing integrity checksum',
        };
      }

      // Remove integrity for checksum calculation
      const dataWithoutIntegrity = { ...data };
      delete dataWithoutIntegrity.integrity;

      const calculatedChecksum = CryptoJS.SHA256(JSON.stringify(dataWithoutIntegrity)).toString();
      if (calculatedChecksum !== checksum) {
        return {
          success: false,
          data: null,
          error: 'Data integrity check failed - file may be corrupted',
        };
      }
    }

    return {
      success: true,
      data,
      error: null,
      version,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: `Invalid JSON: ${error.message}`,
    };
  }
};

/**
 * Parse CSV with memory optimization for large files
 */
const parseCSVLarge = async (content, isLargeFile) => {
  try {
    const lines = content.split('\n');
    if (lines.length < 2) {
      return {
        success: false,
        data: null,
        error: 'CSV file must have at least a header row and one data row',
      };
    }

    const headers = parseCSVLine(lines[0]);
    const rows = [];
    let processedRows = 0;
    const batchSize = isLargeFile ? 1000 : lines.length;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] || '';
      });
      rows.push(row);
      
      processedRows++;

      // Yield control for very large files
      if (isLargeFile && processedRows % batchSize === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return {
      success: true,
      data: rows,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: `Invalid CSV: ${error.message}`,
    };
  }
};

/**
 * Count items in data for metadata
 */
const countItems = (data) => {
  if (Array.isArray(data)) return data.length;
  if (typeof data === 'object') {
    return Object.values(data).reduce((count, value) => {
      return count + (Array.isArray(value) ? value.length : 0);
    }, 0);
  }
  return 0;
};

/**
 * Preview import data (first N items)
 */
export const previewImportData = async (file, maxItems = 100) => {
  const result = await parseImportFile(file);
  
  if (!result.success) {
    return result;
  }

  const preview = {
    ...result,
    preview: {
      items: [],
      structure: {},
      summary: {},
    },
  };

  // Create preview based on data structure
  if (result.isBackup) {
    // Full state backup preview
    preview.preview.structure = Object.keys(result.data);
    preview.preview.summary = {
      sections: Object.keys(result.data).length,
    };

    // Show first few items from each section
    Object.entries(result.data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        preview.preview.items.push(...value.slice(0, maxItems / Object.keys(result.data).length));
      }
    });
  } else if (Array.isArray(result.data)) {
    // Notes array preview
    preview.preview.items = result.data.slice(0, maxItems);
    preview.preview.summary = {
      totalItems: result.data.length,
      previewItems: Math.min(maxItems, result.data.length),
    };
  }

  return preview;
};

/**
 * Validate and clean import data
 */
export const validateAndCleanImportData = (data, options = {}) => {
  const {
    maxTitleLength = 200,
    maxContentLength = 100000,
    maxTagNameLength = 100,
    maxTagsPerNote = 50,
    maxTasksPerNote = 100,
  } = options;

  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    cleaned: data,
  };

  try {
    // Handle different data structures
    if (Array.isArray(data)) {
      validation.cleaned = validateNotesArray(data, validation, options);
    } else if (typeof data === 'object') {
      validation.cleaned = validateObjectData(data, validation, options);
    }

    validation.isValid = validation.errors.length === 0;
  } catch (error) {
    validation.isValid = false;
    validation.errors.push(`Validation failed: ${error.message}`);
  }

  return validation;
};

/**
 * Validate notes array
 */
const validateNotesArray = (notes, validation, options) => {
  return notes.map((note, index) => {
    const cleanedNote = { ...note };
    const noteErrors = [];

    // Validate title
    if (!note.title || typeof note.title !== 'string') {
      cleanedNote.title = 'Untitled Note';
      validation.warnings.push(`Note ${index}: Missing title, set to "Untitled Note"`);
    } else if (note.title.length > options.maxTitleLength) {
      cleanedNote.title = note.title.substring(0, options.maxTitleLength) + '...';
      validation.warnings.push(`Note ${index}: Title truncated (too long)`);
    }

    // Validate content
    if (!note.content || typeof note.content !== 'string') {
      cleanedNote.content = '';
      validation.warnings.push(`Note ${index}: Missing content, set to empty`);
    } else if (note.content.length > options.maxContentLength) {
      cleanedNote.content = note.content.substring(0, options.maxContentLength);
      validation.warnings.push(`Note ${index}: Content truncated (too long)`);
    }

    // Validate tags
    if (note.tags && !Array.isArray(note.tags)) {
      cleanedNote.tags = [];
      validation.warnings.push(`Note ${index}: Invalid tags format, set to empty array`);
    } else if (note.tags && note.tags.length > options.maxTagsPerNote) {
      cleanedNote.tags = note.tags.slice(0, options.maxTagsPerNote);
      validation.warnings.push(`Note ${index}: Too many tags, truncated`);
    }

    // Validate tasks
    if (note.tasks && !Array.isArray(note.tasks)) {
      cleanedNote.tasks = [];
      validation.warnings.push(`Note ${index}: Invalid tasks format, set to empty array`);
    } else if (note.tasks && note.tasks.length > options.maxTasksPerNote) {
      cleanedNote.tasks = note.tasks.slice(0, options.maxTasksPerNote);
      validation.warnings.push(`Note ${index}: Too many tasks, truncated`);
    }

    // Validate dates
    if (note.dueDate) {
      const dueDate = new Date(note.dueDate);
      if (isNaN(dueDate.getTime())) {
        delete cleanedNote.dueDate;
        validation.warnings.push(`Note ${index}: Invalid due date removed`);
      }
    }

    // Set safe defaults
    cleanedNote.status = note.status || 'todo';
    cleanedNote.isArchived = Boolean(note.isArchived);
    cleanedNote.isImportant = Boolean(note.isImportant);
    cleanedNote.isDeleted = false;

    if (noteErrors.length > 0) {
      validation.errors.push(`Note ${index}: ${noteErrors.join(', ')}`);
    }

    return cleanedNote;
  });
};

/**
 * Validate object data (full backup)
 */
const validateObjectData = (data, validation, options) => {
  const cleaned = { ...data };

  // Validate tags
  if (cleaned.tags) {
    cleaned.tags = cleaned.tags.map(tag => {
      if (!tag.name || tag.name.length > options.maxTagNameLength) {
        validation.warnings.push(`Tag: Name invalid or too long, skipped`);
        return null;
      }
      return tag;
    }).filter(Boolean);
  }

  // Validate notes
  if (cleaned.notes && cleaned.notes.notes) {
    cleaned.notes.notes = validateNotesArray(cleaned.notes.notes, validation, options);
  }

  // Validate reminders
  if (cleaned.reminders && cleaned.reminders.reminders) {
    cleaned.reminders.reminders = cleaned.reminders.reminders.map(reminder => {
      if (!reminder.reminderTime || !reminder.noteId) {
        validation.warnings.push('Reminder: Missing required fields, skipped');
        return null;
      }
      
      const reminderTime = new Date(reminder.reminderTime);
      if (isNaN(reminderTime.getTime())) {
        validation.warnings.push('Reminder: Invalid date, skipped');
        return null;
      }
      
      return reminder;
    }).filter(Boolean);
  }

  return cleaned;
};

/**
 * Handle duplicate detection with user prompts
 */
export const detectDuplicates = (importData, existingData = {}) => {
  const duplicates = {
    notes: [],
    tags: [],
    reminders: [],
  };

  // Detect duplicate notes
  if (importData.notes && existingData.notes) {
    const existingTitles = new Map();
    existingData.notes.forEach(note => {
      existingTitles.set(note.title.toLowerCase(), note);
    });

    importData.notes.forEach(note => {
      const existing = existingTitles.get(note.title.toLowerCase());
      if (existing) {
        duplicates.notes.push({
          import: note,
          existing: existing,
          type: 'title_match',
        });
      }
    });
  }

  // Detect duplicate tags
  if (importData.tags && existingData.tags) {
    const existingNames = new Map();
    existingData.tags.forEach(tag => {
      existingNames.set(tag.name.toLowerCase(), tag);
    });

    importData.tags.forEach(tag => {
      const existing = existingNames.get(tag.name.toLowerCase());
      if (existing) {
        duplicates.tags.push({
          import: tag,
          existing: existing,
          type: 'name_match',
        });
      }
    });
  }

  // Detect duplicate reminders
  if (importData.reminders && existingData.reminders) {
    const existingReminders = new Map();
    existingData.reminders.forEach(reminder => {
      const key = `${reminder.noteId}-${reminder.reminderTime}`;
      existingReminders.set(key, reminder);
    });

    importData.reminders.forEach(reminder => {
      const key = `${reminder.noteId}-${reminder.reminderTime}`;
      const existing = existingReminders.get(key);
      if (existing) {
        duplicates.reminders.push({
          import: reminder,
          existing: existing,
          type: 'exact_match',
        });
      }
    });
  }

  return duplicates;
};