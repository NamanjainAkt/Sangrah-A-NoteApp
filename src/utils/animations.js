export const badgeEarned = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: 'spring', duration: 0.5 }
};

export const levelUp = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.2, 1] },
  transition: { duration: 0.6, times: [0, 0.5, 1] }
};

export const pointsFloat = {
  initial: { y: 0, opacity: 1 },
  animate: { y: -50, opacity: 0 },
  transition: { duration: 1.5, ease: 'easeOut' }
};

export const streakMilestone = {
  initial: { scale: 1, rotate: 0 },
  animate: { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] },
  transition: { duration: 0.8, times: [0, 0.3, 0.6, 1] }
};

export const goalAchieved = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: 'spring', duration: 0.6 }
};

export const confettiBurst = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
  transition: { duration: 0.3 }
};

export const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(255, 215, 0, 0.3)',
      '0 0 40px rgba(255, 215, 0, 0.6)',
      '0 0 20px rgba(255, 215, 0, 0.3)'
    ]
  },
  transition: { duration: 2, repeat: Infinity }
};