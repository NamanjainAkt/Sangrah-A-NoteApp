import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { exportToJSON, exportNotesToCSV, exportWithFilters, generateExportPreview } from '../../utils/export';

/**
 * ExportModal Component
 * Modal for exporting notes and data with various options
 */
const ExportModal = ({ isOpen, onClose }) => {
  const { notes } = useSelector(state => state.notes);
  const { settings } = useSelector(state => state.settings);
  const { gamification } = useSelector(state => state.gamification);
  const { tags } = useSelector(state => state.tags);

  const [format, setFormat] = useState('json');
  const [includeSettings, setIncludeSettings] = useState(true);
  const [includeGamification, setIncludeGamification] = useState(false);
  const [includeTags, setIncludeTags] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Get unique tags from notes
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }, [notes]);

  // Generate preview
  const preview = useMemo(() => {
    return generateExportPreview(
      { format, dateRange, tags: selectedTags, status: selectedStatus },
      notes
    );
  }, [notes, format, dateRange, selectedTags, selectedStatus]);

  // Focus trap implementation
  useEffect(() => {
    if (isOpen) {
      // Focus close button when modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);

      // Handle escape key
      const handleEscape = (event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      // Trap focus within modal
      const handleFocusTrap = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
          event.preventDefault();
          closeButtonRef.current?.focus();
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.addEventListener('focusin', handleFocusTrap);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('focusin', handleFocusTrap);
      };
    }
  }, [isOpen, onClose]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const exportState = {
        notes,
        settings,
        gamification,
        tags,
      };

      const options = {
        format,
        includeSettings,
        includeGamification,
        includeTags,
        dateRange: dateRange.start && dateRange.end ? dateRange : null,
        tags: selectedTags,
        status: selectedStatus,
      };

      if (format === 'csv') {
        // Filter notes for CSV export
        let filteredNotes = [...notes];
        
        if (dateRange.start && dateRange.end) {
          const start = new Date(dateRange.start);
          const end = new Date(dateRange.end);
          filteredNotes = filteredNotes.filter(note => {
            const createdAt = new Date(note.$createdAt);
            return createdAt >= start && createdAt <= end;
          });
        }

        if (selectedTags.length > 0) {
          filteredNotes = filteredNotes.filter(note =>
            note.tags && selectedTags.some(tag => note.tags.includes(tag))
          );
        }

        if (selectedStatus.length > 0) {
          filteredNotes = filteredNotes.filter(note => selectedStatus.includes(note.status));
        }

        exportNotesToCSV(filteredNotes, 'notes_export');
      } else {
        exportWithFilters(options, notes, settings, gamification);
      }

      clearInterval(progressInterval);
      setExportProgress(100);

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        onClose();
      }, 500);

    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      aria-describedby="export-modal-description"
    >
      <div 
        className="bg-[#171717] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        ref={modalRef}
        onKeyDown={(e) => {
          // Handle escape key for accessibility
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 id="export-modal-title" className="text-xl font-semibold text-white">Export Data</h3>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-700 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close export dialog"
          >
            <span className="material-symbols-outlined text-gray-400">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <p id="export-modal-description" className="sr-only">
            Configure export options including format, data to include, and filters
          </p>
          
          {/* Format Selection */}
          <div>
            <label className="block text-white font-medium mb-2" id="format-label">
              Export Format
            </label>
            <div 
              className="flex gap-3"
              role="radiogroup"
              aria-labelledby="format-label"
            >
              <button
                onClick={() => setFormat('json')}
                className={`flex-1 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  format === 'json'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
                role="radio"
                aria-checked={format === 'json'}
                aria-describedby="format-description-json"
              >
                <span className="material-symbols-outlined block mx-auto mb-1">code</span>
                <span className="text-sm">JSON</span>
                <span id="format-description-json" className="sr-only">
                  JSON format with full structure and metadata
                </span>
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`flex-1 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  format === 'csv'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
                role="radio"
                aria-checked={format === 'csv'}
                aria-describedby="format-description-csv"
              >
                <span className="material-symbols-outlined block mx-auto mb-1">table_chart</span>
                <span className="text-sm">CSV</span>
                <span id="format-description-csv" className="sr-only">
                  CSV format compatible with spreadsheet applications
                </span>
              </button>
            </div>
          </div>

          {/* Include Options */}
          <div>
            <label className="block text-white font-medium mb-2">
              Include in Export
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSettings}
                  onChange={(e) => setIncludeSettings(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300 text-sm">Settings</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGamification}
                  onChange={(e) => setIncludeGamification(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300 text-sm">Gamification Data</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTags}
                  onChange={(e) => setIncludeTags(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300 text-sm">Tags</span>
              </label>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-white font-medium mb-2">
              Date Range (Optional)
            </label>
            <div className="flex gap-3">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-800 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500 self-center">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-800 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-white font-medium mb-2">
              Filter by Status
            </label>
            <div className="flex flex-wrap gap-2">
              {['todo', 'in-progress', 'done'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    if (selectedStatus.includes(status)) {
                      setSelectedStatus(selectedStatus.filter(s => s !== status));
                    } else {
                      setSelectedStatus([...selectedStatus, status]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${
                    selectedStatus.includes(status)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {status.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-2">Preview</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Notes:</span>
                <span className="text-white ml-2">{preview.totalNotes}</span>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <span className="text-white ml-2">{preview.estimatedSize}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          {isExporting ? (
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Exporting...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">download</span>
                Export Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;