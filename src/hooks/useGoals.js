import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  selectAllGoals, 
  selectGoalsLoading, 
  fetchGoals, 
  createGoal as createGoalAction,
  deleteGoal as deleteGoalAction,
  updateGoalProgress,
  selectActiveGoals,
  selectCompletedGoals 
} from '../store/goalsSlice';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

/**
 * Custom hook for managing goals
 * Provides goal management functionality with proper integration with Redux
 */
const useGoals = () => {
  const dispatch = useDispatch();
  
  // Select goals state
  const goals = useSelector(selectAllGoals);
  const loading = useSelector(selectGoalsLoading);
  const activeGoals = useSelector(selectActiveGoals);
  const completedGoals = useSelector(selectCompletedGoals);

  // Fetch all goals
  const fetchAllGoals = useCallback(async () => {
    try {
      await dispatch(fetchGoals()).unwrap();
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    }
  }, [dispatch]);

  // Create a new goal
  const createGoal = useCallback(async (goalData) => {
    try {
      const period = goalData.type === 'daily' 
        ? format(new Date(), 'yyyy-MM-dd')
        : format(new Date(), "yyyy-'W'ww");

      await dispatch(createGoalAction({
        ...goalData,
        period,
      })).unwrap();
      
      toast.success('Goal created successfully!');
      return true;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
      return false;
    }
  }, [dispatch]);

  // Update goal progress
  const updateProgress = useCallback(async (goalId, amount = 1) => {
    try {
      await dispatch(updateGoalProgress({ goalId, progress: amount })).unwrap();
      return true;
    } catch (error) {
      console.error('Error updating goal progress:', error);
      toast.error('Failed to update progress');
      return false;
    }
  }, [dispatch]);

  // Delete a goal
  const removeGoal = useCallback(async (goalId) => {
    try {
      await dispatch(deleteGoalAction(goalId)).unwrap();
      toast.success('Goal deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
      return false;
    }
  }, [dispatch]);

  // Complete a goal
  const completeGoal = useCallback(async (goalId) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        const remaining = goal.target - goal.current;
        if (remaining > 0) {
          await dispatch(updateGoalProgress({ goalId, progress: remaining })).unwrap();
        }
        toast.success('Goal completed! 🎉');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error completing goal:', error);
      toast.error('Failed to complete goal');
      return false;
    }
  }, [dispatch, goals]);

  // Get goals by type (daily or weekly)
  const getGoalsByType = useCallback((type) => {
    return goals.filter(g => g.type === type);
  }, [goals]);

  // Get goals by category
  const getGoalsByCategory = useCallback((category) => {
    return goals.filter(g => g.category === category);
  }, [goals]);

  // Check for goals that need reset (new day or new week)
  const checkAndResetGoals = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentWeek = format(new Date(), "yyyy-'W'ww");
    
    const needsReset = goals.some(goal => {
      if (goal.completedAt) return false;
      
      if (goal.type === 'daily' && goal.period !== today) {
        return true;
      }
      
      if (goal.type === 'weekly' && goal.period !== currentWeek) {
        return true;
      }
      
      return false;
    });

    return needsReset;
  }, [goals]);

  // Get stats summary
  const getStats = useCallback(() => {
    return {
      total: goals.length,
      active: activeGoals.length,
      completed: completedGoals.length,
      daily: goals.filter(g => g.type === 'daily').length,
      weekly: goals.filter(g => g.type === 'weekly').length,
      completionRate: goals.length > 0 
        ? Math.round((completedGoals.length / goals.length) * 100)
        : 0
    };
  }, [goals, activeGoals, completedGoals]);

  return {
    // State
    goals,
    loading,
    activeGoals,
    completedGoals,
    
    // Actions
    fetchGoals: fetchAllGoals,
    createGoal,
    updateProgress,
    deleteGoal: removeGoal,
    completeGoal,
    
    // Helpers
    getGoalsByType,
    getGoalsByCategory,
    checkAndResetGoals,
    getStats,
  };
};

export default useGoals;