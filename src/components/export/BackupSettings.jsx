import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { createBackup, scheduleAutoBackup, cancelAutoBackup, estimateBackupSize, getBackupRecommendations } from '../../utils/backup';
import { toast } from 'react-toastify';

/**
 * BackupSettings Component
 * Auto-backup configuration and manual backup controls
 */
const BackupSettings = ({ className = '' }) => {
  const { notes } = useSelector(state => state.notes);
  const { settings } = useSelector(state => state.settings);
  const { gamification } = useSelector(state => state.gamification);
  const { tags } = useSelector(state => state.tags);
  const { reminders } = useSelector(state => state.reminders);

  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(false);
  const [backupInterval, setBackupInterval] = useState('daily');
  const [lastBackupDate, setLastBackupDate] = useState(null);
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [recommendations, setRecommendations] = useState([]);

  const state = { notes, settings, gamification, tags, reminders };

  // Calculate estimated backup size
  useEffect(() => {
    setEstimatedSize(estimateBackupSize(state, 'full'));
  }, [notes.length, tags.length, reminders.length]);

  // Get recommendations
  useEffect(() => {
    setRecommendations(getBackupRecommendations({
      lastBackupDate,
      backupCount: 0, // Would come from Appwrite in real implementation
    }));
  }, [lastBackupDate]);

  // Handle manual backup
  const handleManualBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await createBackup({
        type: 'full',
        state,
        onProgress: (progress) => setBackupProgress(progress),
      });

      clearInterval(progressInterval);
      setBackupProgress(100);
      setLastBackupDate(new Date().toISOString());

      // In a real app, this would upload to Appwrite
      // For now, we'll just download the backup
      const blob = new Blob([JSON.stringify(result.backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `notesapp_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Backup created successfully');
      setTimeout(() => {
        setIsBackingUp(false);
        setBackupProgress(0);
      }, 500);

    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Failed to create backup');
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  // Handle auto-backup toggle
  const handleAutoBackupToggle = () => {
    if (isAutoBackupEnabled) {
      cancelAutoBackup();
      toast.info('Auto-backup disabled');
    } else {
      const interval = backupInterval === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
      scheduleAutoBackup({
        type: 'auto_full',
        interval,
        state,
      });
      toast.success('Auto-backup enabled');
    }
    setIsAutoBackupEnabled(!isAutoBackupEnabled);
  };

  // Format file size
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-[#171717] rounded-xl p-6 ${className}`}>
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined">backup</span>
        Backup Settings
      </h3>

      {/* Manual Backup */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-medium">Manual Backup</p>
            <p className="text-gray-500 text-sm">Create an immediate backup of your data</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Estimated size</p>
            <p className="text-white font-medium">{formatSize(estimatedSize)}</p>
          </div>
        </div>

        <button
          onClick={handleManualBackup}
          disabled={isBackingUp || notes.length === 0}
          className="w-full py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isBackingUp ? (
            <>
              <span className="material-symbols-outlined animate-spin">sync</span>
              Backing up... {backupProgress}%
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">download</span>
              Create Backup Now
            </>
          )}
        </button>

        {backupProgress > 0 && (
          <div className="mt-2">
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${backupProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Auto Backup */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-medium">Auto Backup</p>
            <p className="text-gray-500 text-sm">Automatically backup your data</p>
          </div>
          <button
            onClick={handleAutoBackupToggle}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              isAutoBackupEnabled ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                isAutoBackupEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {isAutoBackupEnabled && (
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="interval"
                value="daily"
                checked={backupInterval === 'daily'}
                onChange={(e) => setBackupInterval(e.target.value)}
                className="w-4 h-4 border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300 text-sm">Daily</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="interval"
                value="weekly"
                checked={backupInterval === 'weekly'}
                onChange={(e) => setBackupInterval(e.target.value)}
                className="w-4 h-4 border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300 text-sm">Weekly</span>
            </label>
          </div>
        )}
      </div>

      {/* Last Backup Info */}
      {lastBackupDate && (
        <div className="mb-6 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-500">check_circle</span>
            <span className="text-gray-300 text-sm">
              Last backup: {new Date(lastBackupDate).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <p className="text-gray-400 text-xs mb-2">Recommendations</p>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg ${
                  rec.type === 'warning' ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                }`}
              >
                <p className={`text-sm ${
                  rec.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                }`}>
                  {rec.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Summary */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-xs mb-3">Data Summary</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-800 rounded-lg p-2">
            <span className="text-gray-500">Notes</span>
            <p className="text-white font-medium">{notes.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2">
            <span className="text-gray-500">Tags</span>
            <p className="text-white font-medium">{tags.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2">
            <span className="text-gray-500">Reminders</span>
            <p className="text-white font-medium">{reminders.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2">
            <span className="text-gray-500">Total Size</span>
            <p className="text-white font-medium">{formatSize(estimatedSize)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupSettings;