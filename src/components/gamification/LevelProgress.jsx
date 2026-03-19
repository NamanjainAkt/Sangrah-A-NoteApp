import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Confetti from './Confetti';

const LevelProgress = ({ showConfetti = false, onConfettiComplete }) => {
  const { enableGamification } = useSelector(state => state.settings);
  const { level, xp: currentXP } = useSelector(state => state.gamification);
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  // Calculate progress to next level with guard for division by zero
  const xpForCurrentLevel = (level - 1) * 100;
  const xpForNextLevel = level * 100;
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  // Guard against division by zero (edge case at max level)
  const progressPercent = xpNeededForNext === 0 ? 100 : Math.round((xpInCurrentLevel / xpNeededForNext) * 100);
  const xpToNextLevel = xpForNextLevel - currentXP;

  // Trigger confetti on level up
  useEffect(() => {
    if (showConfetti) {
      setConfettiTrigger(true);
    }
  }, [showConfetti]);

  if (!enableGamification) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-[#171717] rounded-xl p-6 hover:bg-[#2a2a2a] transition-colors shadow-lg"
    >
      {/* Level Display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={showConfetti ? {
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{ duration: 0.6, times: [0, 0.3, 0.6, 1] }}
            className="text-6xl"
          >
            {level}
          </motion.div>
          <div>
            <h3 className="text-white font-bold text-xl">Level {level}</h3>
            <p className="text-gray-400 text-sm">
              {xpToNextLevel > 0 ? `${xpToNextLevel} XP to next level` : 'Max level reached!'}
            </p>
          </div>
        </div>

        {/* Circular Progress Bar */}
        <div className="w-20 h-20">
          <CircularProgressbar
            value={progressPercent}
            text={`${progressPercent}%`}
            styles={buildStyles({
              textSize: '16px',
              pathColor: progressPercent === 100 ? '#10B981' : '#3B82F6',
              textColor: '#FFFFFF',
              trailColor: '#374151',
              backgroundColor: '#1F2937',
            })}
          />
        </div>
      </div>

      {/* Linear Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-3 rounded-full ${
            progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'
          }`}
        />
      </div>

      {/* XP Details */}
      <div className="flex justify-between text-sm text-gray-400">
        <span>{xpInCurrentLevel} / {xpNeededForNext} XP</span>
        <span>Total: {currentXP} XP</span>
      </div>

      {/* Confetti Effect */}
      <Confetti
        trigger={confettiTrigger}
        onComplete={() => {
          setConfettiTrigger(false);
          if (onConfettiComplete) onConfettiComplete();
        }}
      />
    </motion.div>
  );
};

export default LevelProgress;