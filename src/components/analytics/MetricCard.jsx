import React, { memo } from 'react';
import { motion } from 'framer-motion';

/**
 * MetricCard Component
 * Displays a single analytics metric with icon, value, label, and trend indicator
 * Props:
 * - label: string - The metric label
 * - value: number | string - The metric value
 * - icon: string - Material symbol icon name
 * - color: string - Color theme ('blue', 'green', 'purple', 'orange', 'red', 'yellow')
 * - trend: object - Optional trend data { value: number, label: string }
 */
const MetricCard = memo(({ label, value, icon, color, trend }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
      icon: 'text-blue-500'
    },
    green: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500/20',
      icon: 'text-green-500'
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/20',
      icon: 'text-purple-500'
    },
    orange: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/20',
      icon: 'text-orange-500'
    },
    red: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/20',
      icon: 'text-red-500'
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/20',
      icon: 'text-yellow-500'
    }
  };

  const theme = colorClasses[color] || colorClasses.blue;
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)' }}
      transition={{ duration: 0.2 }}
      className={`
        metric-card relative overflow-hidden rounded-xl p-5 cursor-pointer
        bg-[#171717] border ${theme.border} transition-all duration-200
        hover:bg-[#1f1f1f]
      `}
      style={{ minWidth: '200px', flex: '1 1 200px' }}
      role="region"
      aria-label={`${label}: ${formattedValue}`}
    >
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-20 h-20 ${theme.bg} rounded-full -mr-10 -mt-10 opacity-50`} />

      {/* Icon */}
      <div className={`w-12 h-12 ${theme.bg} rounded-lg flex items-center justify-center mb-4`}>
        <span className={`material-symbols-outlined ${theme.icon}`} style={{ fontSize: '24px' }}>
          {icon}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-white">
          {formattedValue}
        </span>
        
        {/* Trend indicator */}
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend.value >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {trend.value >= 0 ? 'trending_up' : 'trending_down'}
            </span>
            <span>{Math.abs(trend.value)}%</span>
            {trend.label && (
              <span className="text-gray-500 font-normal ml-1">{trend.label}</span>
            )}
          </div>
        )}
      </div>

      {/* Label */}
      <p className="text-gray-400 text-sm font-medium">{label}</p>

      {/* Subtle glow effect on hover */}
      <div className={`absolute inset-0 ${theme.bg} opacity-0 hover:opacity-10 transition-opacity duration-200 rounded-xl`} />
    </motion.div>
  );
});

MetricCard.displayName = 'MetricCard';

export default MetricCard;