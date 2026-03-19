import { useState } from 'react';
import { useSelector } from 'react-redux';
import BadgeGrid from '../components/gamification/BadgeGrid';
import LevelProgress from '../components/gamification/LevelProgress';
import FeatureDisabled from '../components/FeatureDisabled';

const Badges = () => {
  const { enableGamification } = useSelector(state => state.settings);
  const { badges, level, xp, points } = useSelector(state => state.gamification);
  const [isLoading, setIsLoading] = useState(false);

  if (!enableGamification) {
    return (
      <FeatureDisabled
        featureName="Badges & Achievements"
        icon="emoji_events"
        description="Enable Gamification in Settings to earn points, unlock badges, track levels, and maintain productivity streaks."
      />
    );
  }

  // Calculate completion percentage
  const totalBadges = 33; // From the badge definitions
  const completionPercent = Math.round((badges.length / totalBadges) * 100);

  return (
    <div className="w-full mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl">emoji_events</span>
          Badges & Achievements
        </h1>
        <p className="text-gray-400">Track your progress and unlock achievements</p>
      </div>

      {/* Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-8">
        {/* Level Card */}
        <div className="bg-[#171717] rounded-xl p-6 hover:bg-[#2a2a2a] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-2xl text-blue-400">trending_up</span>
            <div>
              <p className="text-2xl font-bold text-white">{level}</p>
              <p className="text-gray-400 text-sm">Current Level</p>
            </div>
          </div>
        </div>

        {/* XP Card */}
        <div className="bg-[#171717] rounded-xl p-6 hover:bg-[#2a2a2a] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-2xl text-green-400">stars</span>
            <div>
              <p className="text-2xl font-bold text-white">{xp}</p>
              <p className="text-gray-400 text-sm">Total XP</p>
            </div>
          </div>
        </div>

        {/* Badges Earned Card */}
        <div className="bg-[#171717] rounded-xl p-6 hover:bg-[#2a2a2a] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-2xl text-yellow-400">military_tech</span>
            <div>
              <p className="text-2xl font-bold text-white">{badges.length}</p>
              <p className="text-gray-400 text-sm">Badges Earned</p>
            </div>
          </div>
        </div>

        {/* Completion Card */}
        <div className="bg-[#171717] rounded-xl p-6 hover:bg-[#2a2a2a] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-2xl text-purple-400">trophy</span>
            <div>
              <p className="text-2xl font-bold text-white">{completionPercent}%</p>
              <p className="text-gray-400 text-sm">Completion</p>
            </div>
          </div>
        </div>

        {/* Points Card */}
        <div className="bg-[#171717] rounded-xl p-6 hover:bg-[#2a2a2a] transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-2xl text-orange-400">local_fire_department</span>
            <div>
              <p className="text-2xl font-bold text-white">{points}</p>
              <p className="text-gray-400 text-sm">Total Points</p>
            </div>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="mb-8">
        <LevelProgress />
      </div>

      {/* Badge Grid */}
      <div className="bg-[#171717] rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">All Badges</h2>
          <p className="text-gray-400">
            Earn badges by completing various activities and reaching milestones
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <BadgeGrid />
        )}
      </div>
    </div>
  );
};

export default Badges;