// Simple sound effects using Web Audio API
// These are basic beep/chime sounds for achievements

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  // Play a simple beep sound
  playBeep(frequency = 800, duration = 200, type = 'sine') {
    if (!this.audioContext || !this.enabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  // Badge earned sound - pleasant chime
  playBadgeEarned() {
    this.playBeep(523, 300, 'sine'); // C5
    setTimeout(() => this.playBeep(659, 300, 'sine'), 150); // E5
    setTimeout(() => this.playBeep(784, 400, 'sine'), 300); // G5
  }

  // Level up sound - ascending notes
  playLevelUp() {
    this.playBeep(440, 200, 'triangle'); // A4
    setTimeout(() => this.playBeep(554, 200, 'triangle'), 150); // C#5
    setTimeout(() => this.playBeep(659, 200, 'triangle'), 300); // E5
    setTimeout(() => this.playBeep(880, 400, 'triangle'), 450); // A5
  }

  // Streak milestone sound - rhythmic pattern
  playStreakMilestone() {
    this.playBeep(600, 150, 'square');
    setTimeout(() => this.playBeep(700, 150, 'square'), 200);
    setTimeout(() => this.playBeep(800, 300, 'square'), 400);
  }

  // Goal achieved sound - success fanfare
  playGoalAchieved() {
    this.playBeep(523, 200, 'sine'); // C5
    setTimeout(() => this.playBeep(587, 200, 'sine'), 100); // D5
    setTimeout(() => this.playBeep(659, 400, 'sine'), 200); // E5
  }

  // Enable/disable sounds
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// Create singleton instance
const soundManager = new SoundManager();

// Initialize on first user interaction (required by browsers)
const initSounds = () => {
  soundManager.init();
  document.removeEventListener('click', initSounds);
  document.removeEventListener('keydown', initSounds);
};

// Listen for first user interaction
document.addEventListener('click', initSounds);
document.addEventListener('keydown', initSounds);

export default soundManager;