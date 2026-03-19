import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { clearNotes } from '../store/notesSlice';
import { selectUnreadCount } from '../store/notificationsSlice';
import { Link } from 'react-router-dom';
import authService from '../appwrite/auth';
import NotificationCenter from './notifications/NotificationCenter';
import useGamification from '../hooks/useGamification';

const Navbar = () => {
  const dispatch = useDispatch();
  const { enableGoalsAndStreaks, enableAnalyticsDashboard, enableEnhancedNotifications, enableGamification } = useSelector(state => state.settings);
  const unreadCount = useSelector(selectUnreadCount);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { level, xp, getLevelProgress } = useGamification();
  const levelProgress = getLevelProgress();

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      dispatch(clearNotes());
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => !prev);
  }, []);

  const closeNotifications = useCallback(() => {
    setShowNotifications(false);
  }, []);

  return (
    <>
      <header className='flex items-center justify-between p-4 dark:bg-[#171717] bg-white dark:text-white text-black border-b border-gray-200 dark:border-gray-700 fixed w-full top-0 z-40'>
        
        {/* Logo and Hamburger */}
        <div className="flex items-center gap-4">
          {/* Hamburger menu for mobile */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {showMobileMenu ? 'close' : 'menu'}
            </span>
          </button>

          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-wide font-bold sangrah text-blue-600 dark:text-blue-400'>
            Sangrah
          </h1>
        </div>
        
        {/* Right side items */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Level Indicator - hidden on mobile, visible on larger screens */}
          {enableGamification && (
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 sm:px-3 py-1">
              <span className="text-yellow-500 dark:text-yellow-400 font-bold text-sm sm:text-lg">{level}</span>
              <div className="w-8 sm:w-12 h-1 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${levelProgress.progressPercent}%` }}
                />
              </div>
              <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden md:inline">{xp} XP</span>
            </div>
          )}

          {/* Notification Bell */}
          {enableEnhancedNotifications && (
            <div className="notification-bell-container relative">
              <button
                onClick={toggleNotifications}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <span className="material-symbols-outlined text-xl sm:text-2xl">
                  notifications
                </span>
                
                {/* Unread count badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Logout Button */}
          <button
            className='px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all duration-300 flex items-center gap-2 text-sm sm:text-base'
            onClick={handleLogout}
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">logout</span>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="lg:hidden fixed top-16 left-0 right-0 bg-white dark:bg-[#171717] border-b border-gray-200 dark:border-gray-700 z-30 shadow-lg">
          <nav className="flex flex-col p-4 gap-2">
            <Link 
              to="/" 
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="material-symbols-outlined">home</span>
              Home
            </Link>
            {enableAnalyticsDashboard && (
              <Link 
                to="/analytics" 
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="material-symbols-outlined">analytics</span>
                Analytics
              </Link>
            )}
            {enableGoalsAndStreaks && (
              <Link 
                to="/goals" 
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="material-symbols-outlined">track_changes</span>
                Goals
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={closeNotifications}
      />
    </>
  )
}

export default Navbar