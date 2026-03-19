import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import useGoals from '../hooks/useGoals';
import GoalCard from '../components/goals/GoalCard';
import GoalForm from '../components/goals/GoalForm';
import StreakTracker from '../components/goals/StreakTracker';
import { selectGoalsLoading } from '../store/goalsSlice';
import { format } from 'date-fns';
import FeatureDisabled from '../components/FeatureDisabled';

/**
 * Goals management page with full Phase 2B implementation
 */
const Goals = () => {
  const { 
    goals, 
    activeGoals, 
    completedGoals,
    fetchGoals, 
    createGoal, 
    deleteGoal,
    updateProgress,
    completeGoal,
    getStats 
  } = useGoals();
  
  const loading = useSelector(selectGoalsLoading);
  const { enableGoalsAndStreaks } = useSelector(state => state.settings);

  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('active'); // 'active' | 'completed' | 'all'

  // Load goals on component mount
  useEffect(() => {
    if (enableGoalsAndStreaks) {
      fetchGoals();
    }
  }, [enableGoalsAndStreaks, fetchGoals]);

  // Get stats
  const stats = getStats();

  // Filter goals based on current filter
  const filteredGoals = filter === 'active' 
    ? activeGoals 
    : filter === 'completed' 
      ? completedGoals 
      : goals;

  // Get gamification data for streak tracker
  const { currentStreak, bestStreak } = useSelector(state => ({
    currentStreak: state.gamification?.currentStreak || 0,
    bestStreak: state.gamification?.bestStreak || 0
  }));

  const specialStreaks = {
    taskStreak: 0,
    kanbanStreak: 0,
    noteStreak: 0
  };

  if (!enableGoalsAndStreaks) {
    return (
      <FeatureDisabled
        featureName="Goals & Streaks"
        icon="track_changes"
        description="Enable Goals & Streaks in Settings to set daily/weekly goals and track your productivity streaks."
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl">track_changes</span>
          Goals & Streaks
        </h1>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 border-none cursor-pointer transition-colors duration-200"
        >
          <span className="material-symbols-outlined">add</span>
          Create Goal
        </button>
      </div>

      {/* Streak Tracker */}
      <StreakTracker 
        currentStreak={currentStreak}
        bestStreak={bestStreak}
        specialStreaks={specialStreaks}
      />

      {/* Goals Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#171717] rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-white mb-1">{stats.total}</p>
          <p className="text-gray-400 text-sm">Total Goals</p>
        </div>
        <div className="bg-[#171717] rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-green-400 mb-1">{stats.active}</p>
          <p className="text-gray-400 text-sm">Active</p>
        </div>
        <div className="bg-[#171717] rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-blue-400 mb-1">{stats.completed}</p>
          <p className="text-gray-400 text-sm">Completed</p>
        </div>
        <div className="bg-[#171717] rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-purple-400 mb-1">{stats.completionRate}%</p>
          <p className="text-gray-400 text-sm">Completion Rate</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 bg-[#2a2a2a] p-1 rounded-xl w-fit">
        {['active', 'completed', 'all'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`
              px-4 py-2 rounded-lg border-none text-sm font-medium cursor-pointer capitalize transition-all duration-200
              ${filter === filterOption 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            {filterOption}
          </button>
        ))}
      </div>

      {/* Goals List */}
      <div className="goals-list">
         {loading ? (
           <div className="text-center py-10 text-gray-500">
             <span className="material-symbols-outlined text-5xl mb-4">
               progress_activity
             </span>
             <p>Loading goals...</p>
           </div>
         ) : filteredGoals.length === 0 ? (
           <div className="text-center py-16 px-5 bg-[#171717] rounded-2xl">
             <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">
               flag_circle
             </span>
             <h3 className="text-white text-xl mb-2">
               {filter === 'active' ? 'No Active Goals' : 
                filter === 'completed' ? 'No Completed Goals' : 'No Goals Yet'}
             </h3>
             <p className="text-gray-500 mb-5 max-w-sm mx-auto">
               {filter === 'active' 
                 ? 'Create your first goal to start tracking your progress!' 
                 : filter === 'completed' 
                   ? 'Complete some goals to see them here.'
                   : 'Set your first goal and start achieving!'}
             </p>
             {filter !== 'completed' && (
               <button
                 onClick={() => setShowCreateModal(true)}
                 className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg border-none text-sm font-medium cursor-pointer inline-flex items-center gap-2 transition-colors"
               >
                 <span className="material-symbols-outlined">add</span>
                 Create Goal
               </button>
             )}
           </div>
        ) : (
          <AnimatePresence mode="popLayout">
           <div className="grid gap-4">
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdateProgress={updateProgress}
                  onDelete={deleteGoal}
                  onComplete={completeGoal}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Create Goal Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <GoalForm
            onCreate={async (goalData) => {
              await createGoal(goalData);
              setShowCreateModal(false);
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Goals;
