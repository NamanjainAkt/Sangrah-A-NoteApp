import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateSettings } from '../../store/timerSlice';
import { selectTimerSettings } from '../../store/timerSlice';

/**
 * TimerSettings Component
 * Modal for customizing timer work/break durations and sound settings
 */
const TimerSettings = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const timerSettings = useSelector(selectTimerSettings);
  
  const [workMinutes, setWorkMinutes] = useState(Math.floor(timerSettings.workDuration / 60));
  const [breakMinutes, setBreakMinutes] = useState(Math.floor(timerSettings.breakDuration / 60));
  const [soundEnabled, setSoundEnabled] = useState(timerSettings.soundEnabled);

  const handleSave = () => {
    dispatch(updateSettings({
      workDuration: workMinutes * 60,
      breakDuration: breakMinutes * 60,
      soundEnabled,
    }));
    onClose();
  };

  const handleReset = () => {
    setWorkMinutes(25);
    setBreakMinutes(5);
    setSoundEnabled(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#171717] rounded-2xl w-full max-w-md p-6 animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Timer Settings</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-gray-400">close</span>
          </button>
        </div>

        {/* Work Duration */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-2">
            Work Duration
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="120"
              value={workMinutes}
              onChange={(e) => setWorkMinutes(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="bg-gray-800 rounded-lg px-4 py-2 min-w-[80px] text-center">
              <span className="text-white font-medium">{workMinutes}</span>
              <span className="text-gray-400 text-sm ml-1">min</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 min</span>
            <span>120 min</span>
          </div>
        </div>

        {/* Break Duration */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-2">
            Break Duration
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="30"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="bg-gray-800 rounded-lg px-4 py-2 min-w-[80px] text-center">
              <span className="text-white font-medium">{breakMinutes}</span>
              <span className="text-gray-400 text-sm ml-1">min</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 min</span>
            <span>30 min</span>
          </div>
        </div>

        {/* Sound Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Sound Notifications</p>
              <p className="text-gray-400 text-sm">Play sounds when timer ends</p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                soundEnabled ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-2">Quick Presets</p>
          <div className="flex gap-2">
            {[
              { work: 25, break: 5, label: 'Pomodoro' },
              { work: 50, break: 10, label: 'Deep Work' },
              { work: 90, break: 15, label: 'Ultra Focus' },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setWorkMinutes(preset.work);
                  setBreakMinutes(preset.break);
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  workMinutes === preset.work && breakMinutes === preset.break
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimerSettings;