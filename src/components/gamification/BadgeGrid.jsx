import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import AchievementModal from './AchievementModal';
import Confetti from './Confetti';

// Simple Tooltip Component
const Tooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-10 whitespace-nowrap"
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </motion.div>
      )}
    </div>
  );
};

const BadgeGrid = ({ badges = [], onBadgeClick, maxDisplay = null }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { enableGamification } = useSelector(state => state.settings);

  // Get all badge definitions from the slice
  const allBadges = useSelector(state => state.gamification.badges || []);
  const earnedBadgeIds = new Set(allBadges.map(b => b.id));

  // Mock badge definitions - in real app, this would come from the slice
  const badgeDefinitions = [
    { id: 'first_note', name: 'First Steps', description: 'Created your first note', icon: '📝', difficulty: 'easy' },
    { id: 'prolific_writer', name: 'Prolific Writer', description: 'Created 10 notes', icon: '✍️', difficulty: 'medium' },
    { id: 'master_writer', name: 'Master Writer', description: 'Created 50 notes', icon: '📚', difficulty: 'hard' },
    { id: 'task_master', name: 'Task Master', description: 'Completed 5 tasks', icon: '✅', difficulty: 'easy' },
    { id: 'productivity_pro', name: 'Productivity Pro', description: 'Completed 20 tasks', icon: '🚀', difficulty: 'medium' },
    { id: 'task_tycoon', name: 'Task Tycoon', description: 'Completed 100 tasks', icon: '👑', difficulty: 'hard' },
    { id: 'kanban_ninja', name: 'Kanban Ninja', description: 'Made 10 kanban moves', icon: '🎯', difficulty: 'easy' },
    { id: 'kanban_master', name: 'Kanban Master', description: 'Made 50 kanban moves', icon: '🎪', difficulty: 'medium' },
    { id: 'streak_3', name: 'Getting Started', description: '3 day streak', icon: '🔥', difficulty: 'easy' },
    { id: 'streak_7', name: 'Week Warrior', description: '7 day streak', icon: '⚡', difficulty: 'medium' },
    { id: 'streak_30', name: 'Monthly Master', description: '30 day streak', icon: '🌟', difficulty: 'hard' },
    { id: 'centurion', name: 'Centurion', description: 'Earned 100 points', icon: '💯', difficulty: 'medium' },
    { id: 'champion', name: 'Champion', description: 'Earned 500 points', icon: '🏆', difficulty: 'hard' },
    { id: 'legend', name: 'Legend', description: 'Earned 1000 points', icon: '👑', difficulty: 'hard' },
    { id: 'level_5', name: 'Rising Star', description: 'Reached level 5', icon: '⭐', difficulty: 'easy' },
    { id: 'level_10', name: 'Accomplished', description: 'Reached level 10', icon: '🌟', difficulty: 'medium' },
    { id: 'level_25', name: 'Expert', description: 'Reached level 25', icon: '💎', difficulty: 'hard' },
    { id: 'level_50', name: 'Mastermind', description: 'Reached level 50', icon: '🧠', difficulty: 'hard' },
    { id: 'task_streak_5', name: 'Task Tiger', description: '5 day task streak', icon: '🐯', difficulty: 'medium' },
    { id: 'task_streak_14', name: 'Task Terminator', description: '14 day task streak', icon: '💪', difficulty: 'hard' },
    { id: 'kanban_streak_5', name: 'Kanban Knight', description: '5 day kanban streak', icon: '⚔️', difficulty: 'medium' },
    { id: 'kanban_streak_14', name: 'Kanban Commander', description: '14 day kanban streak', icon: '🏰', difficulty: 'hard' },
    { id: 'first_goal', name: 'Goal Getter', description: 'Created your first goal', icon: '🎯', difficulty: 'easy' },
    { id: 'goal_master', name: 'Goal Master', description: 'Completed 5 goals', icon: '🏅', difficulty: 'medium' },
    { id: 'weekly_warrior', name: 'Weekly Warrior', description: 'Completed 4 weekly goals', icon: '📅', difficulty: 'medium' },
    { id: 'heatmap_contributor', name: 'Heatmap Hero', description: 'Logged activity for 7 consecutive days', icon: '🗺️', difficulty: 'medium' },
    { id: 'heatmap_master', name: 'Heatmap Master', description: 'Logged activity for 30 days this month', icon: '🌍', difficulty: 'hard' },
    { id: 'early_bird', name: 'Early Bird', description: 'Created a note before 7 AM', icon: '🐦', difficulty: 'easy' },
    { id: 'night_owl', name: 'Night Owl', description: 'Created a note after 11 PM', icon: '🦉', difficulty: 'easy' },
    { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Created notes on 4 consecutive weekends', icon: '🏖️', difficulty: 'medium' },
    { id: 'trifecta', name: 'Trifecta', description: 'Created note, completed task, and moved kanban in one day', icon: '🎲', difficulty: 'hard' },
    { id: 'perfect_week', name: 'Perfect Week', description: '7 day streak with at least one activity each day', icon: '✨', difficulty: 'hard' },
  ];

  // Filter and search badges
  const filteredBadges = useMemo(() => {
    let badgesToShow = badgeDefinitions;

    // Apply filter
    if (filter === 'earned') {
      badgesToShow = badgesToShow.filter(badge => earnedBadgeIds.has(badge.id));
    } else if (filter === 'locked') {
      badgesToShow = badgesToShow.filter(badge => !earnedBadgeIds.has(badge.id));
    }

    // Apply search
    if (searchTerm) {
      badgesToShow = badgesToShow.filter(badge =>
        badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply max display limit if specified
    if (maxDisplay) {
      badgesToShow = badgesToShow.slice(0, maxDisplay);
    }

    return badgesToShow;
  }, [filter, searchTerm, earnedBadgeIds, maxDisplay]);

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
    if (onBadgeClick) {
      onBadgeClick(badge);
    }
    // Trigger confetti for earned badges
    if (badge.earned) {
      setShowConfetti(true);
    }
  };

  const closeModal = () => {
    setSelectedBadge(null);
  };

  const handleConfettiComplete = () => {
    setShowConfetti(false);
  };

  if (!enableGamification) return null;

  return (
    <div className="w-full">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
          }`}
        >
          All ({badgeDefinitions.length})
        </button>
        <button
          onClick={() => setFilter('earned')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'earned'
              ? 'bg-green-600 text-white'
              : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
          }`}
        >
          Earned ({earnedBadgeIds.size})
        </button>
        <button
          onClick={() => setFilter('locked')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'locked'
              ? 'bg-gray-600 text-white'
              : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
          }`}
        >
          Locked ({badgeDefinitions.length - earnedBadgeIds.size})
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
          <input
            type="text"
            placeholder="Search badges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Badge Grid */}
      {filteredBadges.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-gray-500 mb-4">military_tech</span>
          <p className="text-gray-400 text-lg">
            {searchTerm ? 'No badges match your search' : 'No badges found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredBadges.map((badge) => {
            const isEarned = earnedBadgeIds.has(badge.id);
            const earnedData = allBadges.find(b => b.id === badge.id);

            return (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                  isEarned
                    ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30'
                    : 'bg-[#2a2a2a] border border-gray-600 hover:border-gray-500 hover:bg-[#3a3a3a]'
                }`}
                onClick={() => handleBadgeClick({ ...badge, earned: isEarned, earnedAt: earnedData?.earnedAt })}
              >
                {/* Badge Icon */}
                <Tooltip content={isEarned ? `Earned: ${badge.description}` : `Locked: ${badge.description}`}>
                  <div className={`text-4xl mb-2 text-center ${isEarned ? '' : 'grayscale opacity-50'}`}>
                    {badge.icon}
                  </div>
                </Tooltip>

                {/* Badge Name */}
                <h3 className={`font-semibold text-center text-sm mb-1 ${
                  isEarned ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {badge.name}
                </h3>

                {/* Badge Description */}
                <p className="text-xs text-gray-500 text-center line-clamp-2">
                  {badge.description}
                </p>

                {/* Lock Icon for Unearned Badges */}
                {!isEarned && (
                  <div className="absolute top-2 right-2">
                    <span className="material-symbols-outlined text-gray-500 text-lg">lock</span>
                  </div>
                )}

                {/* Difficulty Indicator */}
                <div className="absolute bottom-2 left-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    badge.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                    badge.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {badge.difficulty}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Achievement Modal */}
      <AchievementModal
        badge={selectedBadge}
        isOpen={!!selectedBadge}
        onClose={closeModal}
      />

      {/* Confetti Effect */}
      <Confetti
        trigger={showConfetti}
        onComplete={handleConfettiComplete}
      />
    </div>
  );
};

export default BadgeGrid;