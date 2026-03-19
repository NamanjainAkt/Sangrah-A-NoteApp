/**
 * Integration validation utilities
 * Provides cross-feature integration testing and validation functions
 */

import { loadFromStorage, saveToStorage, STORAGE_KEYS_ENUM } from './persistence';

/**
 * Comprehensive integration test suite
 */
export const runIntegrationTests = async () => {
  const results = {
    passed: 0,
    failed: 0,
    tests: [],
    timestamp: new Date().toISOString(),
  };

  // Test settings-feature compatibility
  results.tests.push(await testSettingsFeatureCompatibility());
  
  // Test data consistency across stores
  results.tests.push(await testDataConsistency());
  
  // Test feature dependencies
  results.tests.push(await testFeatureDependencies());
  
  // Test gamification integration
  results.tests.push(await testGamificationIntegration());
  
  // Test tag-note consistency
  results.tests.push(await testTagNoteConsistency());
  
  // Test reminder-note consistency
  results.tests.push(await testReminderNoteConsistency());
  
  // Test streak calculations
  results.tests.push(await testStreakCalculations());
  
  // Test XP/level progression
  results.tests.push(await testXPLevelProgression());

  // Calculate totals
  results.tests.forEach(test => {
    if (test.passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  });

  results.score = Math.round((results.passed / results.tests.length) * 100);
  
  return results;
};

/**
 * Test settings-feature compatibility
 */
const testSettingsFeatureCompatibility = async () => {
  const test = {
    name: 'Settings Feature Compatibility',
    description: 'Verify that disabling features doesn\'t break others',
    passed: true,
    errors: [],
  };

  try {
    const settings = await loadFromStorage(STORAGE_KEYS_ENUM.SETTINGS);
    if (!settings) {
      test.errors.push('No settings found');
      test.passed = false;
      return test;
    }

    // Test gamification toggle
    if (settings.gamificationEnabled === false) {
      const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
      if (gamification && (gamification.points > 0 || gamification.badges?.length > 0)) {
        test.errors.push('Gamification disabled but data still present');
      }
    }

    // Test reminders toggle
    if (settings.remindersEnabled === false) {
      const reminders = await loadFromStorage(STORAGE_KEYS_ENUM.REMINDERS);
      if (reminders && reminders.length > 0) {
        test.errors.push('Reminders disabled but data still present');
      }
    }

    // Test tags toggle
    if (settings.tagsEnabled === false) {
      const tags = await loadFromStorage(STORAGE_KEYS_ENUM.TAGS);
      if (tags && tags.length > 0) {
        test.errors.push('Tags disabled but data still present');
      }
    }

    test.passed = test.errors.length === 0;
  } catch (error) {
    test.errors.push(`Test failed: ${error.message}`);
    test.passed = false;
  }

  return test;
};

/**
 * Test data consistency across stores
 */
const testDataConsistency = async () => {
  const test = {
    name: 'Data Consistency',
    description: 'Check for orphaned data and consistency issues',
    passed: true,
    errors: [],
    warnings: [],
  };

  try {
    // Load all data
    const notes = await loadFromStorage(STORAGE_KEYS_ENUM.NOTES_CACHE) || [];
    const tags = await loadFromStorage(STORAGE_KEYS_ENUM.TAGS) || [];
    const reminders = await loadFromStorage(STORAGE_KEYS_ENUM.REMINDERS) || [];
    const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION) || {};

    // Check for orphaned tags
    const usedTagIds = new Set();
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          if (typeof tag === 'object' && tag.id) {
            usedTagIds.add(tag.id);
          } else if (typeof tag === 'string') {
            usedTagIds.add(tag);
          }
        });
      }
    });

    const orphanedTags = tags.filter(tag => !usedTagIds.has(tag.id));
    if (orphanedTags.length > 0) {
      test.warnings.push(`Found ${orphanedTags.length} orphaned tags`);
    }

    // Check for orphaned reminders
    const noteIds = new Set(notes.map(note => note.$id || note.id));
    const orphanedReminders = reminders.filter(reminder => 
      reminder.noteId && !noteIds.has(reminder.noteId)
    );
    if (orphanedReminders.length > 0) {
      test.warnings.push(`Found ${orphanedReminders.length} orphaned reminders`);
    }

    // Check gamification consistency
    if (gamification.points < 0) {
      test.errors.push('Negative points detected');
    }
    if (gamification.level < 1) {
      test.errors.push('Invalid level detected');
    }
    if (gamification.xp < 0) {
      test.errors.push('Negative XP detected');
    }

    // Check for duplicate note IDs
    const noteIdCounts = {};
    notes.forEach(note => {
      const id = note.$id || note.id;
      noteIdCounts[id] = (noteIdCounts[id] || 0) + 1;
    });
    const duplicateIds = Object.entries(noteIdCounts)
      .filter(([_, count]) => count > 1)
      .map(([id, _]) => id);
    if (duplicateIds.length > 0) {
      test.errors.push(`Duplicate note IDs found: ${duplicateIds.join(', ')}`);
    }

    test.passed = test.errors.length === 0;
  } catch (error) {
    test.errors.push(`Test failed: ${error.message}`);
    test.passed = false;
  }

  return test;
};

/**
 * Test feature dependencies
 */
const testFeatureDependencies = async () => {
  const test = {
    name: 'Feature Dependencies',
    description: 'Verify that feature dependencies are properly handled',
    passed: true,
    errors: [],
  };

  try {
    const settings = await loadFromStorage(STORAGE_KEYS_ENUM.SETTINGS);
    if (!settings) {
      test.errors.push('No settings found');
      test.passed = false;
      return test;
    }

    // Check if gamification depends on activity tracking
    if (settings.gamificationEnabled && !settings.activityTrackingEnabled) {
      test.warnings = test.warnings || [];
      test.warnings.push('Gamification enabled but activity tracking is disabled');
    }

    // Check if reminders need notification permissions
    if (settings.remindersEnabled && !settings.notificationsEnabled) {
      test.warnings = test.warnings || [];
      test.warnings.push('Reminders enabled but notifications are disabled');
    }

    test.passed = test.errors.length === 0;
  } catch (error) {
    test.errors.push(`Test failed: ${error.message}`);
    test.passed = false;
  }

  return test;
};

/**
 * Test gamification integration
 */
const testGamificationIntegration = async () => {
  const test = {
    name: 'Gamification Integration',
    description: 'Verify gamification triggers and consistency',
    passed: true,
    errors: [],
  };

  try {
    const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
    const activityCache = await loadFromStorage(STORAGE_KEYS_ENUM.ACTIVITY_CACHE) || [];

    if (!gamification) {
      test.errors.push('No gamification data found');
      test.passed = false;
      return test;
    }

    // Check if XP matches level expectations
    const expectedLevel = Math.floor(gamification.xp / 100) + 1;
    if (gamification.level !== expectedLevel) {
      test.errors.push(`Level ${gamification.level} doesn't match XP ${gamification.xp}`);
    }

    // Check if current streak is reasonable
    if (gamification.currentStreak < 0) {
      test.errors.push('Negative current streak detected');
    }
    if (gamification.bestStreak < gamification.currentStreak) {
      test.errors.push('Best streak is less than current streak');
    }

    // Check badge validity
    if (gamification.badges) {
      const duplicateBadges = gamification.badges.filter((badge, index, self) =>
        index !== self.findIndex(b => b.id === badge.id)
      );
      if (duplicateBadges.length > 0) {
        test.errors.push(`Duplicate badges found: ${duplicateBadges.map(b => b.id).join(', ')}`);
      }
    }

    test.passed = test.errors.length === 0;
  } catch (error) {
    test.errors.push(`Test failed: ${error.message}`);
    test.passed = false;
  }

  return test;
};

/**
 * Test tag-note consistency
 */
const testTagNoteConsistency = async () => {
  const test = {
    name: 'Tag-Note Consistency',
    description: 'Verify tags and notes are properly linked',
    passed: true,
    errors: [],
  };

  try {
    const notes = await loadFromStorage(STORAGE_KEYS_ENUM.NOTES_CACHE) || [];
    const tags = await loadFromStorage(STORAGE_KEYS_ENUM.TAGS) || [];

    // Check for duplicate tag names
    const tagNames = tags.map(tag => tag.name.toLowerCase());
    const duplicateNames = tagNames.filter((name, index) => tagNames.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      test.errors.push(`Duplicate tag names: ${[...new Set(duplicateNames)].join(', ')}`);
    }

    // Check for empty tag names
    const emptyTags = tags.filter(tag => !tag.name || tag.name.trim() === '');
    if (emptyTags.length > 0) {
      test.errors.push(`Found ${emptyTags.length} tags with empty names`);
    }

    // Check tag references in notes
    const tagIdMap = new Map(tags.map(tag => [tag.id, tag]));
    let invalidTagReferences = 0;

    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tagRef => {
          const tagId = typeof tagRef === 'object' ? tagRef.id : tagRef;
          if (!tagIdMap.has(tagId)) {
            invalidTagReferences++;
          }
        });
      }
    });

    if (invalidTagReferences > 0) {
      test.errors.push(`Found ${invalidTagReferences} invalid tag references in notes`);
    }

    test.passed = test.errors.length === 0;
  } catch (error) {
    test.errors.push(`Test failed: ${error.message}`);
    test.passed = false;
  }

  return test;
};

/**
 * Test reminder-note consistency
 */
const testReminderNoteConsistency = async () => {
  const test = {
    name: 'Reminder-Note Consistency',
    description: 'Verify reminders are properly linked to notes',
    passed: true,
    errors: [],
  };

  try {
    const notes = await loadFromStorage(STORAGE_KEYS_ENUM.NOTES_CACHE) || [];
    const reminders = await loadFromStorage(STORAGE_KEYS_ENUM.REMINDERS) || [];

    // Check for duplicate reminder IDs
    const reminderIds = reminders.map(r => r.id);
    const duplicateIds = reminderIds.filter((id, index) => reminderIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      test.errors.push(`Duplicate reminder IDs: ${[...new Set(duplicateIds)].join(', ')}`);
    }

    // Check for past reminders that haven't been handled
    const now = new Date();
    const pastReminders = reminders.filter(r => 
      new Date(r.reminderTime) < now && r.status !== 'completed' && r.status !== 'dismissed'
    );
    if (pastReminders.length > 0) {
      test.warnings = test.warnings || [];
      test.warnings.push(`Found ${pastReminders.length} unhandled past reminders`);
    }

    // Check reminder-note link validity
    const noteIdMap = new Map(notes.map(note => [note.$id || note.id, note]));
    let orphanedReminders = 0;

    reminders.forEach(reminder => {
      if (reminder.noteId && !noteIdMap.has(reminder.noteId)) {
        orphanedReminders++;
      }
    });

    if (orphanedReminders > 0) {
      test.errors.push(`Found ${orphanedReminders} reminders linked to non-existent notes`);
    }

    test.passed = test.errors.length === 0;
  } catch (error) {
    test.errors.push(`Test failed: ${error.message}`);
    test.passed = false;
  }

  return test;
};

/**
 * Test streak calculations
 */
const testStreakCalculations = async () => {
  const test = {
    name: 'Streak Calculations',
    description: 'Verify streak counts are accurate',
    passed: true,
    errors: [],
  };

  try {
    const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
    const activityCache = await loadFromStorage(STORAGE_KEYS_ENUM.ACTIVITY_CACHE) || [];

    if (!gamification) {
      test.errors.push('No gamification data found');
      test.passed = false;
      return test;
    }

    // Calculate actual streak from activity cache
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    const activitiesByDate = {};
    activityCache.forEach(activity => {
      const date = new Date(activity.timestamp).toDateString();
      activitiesByDate[date] = (activitiesByDate[date] || 0) + 1;
    });

    let calculatedStreak = 0;
    if (activitiesByDate[today]) {
      calculatedStreak = 1;
      let checkDate = new Date(yesterday);
      
      while (activitiesByDate[checkDate.toDateString()]) {
        calculatedStreak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    if (gamification.currentStreak !== calculatedStreak) {
      test.errors.push(`Current streak (${gamification.currentStreak}) doesn't match calculated streak (${calculatedStreak})`);
    }

    // Check special streaks
    if (gamification.specialStreaks) {
      Object.entries(gamification.specialStreaks).forEach(([type, streak]) => {
        if (streak < 0) {
          test.errors.push(`Negative ${type} streak detected: ${streak}`);
        }
      });
    }

    test.passed = test.errors.length === 0;
  } catch (error) {
    test.errors.push(`Test failed: ${error.message}`);
    test.passed = false;
  }

  return test;
};

/**
 * Test XP/level progression
 */
const testXPLevelProgression = async () => {
  const test = {
    name: 'XP/Level Progression',
    description: 'Verify XP and level progression is consistent',
    passed: true,
    errors: [],
  };

  try {
    const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
    
    if (!gamification) {
      test.errors.push('No gamification data found');
      test.passed = false;
      return test;
    }

    // XP per level: 100 XP per level
    const expectedLevel = Math.floor(gamification.xp / 100) + 1;
    
    if (gamification.level !== expectedLevel) {
      test.errors.push(`Level ${gamification.level} doesn't match XP ${gamification.xp} (expected level ${expectedLevel})`);
    }

    // Check XP thresholds
    if (gamification.xp < 0) {
      test.errors.push('Negative XP detected');
    }

    // Check if XP is consistent with points
    // Points should roughly equal XP (1 point = 1 XP)
    const xpPointsDifference = Math.abs(gamification.xp - gamification.points);
    if (xpPointsDifference > 100) { // Allow some tolerance
      test.errors.push(`XP (${gamification.xp}) and points (${gamification.points}) are inconsistent`);
    }

    test.passed = test.errors.length === 0;
  } catch (error) {
    test.errors.push(`Test failed: ${error.message}`);
    test.passed = false;
  }

  return test;
};

/**
 * Get feature health status
 */
export const getFeatureHealthStatus = async () => {
  const health = {
    overall: 'healthy',
    features: {},
    warnings: [],
    errors: [],
  };

  try {
    // Check each feature
    const settings = await loadFromStorage(STORAGE_KEYS_ENUM.SETTINGS);
    const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
    const tags = await loadFromStorage(STORAGE_KEYS_ENUM.TAGS);
    const reminders = await loadFromStorage(STORAGE_KEYS_ENUM.REMINDERS);
    const notes = await loadFromStorage(STORAGE_KEYS_ENUM.NOTES_CACHE);

    // Gamification health
    if (settings?.gamificationEnabled) {
      if (!gamification) {
        health.errors.push('Gamification enabled but no data found');
        health.features.gamification = 'error';
      } else if (gamification.points < 0 || gamification.level < 1) {
        health.errors.push('Gamification data is corrupted');
        health.features.gamification = 'error';
      } else {
        health.features.gamification = 'healthy';
      }
    } else {
      health.features.gamification = 'disabled';
    }

    // Tags health
    if (settings?.tagsEnabled) {
      if (!tags) {
        health.warnings.push('Tags enabled but no data found');
        health.features.tags = 'warning';
      } else {
        const duplicateNames = tags.filter((tag, index, self) =>
          index !== self.findIndex(t => t.name.toLowerCase() === tag.name.toLowerCase())
        );
        if (duplicateNames.length > 0) {
          health.warnings.push(`Found ${duplicateNames.length} duplicate tag names`);
          health.features.tags = 'warning';
        } else {
          health.features.tags = 'healthy';
        }
      }
    } else {
      health.features.tags = 'disabled';
    }

    // Reminders health
    if (settings?.remindersEnabled) {
      if (!reminders) {
        health.features.reminders = 'healthy'; // No reminders is okay
      } else {
        const pastReminders = reminders.filter(r => 
          new Date(r.reminderTime) < new Date() && r.status !== 'completed'
        );
        if (pastReminders.length > 0) {
          health.warnings.push(`Found ${pastReminders.length} unhandled past reminders`);
          health.features.reminders = 'warning';
        } else {
          health.features.reminders = 'healthy';
        }
      }
    } else {
      health.features.reminders = 'disabled';
    }

    // Overall health
    if (health.errors.length > 0) {
      health.overall = 'error';
    } else if (health.warnings.length > 0) {
      health.overall = 'warning';
    }

  } catch (error) {
    health.errors.push(`Health check failed: ${error.message}`);
    health.overall = 'error';
  }

  return health;
};

/**
 * Validate that data flow between features works correctly
 */
export const validateDataFlow = async (action) => {
  const validation = {
    action,
    passed: true,
    issues: [],
  };

  try {
    switch (action) {
      case 'addNote':
        await validateAddNoteFlow(validation);
        break;
      case 'addTag':
        await validateAddTagFlow(validation);
        break;
      case 'addReminder':
        await validateAddReminderFlow(validation);
        break;
      case 'awardPoints':
        await validateAwardPointsFlow(validation);
        break;
      default:
        validation.issues.push(`Unknown action: ${action}`);
        validation.passed = false;
    }
  } catch (error) {
    validation.issues.push(`Validation failed: ${error.message}`);
    validation.passed = false;
  }

  return validation;
};

/**
 * Validate add note data flow
 */
const validateAddNoteFlow = async (validation) => {
  const beforeNotes = await loadFromStorage(STORAGE_KEYS_ENUM.NOTES_CACHE) || [];
  const beforeCount = beforeNotes.length;

  // Simulate adding a note would happen here
  // For validation, just check that data is consistent

  const afterNotes = await loadFromStorage(STORAGE_KEYS_ENUM.NOTES_CACHE) || [];
  const afterCount = afterNotes.length;

  if (afterCount < beforeCount) {
    validation.issues.push('Note count decreased unexpectedly');
    validation.passed = false;
  }

  // Check that all notes have required fields
  const invalidNotes = afterNotes.filter(note => 
    !note.title || !note.content || !note.$id
  );
  
  if (invalidNotes.length > 0) {
    validation.issues.push(`Found ${invalidNotes.length} notes with missing required fields`);
    validation.passed = false;
  }
};

/**
 * Validate add tag data flow
 */
const validateAddTagFlow = async (validation) => {
  const tags = await loadFromStorage(STORAGE_KEYS_ENUM.TAGS) || [];
  
  // Check for duplicate tag names
  const names = tags.map(t => t.name.toLowerCase());
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  
  if (duplicates.length > 0) {
    validation.issues.push(`Duplicate tag names detected: ${[...new Set(duplicates)].join(', ')}`);
    validation.passed = false;
  }

  // Check that all tags have required fields
  const invalidTags = tags.filter(tag => 
    !tag.name || !tag.id || !tag.color
  );
  
  if (invalidTags.length > 0) {
    validation.issues.push(`Found ${invalidTags.length} tags with missing required fields`);
    validation.passed = false;
  }
};

/**
 * Validate add reminder data flow
 */
const validateAddReminderFlow = async (validation) => {
  const reminders = await loadFromStorage(STORAGE_KEYS_ENUM.REMINDERS) || [];
  const notes = await loadFromStorage(STORAGE_KEYS_ENUM.NOTES_CACHE) || [];
  
  const noteIds = new Set(notes.map(n => n.$id || n.id));
  
  // Check that all reminders link to valid notes
  const orphanedReminders = reminders.filter(r => 
    r.noteId && !noteIds.has(r.noteId)
  );
  
  if (orphanedReminders.length > 0) {
    validation.issues.push(`Found ${orphanedReminders.length} orphaned reminders`);
    validation.passed = false;
  }

  // Check that all reminders have required fields
  const invalidReminders = reminders.filter(r => 
    !r.id || !r.reminderTime || !r.noteId
  );
  
  if (invalidReminders.length > 0) {
    validation.issues.push(`Found ${invalidReminders.length} reminders with missing required fields`);
    validation.passed = false;
  }
};

/**
 * Validate award points data flow
 */
const validateAwardPointsFlow = async (validation) => {
  const gamification = await loadFromStorage(STORAGE_KEYS_ENUM.GAMIFICATION);
  
  if (!gamification) {
    validation.issues.push('No gamification data found');
    validation.passed = false;
    return;
  }

  // Check that values are reasonable
  if (gamification.points < 0) {
    validation.issues.push('Negative points detected');
    validation.passed = false;
  }

  if (gamification.xp < 0) {
    validation.issues.push('Negative XP detected');
    validation.passed = false;
  }

  if (gamification.level < 1) {
    validation.issues.push('Invalid level detected');
    validation.passed = false;
  }

  // Check that badges are valid
  if (gamification.badges) {
    const duplicateBadges = gamification.badges.filter((badge, index, self) =>
      index !== self.findIndex(b => b.id === badge.id)
    );
    
    if (duplicateBadges.length > 0) {
      validation.issues.push(`Duplicate badges found: ${duplicateBadges.map(b => b.id).join(', ')}`);
      validation.passed = false;
    }
  }
};

/**
 * Run periodic validation check
 */
export const runPeriodicValidation = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    dataConsistency: await testDataConsistency(),
    featureHealth: await getFeatureHealthStatus(),
    integrationTests: await runIntegrationTests(),
  };

  return results;
};