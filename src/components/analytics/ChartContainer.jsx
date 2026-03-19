import React, { memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '../Skeleton';

/**
 * ChartContainer Component
 * Card container for charts with title, loading state, error handling, and options
 * Props:
 * - title: string - Chart title
 * - children: ReactNode - Chart content
 * - loading: boolean - Show loading skeleton
 * - error: string | null - Error message to display
 * - onRetry: function - Callback for retry action
 */
const ChartContainer = memo(({ title, children, loading, error, onRetry }) => {
  const containerRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // Handle responsive container resizing
  useEffect(() => {
    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          // Trigger chart re-render on container resize
          const chartContainer = entry.target.querySelector('.recharts-wrapper');
          if (chartContainer) {
            chartContainer.style.width = '100%';
            chartContainer.style.height = '100%';
          }
        }
      });

      resizeObserverRef.current.observe(containerRef.current);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="chart-container bg-[#171717] rounded-xl overflow-hidden border border-gray-800"
      style={{ minHeight: '300px' }}
      ref={containerRef}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '20px' }}>
            chart
          </span>
          {title}
        </h3>

        {/* Options button */}
        <button
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          aria-label={`${title} options`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            more_vert
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="p-5" style={{ minHeight: '250px' }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="chart-loading"
            >
              <div className="space-y-4">
                <Skeleton height="h-8" width="w-1/3" />
                <Skeleton height="h-64" width="w-full" />
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="chart-error flex flex-col items-center justify-center h-64 text-center"
            >
              <span className="material-symbols-outlined text-6xl text-red-500 mb-4">
                error_outline
              </span>
              <p className="text-red-400 mb-4">{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    refresh
                  </span>
                  Retry
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="chart-content"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

ChartContainer.displayName = 'ChartContainer';

export default ChartContainer;