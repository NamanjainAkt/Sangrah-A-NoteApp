import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectActivityData, selectTimeFilter, setTimeFilter, fetchActivityData } from '../store/analyticsSlice';
import { selectGoalsLoading } from '../store/goalsSlice';
import { AnalyticsDashboard } from '../components/analytics';
import FeatureDisabled from '../components/FeatureDisabled';

/**
 * Analytics Dashboard Page
 * Full analytics interface with time filtering and data visualization
 */
const Analytics = () => {
  const dispatch = useDispatch();

  // Select analytics state
  const activityData = useSelector(selectActivityData);
  const timeFilter = useSelector(selectTimeFilter);
  const loading = useSelector(selectGoalsLoading);
  const { enableAnalyticsDashboard } = useSelector(state => state.settings);
  
  // Local state for managing activity data
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load activity data on component mount
  useEffect(() => {
    if (enableAnalyticsDashboard) {
      const loadData = async () => {
        try {
          await dispatch(fetchActivityData()).unwrap();
        } catch (error) {
          console.error('Error loading activity data:', error);
        } finally {
          setIsInitialLoading(false);
        }
      };

      loadData();
    } else {
      setIsInitialLoading(false);
    }
  }, [dispatch, enableAnalyticsDashboard]);

  // Show disabled state if Analytics Dashboard is not enabled
  if (!enableAnalyticsDashboard) {
    return (
      <FeatureDisabled
        featureName="Analytics Dashboard"
        icon="analytics"
        description="Enable Analytics Dashboard in Settings to view detailed analytics, charts, and activity reports."
      />
    );
  }

  // Handle time filter change
  const handleTimeFilterChange = (filter) => {
    dispatch(setTimeFilter(filter));
    dispatch(fetchActivityData());
  };

  return (
    <div className="analytics-page w-full max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <span className="material-symbols-outlined text-3xl">analytics</span>
        Analytics Dashboard
      </h1>

      {/* Analytics Dashboard Component */}
      <AnalyticsDashboard
        activityData={activityData}
        timeFilter={timeFilter}
        onFilterChange={handleTimeFilterChange}
      />

      {/* Loading indicator */}
      {isInitialLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171717] p-6 rounded-xl flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <span className="text-white">Loading analytics data...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
