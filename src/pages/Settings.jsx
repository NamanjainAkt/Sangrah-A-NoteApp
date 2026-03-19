import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleTodoChecklists,
  toggleKanbanView,
  toggleGamification,
  toggleDisciplineHeatmap,
  toggleGoalsAndStreaks,
  toggleAnalyticsDashboard,
  toggleEnhancedNotifications,
  togglePomodoroTimer,
  toggleTags,
  toggleReminders,
  toggleDataExport,
  loadSettingsFromStorage
} from '../store/settingsSlice';
import useGamification from '../hooks/useGamification';
import { loadGamificationFromStorage } from '../store/gamificationSlice';
import Skeleton from '../components/Skeleton';
import DisciplineHeatmap from '../components/heatmap/DisciplineHeatmap';
import NotificationPreferences from '../components/notifications/NotificationPreferences';
import LevelProgress from '../components/gamification/LevelProgress';
import BadgeGrid from '../components/gamification/BadgeGrid';
import { selectUnreadCount } from '../store/notificationsSlice';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

/**
 * Settings page component with toggle switches for features
 * Displays gamification stats when enabled
 */
const Settings = () => {
  const dispatch = useDispatch();
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Select settings from Redux store
  const {
    enableTodoChecklists,
    enableKanbanView,
    enableGamification,
    enableDisciplineHeatmap,
    enableGoalsAndStreaks,
    enableAnalyticsDashboard,
    enableEnhancedNotifications,
    enablePomodoroTimer,
    enableTags,
    enableReminders,
    enableDataExport,
  } = useSelector(state => state.settings);

  // Select notification data
  const unreadCount = useSelector(selectUnreadCount);

  // Use gamification hook for stats
  const {
    points,
    badges,
    currentStreak,
    stats
  } = useGamification();

  // Load settings and gamification data from localStorage on component mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('appSettings');
      if (storedSettings) {
        dispatch(loadSettingsFromStorage(JSON.parse(storedSettings)));
      }

      // Load gamification data using Redux thunk
      dispatch(loadGamificationFromStorage());
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [dispatch]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      const settingsData = {
        enableTodoChecklists,
        enableKanbanView,
        enableGamification,
        enableDisciplineHeatmap,
        enableGoalsAndStreaks,
        enableAnalyticsDashboard,
        enableEnhancedNotifications,
        enablePomodoroTimer,
        enableTags,
        enableReminders,
        enableDataExport,
      };
      localStorage.setItem('appSettings', JSON.stringify(settingsData));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }, [enableTodoChecklists, enableKanbanView, enableGamification, enableDisciplineHeatmap, enableGoalsAndStreaks, enableAnalyticsDashboard, enableEnhancedNotifications, enablePomodoroTimer, enableTags, enableReminders, enableDataExport]);

  /**
   * Toggle switch component for settings
   * @param {boolean} enabled - Current state of the toggle
   * @param {function} onToggle - Function to call when toggle changes
   * @param {string} label - Label for the setting
   * @param {string} description - Description of the setting
   * @param {string} icon - Material symbol icon name
   */
  const ToggleSwitch = ({ enabled, onToggle, label, description, icon }) => (
    <div className="flex items-center justify-between p-4 bg-[#171717] rounded-xl mb-4 hover:bg-[#2a2a2a] transition-colors">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-2xl text-gray-400">
          {icon}
        </span>
        <div>
          <h3 className="text-white font-medium text-lg">{label}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`
          relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300
          ${enabled ? 'bg-green-500' : 'bg-gray-600'}
        `}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`
            inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300
            ${enabled ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );

  return (
    <div className="w-full mx-auto max-sm:mt-4 max-w-2xl p-6">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <span className="material-symbols-outlined text-3xl">settings</span>
        Settings
      </h1>

      {/* Feature Toggles Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Features</h2>
        
        <ToggleSwitch
          enabled={enableTodoChecklists}
          onToggle={() => {
            dispatch(toggleTodoChecklists());
            toast.success(`Todo Checklists ${!enableTodoChecklists ? 'enabled' : 'disabled'}`);
          }}
          label="Todo Checklists"
          description="Enable todo-style checklists in your notes"
          icon="checklist"
        />

        <ToggleSwitch
          enabled={enableKanbanView}
          onToggle={() => {
            dispatch(toggleKanbanView());
            toast.success(`Kanban View ${!enableKanbanView ? 'enabled' : 'disabled'}`);
          }}
          label="Kanban View"
          description="View notes as kanban boards for better organization"
          icon="view_kanban"
        />

        <ToggleSwitch
          enabled={enableGamification}
          onToggle={() => {
            dispatch(toggleGamification());
            toast.success(`Gamification ${!enableGamification ? 'enabled' : 'disabled'}`);
          }}
          label="Gamification"
          description="Earn points, badges, and maintain streaks"
          icon="emoji_events"
        />
      </div>

      {/* Phase 2 Features Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Phase 2 Features</h2>
        
        <ToggleSwitch
          enabled={enableDisciplineHeatmap}
          onToggle={() => {
            dispatch(toggleDisciplineHeatmap());
            toast.success(`Discipline Heatmap ${!enableDisciplineHeatmap ? 'enabled' : 'disabled'}`);
          }}
          label="Discipline Heatmap"
          description="Visualize your productivity with an activity heatmap"
          icon="heatmap"
        />

        <ToggleSwitch
          enabled={enableGoalsAndStreaks}
          onToggle={() => {
            dispatch(toggleGoalsAndStreaks());
            toast.success(`Goals & Streaks ${!enableGoalsAndStreaks ? 'enabled' : 'disabled'}`);
          }}
          label="Goals & Streaks"
          description="Set daily/weekly goals and track special streaks"
          icon="track_changes"
        />

        <ToggleSwitch
          enabled={enableAnalyticsDashboard}
          onToggle={() => {
            dispatch(toggleAnalyticsDashboard());
            toast.success(`Analytics Dashboard ${!enableAnalyticsDashboard ? 'enabled' : 'disabled'}`);
          }}
          label="Analytics Dashboard"
          description="View detailed analytics and activity reports"
          icon="analytics"
        />

        <ToggleSwitch
          enabled={enableEnhancedNotifications}
          onToggle={() => {
            dispatch(toggleEnhancedNotifications());
            toast.success(`Enhanced Notifications ${!enableEnhancedNotifications ? 'enabled' : 'disabled'}`);
          }}
          label="Enhanced Notifications"
          description="Get notified about achievements and milestones"
          icon="notifications"
        />
      </div>

      {/* Phase 3 Features Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Phase 3 Features</h2>
        
        <ToggleSwitch
          enabled={enablePomodoroTimer}
          onToggle={() => {
            dispatch(togglePomodoroTimer());
            toast.success(`Pomodoro Timer ${!enablePomodoroTimer ? 'enabled' : 'disabled'}`);
          }}
          label="Pomodoro Timer"
          description="Focus timer with work/break sessions"
          icon="timer"
        />

        <ToggleSwitch
          enabled={enableTags}
          onToggle={() => {
            dispatch(toggleTags());
            toast.success(`Tags ${!enableTags ? 'enabled' : 'disabled'}`);
          }}
          label="Tags"
          description="Organize notes with colorful tags"
          icon="label"
        />

        <ToggleSwitch
          enabled={enableReminders}
          onToggle={() => {
            dispatch(toggleReminders());
            toast.success(`Reminders ${!enableReminders ? 'enabled' : 'disabled'}`);
          }}
          label="Reminders"
          description="Set due dates and get notified"
          icon="event"
        />

        <ToggleSwitch
          enabled={enableDataExport}
          onToggle={() => {
            dispatch(toggleDataExport());
            toast.success(`Data Export ${!enableDataExport ? 'enabled' : 'disabled'}`);
          }}
          label="Data Export"
          description="Export and backup your notes"
          icon="download"
        />
      </div>

      {/* Notification Preferences Section - Only show when enabled */}
      {enableEnhancedNotifications && (
        <div className="mb-8">
          <NotificationPreferences />
        </div>
      )}

      {/* Discipline Heatmap Section - Only show when enabled */}
      {enableDisciplineHeatmap && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">insights</span>
            Your Activity Heatmap
          </h2>
          <div className="bg-[#0d1117] rounded-xl p-4">
            <DisciplineHeatmap days={365} />
          </div>
        </div>
      )}

      {/* Gamification Stats Section - Only show when enabled */}
      {enableGamification && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">emoji_events</span>
            Your Progress
          </h2>

          {/* Level Progress */}
          <div className="mb-6">
            <LevelProgress />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#171717] rounded-xl p-4 text-center hover:bg-[#2a2a2a] transition-colors">
              <span className="material-symbols-outlined text-2xl text-yellow-500 mb-1">stars</span>
              {isLoadingStats ? (
                <Skeleton className="mx-auto mb-1" width="w-12" height="h-6" />
              ) : (
                <p className="text-xl font-bold text-white">{points}</p>
              )}
              <p className="text-gray-400 text-xs">Points</p>
            </div>

            <div className="bg-[#171717] rounded-xl p-4 text-center hover:bg-[#2a2a2a] transition-colors">
              <span className="material-symbols-outlined text-2xl text-orange-500 mb-1">local_fire_department</span>
              {isLoadingStats ? (
                <Skeleton className="mx-auto mb-1" width="w-12" height="h-6" />
              ) : (
                <p className="text-xl font-bold text-white">{currentStreak}</p>
              )}
              <p className="text-gray-400 text-xs">Streak</p>
            </div>

            <div className="bg-[#171717] rounded-xl p-4 text-center hover:bg-[#2a2a2a] transition-colors">
              <span className="material-symbols-outlined text-2xl text-blue-500 mb-1">description</span>
              {isLoadingStats ? (
                <Skeleton className="mx-auto mb-1" width="w-12" height="h-6" />
              ) : (
                <p className="text-xl font-bold text-white">{stats.notesCreated}</p>
              )}
              <p className="text-gray-400 text-xs">Notes</p>
            </div>

            <div className="bg-[#171717] rounded-xl p-4 text-center hover:bg-[#2a2a2a] transition-colors">
              <span className="material-symbols-outlined text-2xl text-green-500 mb-1">check_circle</span>
              {isLoadingStats ? (
                <Skeleton className="mx-auto mb-1" width="w-12" height="h-6" />
              ) : (
                <p className="text-xl font-bold text-white">{stats.tasksCompleted}</p>
              )}
              <p className="text-gray-400 text-xs">Tasks</p>
            </div>
          </div>

          {/* Badge Preview */}
          <div className="bg-[#171717] rounded-xl p-6 hover:bg-[#2a2a2a] transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <span className="material-symbols-outlined">military_tech</span>
                Recent Badges ({isLoadingStats ? '...' : badges.length} earned)
              </h3>
              <Link
                to="/badges"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                View All →
              </Link>
            </div>

            {isLoadingStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Skeleton height="h-20" />
                <Skeleton height="h-20" />
                <Skeleton height="h-20" />
                <Skeleton height="h-20" />
              </div>
            ) : badges.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                Complete activities to earn your first badge!
              </p>
            ) : (
              <BadgeGrid maxDisplay={4} />
            )}
          </div>
        </div>
      )}

      {/* Info message when gamification is disabled */}
      {!enableGamification && (
        <div className="bg-[#171717] rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-4xl text-gray-500 mb-3">
            emoji_events
          </span>
          <p className="text-gray-400">
            Enable gamification to track your progress and earn badges!
          </p>
        </div>
      )}
    </div>
  );
};

export default Settings;