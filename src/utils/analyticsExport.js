import Papa from 'papaparse';
import { format } from 'date-fns';

/**
 * Analytics Export Utility
 * Helper functions for exporting analytics data
 */

/**
 * Export analytics data to CSV format
 * @param {Array} activityData - Activity data to export
 * @param {Object} options - Export options
 * @returns {Blob} CSV file blob
 */
export const exportToCSV = (activityData, options = {}) => {
  const { includeHeaders = true, dateFormat = 'yyyy-MM-dd' } = options;

  // Transform data for CSV
  const csvData = activityData.map(day => ({
    Date: day.date,
    'Notes Created': day.notesCreated || 0,
    'Tasks Completed': day.tasksCompleted || 0,
    'Kanban Moves': day.kanbanMoves || 0,
    'Streak Days': day.streakDays || 0,
    'Total Activity': day.totalActivity || 0,
  }));

  // Convert to CSV
  const csv = Papa.unparse(csvData, {
    quotes: true,
    header: includeHeaders,
  });

  // Create blob
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  return blob;
};

/**
 * Export analytics data to JSON format
 * @param {Array} activityData - Activity data to export
 * @param {Object} metadata - Additional metadata to include
 * @returns {Blob} JSON file blob
 */
export const exportToJSON = (activityData, metadata = {}) => {
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    metadata: {
      totalRecords: activityData.length,
      ...metadata,
    },
    activityData,
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  return blob;
};

/**
 * Download file from blob
 * @param {Blob} blob - File blob to download
 * @param {string} filename - Name for the downloaded file
 */
export const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate filename for analytics export
 * @param {string} format - Export format ('csv' or 'json')
 * @param {Object} options - Additional options for filename
 * @returns {string} Generated filename
 */
export const generateExportFilename = (format, options = {}) => {
  const { prefix = 'analytics', timeFilter = 'all' } = options;
  const date = format(new Date(), 'yyyy-MM-dd_HHmmss');
  return `${prefix}_export_${timeFilter}_${date}.${format}`;
};

export default {
  exportToCSV,
  exportToJSON,
  downloadFile,
  generateExportFilename,
};