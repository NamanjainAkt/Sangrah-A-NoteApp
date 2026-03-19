/**
 * Timer utility functions
 * Provides helper functions for timer operations
 */

/**
 * Format seconds to MM:SS or HH:MM:SS
 * @param {number} seconds - Time in seconds
 * @param {boolean} showHours - Whether to show hours
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds, showHours = false) => {
  if (seconds < 0) seconds = 0;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (showHours || hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format seconds to human readable duration
 * @param {number} seconds - Time in seconds
 * @returns {string} Human readable duration
 */
export const formatDuration = (seconds) => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${minutes}m`;
};

/**
 * Convert minutes to seconds
 * @param {number} minutes - Time in minutes
 * @returns {number} Time in seconds
 */
export const minutesToSeconds = (minutes) => minutes * 60;

/**
 * Convert seconds to minutes
 * @param {number} seconds - Time in seconds
 * @returns {number} Time in minutes (rounded down)
 */
export const secondsToMinutes = (seconds) => Math.floor(seconds / 60);

/**
 * Calculate session completion percentage
 * @param {number} timeLeft - Time remaining in seconds
 * @param {number} totalDuration - Total session duration in seconds
 * @returns {number} Percentage complete (0-100)
 */
export const calculateProgress = (timeLeft, totalDuration) => {
  if (totalDuration === 0) return 0;
  const elapsed = totalDuration - timeLeft;
  return Math.round((elapsed / totalDuration) * 100);
};

/**
 * Get session type label
 * @param {string} sessionType - 'work' or 'break'
 * @returns {string} Human readable session type
 */
export const getSessionLabel = (sessionType) => {
  return sessionType === 'work' ? 'Focus Time' : 'Break Time';
};

/**
 * Check if a session is long work session (45+ minutes)
 * @param {number} workDuration - Work duration in seconds
 * @returns {boolean} Whether this is a long session
 */
export const isLongSession = (workDuration) => {
  return workDuration >= 45 * 60;
};

/**
 * Sound notification types
 */
export const SOUND_TYPES = {
  SESSION_COMPLETE: 'session_complete',
  BREAK_COMPLETE: 'break_complete',
  WARNING: 'warning',
  ALARM: 'alarm',
};

/**
 * Play a sound notification
 * @param {string} soundType - Type of sound to play
 */
export const playSound = (soundType) => {
  // Create audio context for generating sounds
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  
  if (!AudioContext) {
    console.warn('AudioContext not supported');
    return;
  }
  
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Configure sound based on type
  switch (soundType) {
    case SOUND_TYPES.SESSION_COMPLETE:
      // Pleasant ascending chime
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.3); // C6
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
      break;
      
    case SOUND_TYPES.BREAK_COMPLETE:
      // Gentle descending tone
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime); // G5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.2); // C5
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
      break;
      
    case SOUND_TYPES.WARNING:
      // Soft double beep
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.35);
      break;
      
    case SOUND_TYPES.ALARM:
    default:
      // Urgent alarm sound
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
      break;
  }
};

/**
 * Calculate total focus time for today
 * @param {Array} sessionHistory - Array of completed sessions
 * @returns {number} Total focus time in seconds for today
 */
export const calculateTodayFocusTime = (sessionHistory) => {
  const today = new Date().toISOString().split('T')[0];
  
  return sessionHistory
    .filter(session => 
      session.type === 'work' && 
      session.completedAt.startsWith(today)
    )
    .reduce((total, session) => total + session.duration, 0);
};

/**
 * Calculate weekly focus time
 * @param {Array} sessionHistory - Array of completed sessions
 * @returns {number} Total focus time in seconds for this week
 */
export const calculateWeeklyFocusTime = (sessionHistory) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  return sessionHistory
    .filter(session => 
      session.type === 'work' && 
      new Date(session.completedAt) >= startOfWeek
    )
    .reduce((total, session) => total + session.duration, 0);
};

/**
 * Get recommended break duration based on work session length
 * @param {number} workDuration - Work duration in seconds
 * @returns {number} Recommended break duration in seconds
 */
export const getRecommendedBreakDuration = (workDuration) => {
  if (workDuration >= 60 * 60) {
    return 15 * 60; // 15 minutes for 1+ hour sessions
  } else if (workDuration >= 45 * 60) {
    return 10 * 60; // 10 minutes for 45+ minute sessions
  } else if (workDuration >= 30 * 60) {
    return 7 * 60; // 7 minutes for 30+ minute sessions
  }
  return 5 * 60; // 5 minutes for shorter sessions
};