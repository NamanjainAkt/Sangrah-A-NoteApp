import React from 'react';
import { useSelector } from 'react-redux';
import CalendarView from '../components/reminders/CalendarView';
import FeatureDisabled from '../components/FeatureDisabled';

/**
 * Calendar Page
 * Calendar view showing upcoming due dates and reminders
 */
const Calendar = () => {
  const { enableReminders } = useSelector(state => state.settings);
  const { overdueCount, upcomingCount } = useSelector(state => state.reminders);

  if (!enableReminders) {
    return (
      <FeatureDisabled
        featureName="Calendar & Reminders"
        icon="calendar_month"
        description="Enable Reminders in Settings to set due dates, manage calendar, and get notified about upcoming tasks."
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl sm:text-3xl">calendar_month</span>
          Calendar
        </h1>

        {/* Stats */}
        <div className="flex gap-2 sm:gap-4">
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
              <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
              <span className="text-red-400 text-sm font-medium">
                {overdueCount} overdue
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <span className="material-symbols-outlined text-blue-500 text-sm">event</span>
            <span className="text-blue-400 text-sm font-medium">
              {upcomingCount} upcoming
            </span>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="mb-6 sm:mb-8">
        <CalendarView
          className="w-full"
          onDateSelect={(date) => {
            console.log('Selected date:', date);
          }}
          onNoteClick={(noteId) => {
            console.log('View note:', noteId);
            // Navigate to note or open in modal
          }}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#171717] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-red-500">warning</span>
            <span className="text-white font-medium">Overdue</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-400">{overdueCount}</p>
          <p className="text-gray-500 text-sm">tasks past due</p>
        </div>

        <div className="bg-[#171717] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-blue-500">today</span>
            <span className="text-white font-medium">Due Today</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-400">
            {/* This would be calculated based on actual data */}
            {upcomingCount > 0 ? '1+' : '0'}
          </p>
          <p className="text-gray-500 text-sm">tasks due today</p>
        </div>

        <div className="bg-[#171717] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-green-500">event_upcoming</span>
            <span className="text-white font-medium">Upcoming</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-400">{upcomingCount}</p>
          <p className="text-gray-500 text-sm">tasks this week</p>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-gray-800/50 rounded-xl p-4">
        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">lightbulb</span>
          Tips
        </h3>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• Click on a date to see reminders for that day</li>
          <li>• Blue dots indicate upcoming tasks</li>
          <li>• Red dots indicate overdue tasks</li>
          <li>• Set reminders when editing notes to see them here</li>
        </ul>
      </div>
    </div>
  );
};

export default Calendar;