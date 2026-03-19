import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

const AchievementModal = ({ badge, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!badge) return null;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-[#171717] rounded-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden shadow-2xl">
              {/* Glow Effect */}
              {badge.earned && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-2xl blur-xl" />
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              {/* Badge Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', duration: 0.6 }}
                className="text-8xl text-center mb-6 relative"
              >
                {badge.earned ? (
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(255, 215, 0, 0.5)',
                        '0 0 40px rgba(255, 215, 0, 0.8)',
                        '0 0 20px rgba(255, 215, 0, 0.5)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {badge.icon}
                  </motion.div>
                ) : (
                  <div className="grayscale opacity-50">
                    {badge.icon}
                  </div>
                )}
              </motion.div>

              {/* Badge Name */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-2xl font-bold text-center mb-2 ${
                  badge.earned ? 'text-yellow-400' : 'text-gray-400'
                }`}
              >
                {badge.name}
              </motion.h2>

              {/* Badge Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-300 text-center mb-6"
              >
                {badge.description}
              </motion.p>

              {/* Earned Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center mb-6"
              >
                {badge.earned ? (
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="font-medium">Earned {formatDate(badge.earnedAt)}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <span className="material-symbols-outlined">lock</span>
                    <span className="font-medium">Locked</span>
                  </div>
                )}
              </motion.div>

               {/* Requirements Section */}
               {!badge.earned && (
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.6 }}
                   className="bg-[#2a2a2a] rounded-lg p-4 mb-6"
                 >
                   <h3 className="text-white font-medium mb-2">Requirements</h3>
                   <div className="text-gray-400 text-sm space-y-1">
                     <p>• Difficulty: {badge.difficulty}</p>
                     <p>• {badge.description}</p>
                     <p className="mt-2">Keep using the app to unlock this badge!</p>
                   </div>
                 </motion.div>
               )}

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onClose}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AchievementModal;