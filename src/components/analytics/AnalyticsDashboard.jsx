import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { selectActivityData, selectTimeFilter, setTimeFilter, fetchActivityData, exportData } from '../../store/analyticsSlice';
import { selectGoalsLoading } from '../../store/goalsSlice';
import { selectAllGoals, selectActiveGoals } from '../../store/goalsSlice';
import MetricCard from './MetricCard';
import ChartContainer from './ChartContainer';
import TimeFilter from './TimeFilter';
import { toast } from 'react-toastify';
import Papa from 'papaparse';

// Lazy load heavy components
const LazyMetricCard = lazy(() => import('./MetricCard'));

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * AnalyticsDashboard Component
 * Comprehensive analytics dashboard with charts, metrics, and data visualization
 * Props:
 * - activityData: array - Activity data (optional, will use store if not provided)
 * - timeFilter: string - Current time filter
 * - onFilterChange: function - Filter change callback
 */
const AnalyticsDashboard = memo(({ activityData: propActivityData, timeFilter: propTimeFilter, onFilterChange }) => {
  const dispatch = useDispatch();
  
  // Select state from Redux
  const storeActivityData = useSelector(selectActivityData);
  const storeTimeFilter = useSelector(selectTimeFilter);
  const loading = useSelector(selectGoalsLoading);
  const goals = useSelector(selectAllGoals);
  const activeGoals = useSelector(selectActiveGoals);
  
  // Use props if provided, otherwise use store
  const activityData = propActivityData || storeActivityData;
  const timeFilter = propTimeFilter || storeTimeFilter;

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const today = new Date();
    switch (timeFilter) {
      case 'today':
        return { start: startOfDay(today), end: endOfDay(today) };
      case 'week':
        return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'year':
        return { start: startOfYear(today), end: endOfYear(today) };
      default:
        return { start: subDays(today, 30), end: today };
    }
  }, [timeFilter]);

  // Filter activity data by date range
  const filteredData = useMemo(() => {
    return activityData.filter(item => {
      if (!item.date) return false;
      const itemDate = parseISO(item.date);
      return isWithinInterval(itemDate, { start: dateRange.start, end: dateRange.end });
    });
  }, [activityData, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totals = filteredData.reduce((acc, day) => ({
      notesCreated: acc.notesCreated + (day.notesCreated || 0),
      tasksCompleted: acc.tasksCompleted + (day.tasksCompleted || 0),
      kanbanMoves: acc.kanbanMoves + (day.kanbanMoves || 0),
      streakDays: acc.streakDays + (day.streakDays || 0),
    }), { notesCreated: 0, tasksCompleted: 0, kanbanMoves: 0, streakDays: 0 });

    const totalActivity = totals.notesCreated + totals.tasksCompleted + totals.kanbanMoves;
    const activeDays = filteredData.filter(d => d.totalActivity > 0).length;
    const averageActivity = activeDays > 0 ? Math.round(totalActivity / activeDays) : 0;
    
    // Calculate best streak from activity data
    let currentStreak = 0;
    let maxStreak = 0;
    filteredData.forEach(day => {
      if (day.totalActivity > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    // Productivity score (0-100)
    const productivityScore = Math.min(100, Math.round((totalActivity / Math.max(1, filteredData.length * 3)) * 100));

    return {
      ...totals,
      totalActivity,
      averageActivity,
      bestStreak: maxStreak,
      productivityScore,
      activeDays,
    };
  }, [filteredData]);

  // Prepare chart data
  const notesChartData = useMemo(() => {
    return filteredData.map(day => ({
      date: format(parseISO(day.date), timeFilter === 'year' ? 'MMM' : 'MMM d'),
      notes: day.notesCreated || 0,
      tasks: day.tasksCompleted || 0,
      kanban: day.kanbanMoves || 0,
      fullDate: day.date,
    }));
  }, [filteredData, timeFilter]);

  const taskCompletionData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const completionByDay = days.map(() => ({ day: '', tasks: 0 }));
    
    filteredData.forEach(day => {
      if (day.date) {
        const dayOfWeek = parseISO(day.date).getDay();
        completionByDay[dayOfWeek].day = days[dayOfWeek];
        completionByDay[dayOfWeek].tasks += day.tasksCompleted || 0;
      }
    });

    // Fill in empty days
    return completionByDay.map(item => item.day ? item : null).filter(Boolean);
  }, [filteredData]);

  const kanbanFlowData = useMemo(() => {
    return filteredData.map(day => ({
      date: format(parseISO(day.date), timeFilter === 'year' ? 'MMM' : 'MMM d'),
      todo: Math.max(0, (day.notesCreated || 0) - (day.tasksCompleted || 0) - (day.kanbanMoves || 0)),
      inProgress: Math.max(0, (day.kanbanMoves || 0) * 0.3),
      done: (day.tasksCompleted || 0) + (day.kanbanMoves || 0) * 0.7,
    }));
  }, [filteredData, timeFilter]);

  // Heatmap data for weekly patterns
  const heatmapData = useMemo(() => {
    const weeks = [];
    let currentWeek = [];
    
    filteredData.forEach((day, index) => {
      const dayOfWeek = day.date ? parseISO(day.date).getDay() : index % 7;
      currentWeek.push({ ...day, dayOfWeek });
      
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ totalActivity: 0 });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [filteredData]);

  // Handle time filter change with debouncing
  const handleFilterChange = useCallback(debounce((filter) => {
    dispatch(setTimeFilter(filter));
    dispatch(fetchActivityData());
    if (onFilterChange) {
      onFilterChange(filter);
    }
  }, 500), [dispatch, onFilterChange]);

  // Handle export
  const handleExport = (format) => {
    try {
      let data, filename, mimeType;
      
      const exportContent = {
        exportedAt: new Date().toISOString(),
        timeFilter,
        dateRange: {
          start: format(dateRange.start, 'yyyy-MM-dd'),
          end: format(dateRange.end, 'yyyy-MM-dd'),
        },
        metrics,
        activityData: filteredData,
      };

      if (format === 'csv') {
        const csvData = filteredData.map(day => ({
          Date: day.date,
          'Notes Created': day.notesCreated || 0,
          'Tasks Completed': day.tasksCompleted || 0,
          'Kanban Moves': day.kanbanMoves || 0,
          'Streak Days': day.streakDays || 0,
          'Total Activity': day.totalActivity || 0,
        }));
        data = Papa.unparse(csvData);
        filename = `analytics_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        mimeType = 'text/csv';
      } else {
        data = JSON.stringify(exportContent, null, 2);
        filename = `analytics_export_${format(new Date(), 'yyyy-MM-dd')}.json`;
        mimeType = 'application/json';
      }

      // Download file
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Analytics data exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#2a2a2a] p-3 rounded-lg border border-gray-700 shadow-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-400">{entry.name}:</span>
              <span className="text-white font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Empty state
  if (!loading && (!activityData || activityData.length === 0)) {
    return (
      <div className="analytics-dashboard-empty text-center py-16">
        <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">
          analytics
        </span>
        <h2 className="text-2xl font-bold text-white mb-2">No Analytics Data Yet</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Start using the app to see your productivity analytics and track your progress over time.
        </p>
        <TimeFilter currentFilter={timeFilter} onFilterChange={handleFilterChange} />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      {/* Header with export buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="w-full lg:w-auto">
          <TimeFilter currentFilter={timeFilter} onFilterChange={handleFilterChange} />
        </div>
        
        <div className="export-buttons flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 sm:px-4 bg-[#171717] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={() => handleExport('json')}
            className="px-3 py-2 sm:px-4 bg-[#171717] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-lg">code</span>
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <Suspense fallback={<div className="h-20 bg-gray-800 rounded-lg animate-pulse"></div>}>
          <LazyMetricCard
            label="Total Notes"
            value={metrics.notesCreated}
            icon="note"
            color="blue"
            trend={{ value: 12, label: 'vs last period' }}
          />
        </Suspense>
        <Suspense fallback={<div className="h-20 bg-gray-800 rounded-lg animate-pulse"></div>}>
          <LazyMetricCard
            label="Tasks Done"
            value={metrics.tasksCompleted}
            icon="check_circle"
            color="green"
            trend={{ value: 8, label: 'vs last period' }}
          />
        </Suspense>
        <Suspense fallback={<div className="h-20 bg-gray-800 rounded-lg animate-pulse"></div>}>
          <LazyMetricCard
            label="Kanban Moves"
            value={metrics.kanbanMoves}
            icon="view_kanban"
            color="purple"
          />
        </Suspense>
        <Suspense fallback={<div className="h-20 bg-gray-800 rounded-lg animate-pulse"></div>}>
          <LazyMetricCard
            label="Daily Avg"
            value={metrics.averageActivity}
            icon="trending_up"
            color="orange"
          />
        </Suspense>
        <Suspense fallback={<div className="h-20 bg-gray-800 rounded-lg animate-pulse"></div>}>
          <LazyMetricCard
            label="Best Streak"
            value={`${metrics.bestStreak} days`}
            icon="local_fire_department"
            color="yellow"
          />
        </Suspense>
        <Suspense fallback={<div className="h-20 bg-gray-800 rounded-lg animate-pulse"></div>}>
          <LazyMetricCard
            label="Productivity"
            value={`${metrics.productivityScore}%`}
            icon="speed"
            color="red"
          />
        </Suspense>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Notes Created Over Time - Line Chart */}
        <ChartContainer title="Notes Created Over Time" loading={loading}>
          <div className="w-full h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={notesChartData}>
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="notes" 
                  name="Notes Created"
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tasks" 
                  name="Tasks Completed"
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        {/* Task Completion by Day - Bar Chart */}
        <ChartContainer title="Task Completion by Day" loading={loading}>
          <div className="w-full h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskCompletionData}>
                <XAxis 
                  dataKey="day" 
                  stroke="#6b7280" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="tasks" 
                  name="Tasks Completed"
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        {/* Kanban Flow - Area Chart */}
        <ChartContainer title="Kanban Flow (To Do → In Progress → Done)" loading={loading}>
          <div className="w-full h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kanbanFlowData}>
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area 
                  type="monotone" 
                  dataKey="todo" 
                  name="To Do"
                  stackId="1"
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="inProgress" 
                  name="In Progress"
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="done" 
                  name="Done"
                  stackId="1"
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        {/* Weekly Activity Patterns - Heatmap */}
        <ChartContainer title="Weekly Activity Patterns" loading={loading}>
          <div className="w-full overflow-x-auto">
            <div className="flex gap-1 min-w-max pb-4">
              {heatmapData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => {
                    const level = day.totalActivity > 0 
                      ? Math.min(4, Math.ceil(day.totalActivity / 3)) 
                      : 0;
                    const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
                    
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm transition-all hover:scale-125 cursor-pointer"
                        style={{ backgroundColor: colors[level] }}
                        title={`${day.date || 'No data'}: ${day.totalActivity || 0} activities`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
              <span>Less</span>
              {['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'].map((color, i) => (
                <div
                  key={i}
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* Goals Progress */}
      {activeGoals.length > 0 && (
        <div className="goals-section mt-6">
          <ChartContainer title="Active Goals Progress" loading={loading}>
            <div className="goals-list space-y-4">
              {activeGoals.slice(0, 4).map(goal => {
                const progress = Math.min(100, (goal.current / goal.target) * 100);
                const categoryLabels = {
                  notes_created: 'Notes Created',
                  tasks_completed: 'Tasks Completed',
                  kanban_moves: 'Kanban Moves',
                  streak_maintenance: 'Streak Maintenance',
                };
                
                return (
                  <div key={goal.id} className="goal-item">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">{categoryLabels[goal.category]}</span>
                      <span className="text-gray-400 text-sm">
                        {goal.current} / {goal.target} ({Math.round(progress)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full ${
                          progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartContainer>
        </div>
      )}
    </div>
  );
});

AnalyticsDashboard.displayName = 'AnalyticsDashboard';

export default AnalyticsDashboard;