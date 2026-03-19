import React, { memo } from 'react';
import { motion } from 'framer-motion';

/**
 * Streak Tracker Component
 * Displays current streak, best streak, and special streaks
 */
const StreakTracker = memo(({ 
  currentStreak = 0, 
  bestStreak = 0,
  specialStreaks = {} 
}) => {
  // Get motivational message based on streak length
  const getMotivationalMessage = () => {
    if (currentStreak === 0) {
      return "Start your streak today!";
    } else if (currentStreak < 7) {
      return "Great start! Keep it going!";
    } else if (currentStreak < 30) {
      return "You're on fire! Keep the momentum!";
    } else if (currentStreak < 100) {
      return "Amazing consistency! You're a productivity machine!";
    } else {
      return "Legendary status! You're unstoppable!";
    }
  };

  const specialStreakData = [
    { 
      key: 'taskStreak', 
      label: 'Task Streak', 
      icon: 'check_circle',
      color: '#39d353',
      value: specialStreaks.taskStreak || 0 
    },
    { 
      key: 'kanbanStreak', 
      label: 'Kanban Streak', 
      icon: 'view_kanban',
      color: '#3b82f6',
      value: specialStreaks.kanbanStreak || 0 
    },
    { 
      key: 'noteStreak', 
      label: 'Note Streak', 
      icon: 'note',
      color: '#f59e0b',
      value: specialStreaks.noteStreak || 0 
    }
  ];

  return (
    <div className="streak-tracker" style={{
      backgroundColor: '#171717',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      {/* Main Streak Display */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        {/* Current Streak */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px'
          }}>
            {/* Fire icon background */}
            <motion.div
              animate={currentStreak > 0 ? { 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: currentStreak > 0 ? '#f59e0b20' : '#2a2a2a',
                borderRadius: '50%'
              }}
            >
              <span className="material-symbols-outlined" style={{ 
                fontSize: '40px',
                color: currentStreak > 0 ? '#f59e0b' : '#6e7681',
                filter: currentStreak > 0 ? 'drop-shadow(0 0 8px #f59e0b80)' : 'none'
              }}>
                local_fire_department
              </span>
            </motion.div>
          </div>

          <div>
            <div style={{ 
              fontSize: '42px', 
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1
            }}>
              {currentStreak}
              <span style={{ 
                fontSize: '16px', 
                color: '#8b949e',
                marginLeft: '4px',
                fontWeight: 400
              }}>
                days
              </span>
            </div>
            <div style={{ 
              color: '#8b949e', 
              fontSize: '14px',
              marginTop: '4px'
            }}>
              Current Streak
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: '1px',
          height: '60px',
          backgroundColor: '#2a2a2a'
        }} />

        {/* Best Streak */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#39d35320',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ 
              fontSize: '28px',
              color: '#39d353'
            }}>
              emoji_events
            </span>
          </div>
          <div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 600,
              color: '#ffffff'
            }}>
              {bestStreak}
            </div>
            <div style={{ 
              color: '#8b949e', 
              fontSize: '13px' 
            }}>
              Best Streak
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div style={{
          flex: 1,
          minWidth: '200px',
          textAlign: 'right'
        }}>
          <div style={{
            color: '#f59e0b',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px'
          }}>
            <motion.span
              animate={currentStreak > 0 ? { 
                opacity: [0.5, 1, 0.5]
              } : {}}
              transition={{ 
                duration: 2, 
                repeat: Infinity 
              }}
              className="material-symbols-outlined"
            >
              auto_awesome
            </motion.span>
            {getMotivationalMessage()}
          </div>
        </div>
      </div>

      {/* Special Streaks */}
      {Object.values(specialStreaks).some(v => v > 0) && (
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #2a2a2a'
        }}>
          <div style={{ 
            color: '#8b949e', 
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px'
          }}>
            Special Streaks
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {specialStreakData.map((streak) => (
              streak.value > 0 && (
                <div
                  key={streak.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: `${streak.color}15`,
                    padding: '8px 12px',
                    borderRadius: '8px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ 
                    fontSize: '18px',
                    color: streak.color
                  }}>
                    {streak.icon}
                  </span>
                  <span style={{ 
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    {streak.value}
                  </span>
                  <span style={{ 
                    color: '#8b949e',
                    fontSize: '12px'
                  }}>
                    {streak.label}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

StreakTracker.displayName = 'StreakTracker';

export default StreakTracker;