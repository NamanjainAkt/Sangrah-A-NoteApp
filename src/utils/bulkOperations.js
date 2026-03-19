/**
 * Bulk operations utilities
 * Provides accessibility improvements and progress tracking for bulk operations
 */

/**
 * Bulk operation manager with accessibility support
 */
export class BulkOperationManager {
  constructor() {
    this.activeOperations = new Map();
    this.announcer = this.createScreenReaderAnnouncer();
  }

  /**
   * Create screen reader announcer
   */
  createScreenReaderAnnouncer() {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('class', 'sr-only');
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(announcer);
    return announcer;
  }

  /**
   * Announce operation to screen readers
   */
  announce(message, priority = 'polite') {
    if (!this.announcer) return;

    // Create temporary announcer for high priority messages
    if (priority === 'assertive') {
      const urgentAnnouncer = document.createElement('div');
      urgentAnnouncer.setAttribute('aria-live', 'assertive');
      urgentAnnouncer.setAttribute('aria-atomic', 'true');
      urgentAnnouncer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      urgentAnnouncer.textContent = message;
      document.body.appendChild(urgentAnnouncer);
      
      setTimeout(() => {
        document.body.removeChild(urgentAnnouncer);
      }, 1000);
    } else {
      this.announcer.textContent = message;
    }
  }

  /**
   * Start a bulk operation
   */
  startOperation(operationId, operation) {
    const operationInfo = {
      id: operationId,
      type: operation.type,
      totalItems: operation.totalItems,
      processedItems: 0,
      startTime: Date.now(),
      cancelRequested: false,
      ...operation,
    };

    this.activeOperations.set(operationId, operationInfo);

    // Announce operation start
    this.announce(
      `Starting ${operation.type} operation on ${operation.totalItems} items`,
      'assertive'
    );

    return operationInfo;
  }

  /**
   * Update operation progress
   */
  updateProgress(operationId, processedItems, itemDetails = null) {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    operation.processedItems = processedItems;
    const progress = Math.round((processedItems / operation.totalItems) * 100);
    const remaining = operation.totalItems - processedItems;

    // Announce progress at key milestones
    if (progress === 25 || progress === 50 || progress === 75 || progress === 100) {
      this.announce(
        `${operation.type}: ${progress}% complete, ${remaining} items remaining`
      );
    }

    // Announce specific item details if provided
    if (itemDetails && processedItems % 10 === 0) {
      this.announce(
        `Processing: ${itemDetails}`
      );
    }

    return {
      progress,
      processed: processedItems,
      remaining,
      operation,
    };
  }

  /**
   * Complete operation
   */
  completeOperation(operationId, result) {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    const duration = Date.now() - operation.startTime;
    
    this.announce(
      `${operation.type} operation completed. Processed ${operation.processedItems} items in ${Math.round(duration / 1000)} seconds`,
      'assertive'
    );

    // Show completion toast
    this.showToast({
      type: 'success',
      title: 'Bulk Operation Complete',
      message: `Successfully processed ${operation.processedItems} items`,
      duration: 5000,
    });

    this.activeOperations.delete(operationId);
    return result;
  }

  /**
   * Handle operation error
   */
  handleOperationError(operationId, error) {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return;

    this.announce(
      `Error in ${operation.type} operation: ${error.message}`,
      'assertive'
    );

    this.showToast({
      type: 'error',
      title: 'Bulk Operation Failed',
      message: error.message,
      duration: 8000,
    });

    this.activeOperations.delete(operationId);
  }

  /**
   * Cancel operation
   */
  cancelOperation(operationId) {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return false;

    operation.cancelRequested = true;
    
    this.announce(
      `Cancelling ${operation.type} operation...`,
      'assertive'
    );

    this.showToast({
      type: 'warning',
      title: 'Cancelling Operation',
      message: 'Please wait while the operation is cancelled...',
      duration: 3000,
    });

    return true;
  }

  /**
   * Get active operations
   */
  getActiveOperations() {
    return Array.from(this.activeOperations.values());
  }

  /**
   * Show toast notification
   */
  showToast(options) {
    // This would integrate with your existing toast system
    if (window.showToast) {
      window.showToast(options);
    } else {
      // Fallback console logging
      console.log('Toast:', options);
    }
  }
}

// Create singleton instance
export const bulkOperationManager = new BulkOperationManager();

/**
 * Manage focus during bulk operations
 */
export class FocusManager {
  constructor() {
    this.originalFocus = null;
    this.focusTrap = null;
  }

  /**
   * Store original focus and trap focus within container
   */
  trapFocus(containerElement) {
    this.originalFocus = document.activeElement;
    
    // Create focus trap
    const focusableElements = containerElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    this.focusTrap = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    containerElement.addEventListener('keydown', this.focusTrap);
    firstElement.focus();
  }

  /**
   * Release focus trap and restore original focus
   */
  releaseFocus(containerElement) {
    if (this.focusTrap) {
      containerElement.removeEventListener('keydown', this.focusTrap);
      this.focusTrap = null;
    }

    if (this.originalFocus) {
      this.originalFocus.focus();
      this.originalFocus = null;
    }
  }

  /**
   * Announce focus changes for screen readers
   */
  announceFocusChange(element) {
    const announcement = element.getAttribute('aria-label') || 
                        element.textContent || 
                        element.placeholder || 
                        'Element focused';
    
    bulkOperationManager.announce(announcement);
  }
}

export const focusManager = new FocusManager();

/**
 * Bulk tag operations with accessibility
 */
export class BulkTagOperations {
  constructor() {
    this.selectedTags = new Set();
    this.operationType = null;
  }

  /**
   * Start bulk tag operation
   */
  async startBulkTagOperation(tags, operationType, options = {}) {
    const operationId = `bulk-tags-${Date.now()}`;
    const totalItems = tags.length;

    bulkOperationManager.startOperation(operationId, {
      type: `Bulk Tag ${operationType}`,
      totalItems,
      operationType,
      ...options,
    });

    try {
      const results = [];
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        const operation = this.activeOperations.get(operationId);
        
        // Check if operation was cancelled
        if (operation?.cancelRequested) {
          bulkOperationManager.announce('Operation cancelled by user');
          return { cancelled: true, processed: i };
        }

        // Process individual tag
        const result = await this.processTag(tag, operationType, options);
        results.push(result);

        // Update progress
        bulkOperationManager.updateProgress(operationId, i + 1, tag.name);

        // Yield control to prevent blocking
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      return bulkOperationManager.completeOperation(operationId, { results });
    } catch (error) {
      bulkOperationManager.handleOperationError(operationId, error);
      throw error;
    }
  }

  /**
   * Process individual tag
   */
  async processTag(tag, operationType, options) {
    switch (operationType) {
      case 'delete':
        return await this.deleteTag(tag);
      case 'rename':
        return await this.renameTag(tag, options.newName);
      case 'merge':
        return await this.mergeTag(tag, options.targetTag);
      case 'color':
        return await this.changeTagColor(tag, options.color);
      default:
        throw new Error(`Unknown operation type: ${operationType}`);
    }
  }

  /**
   * Delete tag
   */
  async deleteTag(tag) {
    // Implementation would call your tag service
    bulkOperationManager.announce(`Deleting tag: ${tag.name}`);
    // await tagService.deleteTag(tag.id);
    return { success: true, tag, action: 'deleted' };
  }

  /**
   * Rename tag
   */
  async renameTag(tag, newName) {
    bulkOperationManager.announce(`Renaming tag "${tag.name}" to "${newName}"`);
    // await tagService.renameTag(tag.id, newName);
    return { success: true, tag, action: 'renamed', newName };
  }

  /**
   * Merge tag
   */
  async mergeTag(tag, targetTag) {
    bulkOperationManager.announce(`Merging "${tag.name}" into "${targetTag.name}"`);
    // await tagService.mergeTag(tag.id, targetTag.id);
    return { success: true, tag, targetTag, action: 'merged' };
  }

  /**
   * Change tag color
   */
  async changeTagColor(tag, color) {
    bulkOperationManager.announce(`Changing color for "${tag.name}"`);
    // await tagService.updateTagColor(tag.id, color);
    return { success: true, tag, color, action: 'color-changed' };
  }
}

export const bulkTagOperations = new BulkTagOperations();

/**
 * Bulk note operations with accessibility
 */
export class BulkNoteOperations {
  constructor() {
    this.selectedNotes = new Set();
  }

  /**
   * Start bulk note operation
   */
  async startBulkNoteOperation(notes, operationType, options = {}) {
    const operationId = `bulk-notes-${Date.now()}`;
    const totalItems = notes.length;

    // Show confirmation for destructive operations
    if (['delete', 'archive'].includes(operationType)) {
      const confirmed = await this.showConfirmationDialog(
        `Are you sure you want to ${operationType} ${totalItems} notes?`,
        operationType
      );
      
      if (!confirmed) {
        bulkOperationManager.announce('Operation cancelled by user');
        return { cancelled: true };
      }
    }

    bulkOperationManager.startOperation(operationId, {
      type: `Bulk Note ${operationType}`,
      totalItems,
      operationType,
      ...options,
    });

    try {
      const results = [];
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const operation = bulkOperationManager.activeOperations.get(operationId);
        
        if (operation?.cancelRequested) {
          bulkOperationManager.announce('Operation cancelled by user');
          return { cancelled: true, processed: i };
        }

        const result = await this.processNote(note, operationType, options);
        results.push(result);

        bulkOperationManager.updateProgress(operationId, i + 1, note.title);

        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      return bulkOperationManager.completeOperation(operationId, { results });
    } catch (error) {
      bulkOperationManager.handleOperationError(operationId, error);
      throw error;
    }
  }

  /**
   * Process individual note
   */
  async processNote(note, operationType, options) {
    switch (operationType) {
      case 'delete':
        return await this.deleteNote(note);
      case 'archive':
        return await this.archiveNote(note);
      case 'restore':
        return await this.restoreNote(note);
      case 'addTags':
        return await this.addTagsToNote(note, options.tags);
      case 'removeTags':
        return await this.removeTagsFromNote(note, options.tags);
      case 'changeStatus':
        return await this.changeNoteStatus(note, options.status);
      default:
        throw new Error(`Unknown operation type: ${operationType}`);
    }
  }

  /**
   * Delete note
   */
  async deleteNote(note) {
    bulkOperationManager.announce(`Deleting note: ${note.title}`);
    // await noteService.deleteNote(note.id);
    return { success: true, note, action: 'deleted' };
  }

  /**
   * Archive note
   */
  async archiveNote(note) {
    bulkOperationManager.announce(`Archiving note: ${note.title}`);
    // await noteService.archiveNote(note.id);
    return { success: true, note, action: 'archived' };
  }

  /**
   * Restore note
   */
  async restoreNote(note) {
    bulkOperationManager.announce(`Restoring note: ${note.title}`);
    // await noteService.restoreNote(note.id);
    return { success: true, note, action: 'restored' };
  }

  /**
   * Add tags to note
   */
  async addTagsToNote(note, tags) {
    const tagNames = tags.map(t => t.name).join(', ');
    bulkOperationManager.announce(`Adding tags to note: ${tagNames}`);
    // await noteService.addTagsToNote(note.id, tags);
    return { success: true, note, tags, action: 'tags-added' };
  }

  /**
   * Remove tags from note
   */
  async removeTagsFromNote(note, tags) {
    const tagNames = tags.map(t => t.name).join(', ');
    bulkOperationManager.announce(`Removing tags from note: ${tagNames}`);
    // await noteService.removeTagsFromNote(note.id, tags);
    return { success: true, note, tags, action: 'tags-removed' };
  }

  /**
   * Change note status
   */
  async changeNoteStatus(note, status) {
    bulkOperationManager.announce(`Changing status for note: ${note.title} to ${status}`);
    // await noteService.updateNoteStatus(note.id, status);
    return { success: true, note, status, action: 'status-changed' };
  }

  /**
   * Show confirmation dialog
   */
  async showConfirmationDialog(message, operationType) {
    return new Promise((resolve) => {
      // This would integrate with your existing dialog system
      const confirmed = window.confirm(
        `${message}\n\nThis action cannot be undone.`
      );
      resolve(confirmed);
    });
  }
}

export const bulkNoteOperations = new BulkNoteOperations();

/**
 * Export/Import accessibility helpers
 */
export class ExportImportAccessibility {
  /**
   * Announce export completion
   */
  announceExportCompletion(filename, size) {
    const sizeText = this.formatFileSize(size);
    bulkOperationManager.announce(
      `Export completed successfully. File "${filename}" saved (${sizeText})`,
      'assertive'
    );
  }

  /**
   * Announce import progress
   */
  announceImportProgress(processed, total, currentFile = null) {
    const progress = Math.round((processed / total) * 100);
    const message = currentFile 
      ? `Importing ${currentFile}: ${progress}% complete`
      : `Import progress: ${progress}% complete`;
    
    bulkOperationManager.announce(message);
  }

  /**
   * Announce import completion
   */
  announceImportCompletion(results) {
    const { total, imported, skipped, errors } = results;
    let message = `Import completed. `;
    
    if (errors > 0) {
      message += `${errors} errors. `;
    }
    
    message += `${imported} items imported, ${skipped} skipped`;
    
    bulkOperationManager.announce(message, 'assertive');
  }

  /**
   * Format file size for announcements
   */
  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const exportImportAccessibility = new ExportImportAccessibility();

/**
 * Settings accessibility helpers
 */
export class SettingsAccessibility {
  /**
   * Announce setting change
   */
  announceSettingChange(settingName, newValue, oldValue) {
    const message = `${settingName} changed from ${oldValue} to ${newValue}`;
    bulkOperationManager.announce(message);
  }

  /**
   * Announce feature toggle
   */
  announceFeatureToggle(featureName, enabled) {
    const message = `${featureName} ${enabled ? 'enabled' : 'disabled'}`;
    
    // Announce at higher priority for feature toggles
    bulkOperationManager.announce(message, enabled ? 'assertive' : 'polite');

    // Show additional context for important features
    if (['gamification', 'reminders', 'notifications'].includes(featureName)) {
      setTimeout(() => {
        const context = this.getFeatureContext(featureName, enabled);
        bulkOperationManager.announce(context);
      }, 500);
    }
  }

  /**
   * Get feature context for announcements
   */
  getFeatureContext(featureName, enabled) {
    const contexts = {
      gamification: enabled 
        ? 'Points, badges, and achievements will now be tracked'
        : 'Progress tracking and achievements will no longer be recorded',
      reminders: enabled
        ? 'Notifications for scheduled tasks will be shown'
        : 'Scheduled reminders will be paused',
      notifications: enabled
        ? 'App notifications will be displayed'
        : 'All notifications will be silenced',
      tags: enabled
        ? 'Tags can be created and assigned to notes'
        : 'Existing tags will be hidden but preserved',
    };

    return contexts[featureName] || '';
  }

  /**
   * Announce integration test results
   */
  announceTestResults(results) {
    const { passed, failed, score } = results;
    let message = `Integration tests completed. `;
    
    if (score === 100) {
      message += 'All tests passed';
    } else {
      message += `${passed} tests passed, ${failed} tests failed. Score: ${score}%`;
    }
    
    bulkOperationManager.announce(message, 'assertive');
  }
}

export const settingsAccessibility = new SettingsAccessibility();