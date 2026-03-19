import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { parseImportFile, validateBackup, validateNotes, processImport, IMPORT_STRATEGIES } from '../../utils/import';
import { createNewNote } from '../../store/notesSlice';
import { toast } from 'react-toastify';

/**
 * ImportModal Component
 * Modal for importing data from JSON backup or CSV files
 */
const ImportModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { notes, status } = useSelector(state => state.notes);
  const { userData } = useSelector(state => state.auth);

  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [format, setFormat] = useState(null);
  const [isBackup, setIsBackup] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [strategy, setStrategy] = useState(IMPORT_STRATEGIES.MERGE);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);
    setValidationResult(null);

    try {
      const result = await parseImportFile(selectedFile);
      setFileContent(result.data);
      setFormat(result.format);
      setIsBackup(result.isBackup || false);

      // Validate the data
      if (result.format === 'json' && result.isBackup) {
        const validation = validateBackup(result.data);
        setValidationResult({
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings,
          type: 'backup',
        });
      } else {
        // For notes array (CSV or JSON array)
        const validation = validateNotes(result.data);
        setValidationResult({
          isValid: validation.isValid,
          errors: validation.errors,
          summary: validation.summary,
          type: 'notes',
        });
      }
    } catch (error) {
      toast.error(`Failed to parse file: ${error.message}`);
      setFile(null);
    }
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    // Create a synthetic event for handleFileSelect
    const syntheticEvent = {
      target: {
        files: [droppedFile],
      },
    };
    await handleFileSelect(syntheticEvent);
  }, [handleFileSelect]);

  // Handle import
  const handleImport = async () => {
    if (!fileContent) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      // Process the import based on strategy
      const result = processImport({
        strategy,
        data: fileContent,
        existingNotes: notes,
        onProgress: (progress) => {
          setImportProgress(Math.min(progress, 80));
        },
      });

      // Import valid notes
      if (result.validNotes && result.validNotes.length > 0) {
        let importedCount = 0;
        
        for (const note of result.validNotes) {
          await dispatch(createNewNote({
            ...note,
            userId: userData?.$id,
            isArchived: false,
            isImportant: false,
            isDeleted: false,
          })).unwrap();
          
          importedCount++;
          setImportProgress(80 + (importedCount / result.validNotes.length) * 15);
        }
      }

      clearInterval(progressInterval);
      setImportProgress(100);

      setImportResult({
        success: true,
        imported: result.validNotes?.length || 0,
        skipped: result.skipped || 0,
        errors: result.errors?.length || 0,
      });

      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(0);
        toast.success(`Successfully imported ${result.validNotes?.length || 0} notes`);
        onClose();
      }, 500);

    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        error: error.message,
      });
      setIsImporting(false);
      setImportProgress(0);
      toast.error(`Import failed: ${error.message}`);
    }
  };

  // Reset state
  const handleReset = () => {
    setFile(null);
    setFileContent(null);
    setFormat(null);
    setIsBackup(false);
    setValidationResult(null);
    setImportResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#171717] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Import Data</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-gray-400">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!file ? (
            /* Drop Zone */
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-gray-500 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".json,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="material-symbols-outlined text-4xl text-gray-500 mb-3">
                upload_file
              </span>
              <p className="text-white font-medium mb-1">
                Drop your file here
              </p>
              <p className="text-gray-500 text-sm">
                or click to browse (JSON, CSV)
              </p>
            </div>
          ) : (
            /* File Info & Validation */
            <>
              {/* File Name */}
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <span className="material-symbols-outlined text-blue-500">
                  {format === 'json' ? 'code' : 'table_chart'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-gray-500 text-xs">
                    {isBackup ? 'Backup file' : `${fileContent?.length || 0} records`}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Validation Result */}
              {validationResult && (
                <div className={`rounded-lg p-4 ${
                  validationResult.isValid 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined ${
                      validationResult.isValid ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {validationResult.isValid ? 'check_circle' : 'error'}
                    </span>
                    <span className={`font-medium ${
                      validationResult.isValid ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {validationResult.isValid ? 'Valid file' : 'Validation issues'}
                    </span>
                  </div>

                  {validationResult.warnings?.length > 0 && (
                    <div className="mt-2">
                      {validationResult.warnings.map((warning, i) => (
                        <p key={i} className="text-yellow-400 text-xs">
                          ⚠ {warning}
                        </p>
                      ))}
                    </div>
                  )}

                  {validationResult.errors?.length > 0 && (
                    <div className="mt-2">
                      {validationResult.errors.map((error, i) => (
                        <p key={i} className="text-red-400 text-xs">
                          ✗ {error}
                        </p>
                      ))}
                    </div>
                  )}

                  {validationResult.summary && (
                    <p className="text-gray-400 text-xs mt-2">
                      {validationResult.summary.valid} valid, {validationResult.summary.invalid} invalid
                    </p>
                  )}
                </div>
              )}

              {/* Import Strategy */}
              {validationResult?.isValid && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    Import Strategy
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(IMPORT_STRATEGIES).map((strat) => (
                      <button
                        key={strat}
                        onClick={() => setStrategy(strat)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          strategy === strat
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <p className="font-medium text-sm capitalize">
                          {strat.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {strat === IMPORT_STRATEGIES.REPLACE && 'Replace all existing data'}
                          {strat === IMPORT_STRATEGIES.MERGE && 'Combine with existing data'}
                          {strat === IMPORT_STRATEGIES.SKIP_DUPLICATES && "Don't import duplicates"}
                          {strat === IMPORT_STRATEGIES.UPDATE_EXISTING && 'Update only existing notes'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div className={`rounded-lg p-4 ${
                  importResult.success 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined ${
                      importResult.success ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {importResult.success ? 'check_circle' : 'error'}
                    </span>
                    <span className={`font-medium ${
                      importResult.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {importResult.success ? 'Import complete' : 'Import failed'}
                    </span>
                  </div>
                  {importResult.success && (
                    <div className="text-sm text-gray-300">
                      <p>Imported: {importResult.imported}</p>
                      {importResult.skipped > 0 && <p>Skipped: {importResult.skipped}</p>}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          {isImporting ? (
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Importing...</span>
                <span>{importProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                disabled={!file}
              >
                Reset
              </button>
              <button
                onClick={handleImport}
                disabled={!file || !validationResult?.isValid || status === 'loading'}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">upload</span>
                Import Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;