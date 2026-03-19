import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

/**
 * Goal Form Component
 * Form for creating new goals with validation
 */
const GoalForm = ({ onCreate, onCancel }) => {
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goalType = watch('type', 'daily');

  const goalCategories = [
    { value: 'notes_created', label: 'Notes Created', icon: 'note', description: 'Create new notes' },
    { value: 'tasks_completed', label: 'Tasks Completed', icon: 'check_circle', description: 'Complete tasks' },
    { value: 'kanban_moves', label: 'Kanban Moves', icon: 'view_kanban', description: 'Move cards between columns' },
    { value: 'streak_maintenance', label: 'Streak Maintenance', icon: 'local_fire_department', description: 'Maintain your daily streak' }
  ];

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      const period = data.type === 'daily' 
        ? format(new Date(), 'yyyy-MM-dd')
        : format(new Date(), "yyyy-'W'ww");

      await onCreate({
        type: data.type,
        category: data.category,
        target: parseInt(data.target),
        period,
      });
      
      reset();
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && onCancel) {
            onCancel();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: '#171717',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#3b82f620',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#3b82f6' }}>
                add_circle
              </span>
            </div>
            <div>
              <h2 style={{ 
                color: '#ffffff', 
                fontSize: '20px', 
                fontWeight: 600,
                margin: 0
              }}>
                Create New Goal
              </h2>
              <p style={{ 
                color: '#8b949e', 
                fontSize: '13px',
                margin: 0
              }}>
                Set a target to achieve
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Goal Type Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: '#ffffff', 
                fontSize: '14px', 
                fontWeight: 500,
                marginBottom: '10px'
              }}>
                Goal Type
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '10px' 
              }}>
                {['daily', 'weekly'].map((type) => (
                  <label
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      backgroundColor: goalType === type ? '#3b82f620' : '#2a2a2a',
                      border: `2px solid ${goalType === type ? '#3b82f6' : 'transparent'}`,
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="radio"
                      value={type}
                      {...register('type', { required: true })}
                      style={{ display: 'none' }}
                    />
                    <span className="material-symbols-outlined" style={{ 
                      fontSize: '20px',
                      color: goalType === type ? '#3b82f6' : '#8b949e'
                    }}>
                      {type === 'daily' ? 'today' : 'date_week'}
                    </span>
                    <span style={{ 
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 500
                    }}>
                      {type === 'daily' ? 'Daily' : 'Weekly'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Goal Category Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: '#ffffff', 
                fontSize: '14px', 
                fontWeight: 500,
                marginBottom: '10px'
              }}>
                Goal Category
              </label>
              <select
                {...register('category', { required: 'Please select a category' })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#2a2a2a',
                  border: `1px solid ${errors.category ? '#f85149' : '#3a3a3a'}`,
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">Select a category</option>
                {goalCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p style={{ 
                  color: '#f85149', 
                  fontSize: '12px', 
                  marginTop: '6px' 
                }}>
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Target Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                color: '#ffffff', 
                fontSize: '14px', 
                fontWeight: 500,
                marginBottom: '10px'
              }}>
                Target Amount
              </label>
              <input
                type="number"
                min="1"
                max="365"
                {...register('target', { 
                  required: 'Target is required',
                  min: { value: 1, message: 'Target must be at least 1' },
                  max: { value: 365, message: 'Target cannot exceed 365' }
                })}
                placeholder="Enter target number"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#2a2a2a',
                  border: `1px solid ${errors.target ? '#f85149' : '#3a3a3a'}`,
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {errors.target && (
                <p style={{ 
                  color: '#f85149', 
                  fontSize: '12px', 
                  marginTop: '6px' 
                }}>
                  {errors.target.message}
                </p>
              )}
              <p style={{ 
                color: '#8b949e', 
                fontSize: '12px', 
                marginTop: '8px' 
              }}>
                {goalType === 'daily' 
                  ? 'Daily targets reset at midnight' 
                  : 'Weekly targets reset on Sunday'}
              </p>
            </div>

            {/* Actions */}
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              marginTop: '8px'
            }}>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: isSubmitting ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      progress_activity
                    </span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      add
                    </span>
                    Create Goal
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GoalForm;