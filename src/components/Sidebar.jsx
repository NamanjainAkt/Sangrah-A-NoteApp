import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { enableKanbanView, enableGoalsAndStreaks, enableAnalyticsDashboard, enableGamification, enablePomodoroTimer, enableTags, enableReminders } = useSelector(state => state.settings);
  const badges = useSelector(state => state.gamification.badges || []);
  const overdueCount = useSelector(state => state.reminders.overdueCount || 0);
  
  const links = [
    { to: "/", label: "Home", icon: "home", alwaysShow: true },
    { to: "/analytics", label: "Analytics", icon: "analytics", show: enableAnalyticsDashboard, requiresEnable: true },
    { to: "/kanban", label: "Kanban", icon: "view_kanban", show: enableKanbanView, requiresEnable: true },
    { to: "/goals", label: "Goals", icon: "track_changes", show: enableGoalsAndStreaks, requiresEnable: true },
    { to: "/badges", label: "Badges", icon: "emoji_events", show: enableGamification, badge: badges.length, requiresEnable: true },
    { to: "/calendar", label: "Calendar", icon: "calendar_month", show: enableReminders, requiresEnable: true },
    { to: "/timer", label: "Timer", icon: "timer", show: enablePomodoroTimer, requiresEnable: true },
    { to: "/archive", label: "Archive", icon: "archive", alwaysShow: true },
    { to: "/important", label: "Important", icon: "label_important", alwaysShow: true },
    { to: "/bin", label: "Bin", icon: "delete", alwaysShow: true },
    { to: "/settings", label: "Settings", icon: "settings", alwaysShow: true },
  ];
   
  return (
    <>
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-[#171717] border-r border-gray-200 dark:border-gray-700
          flex flex-col items-start py-6 px-4 z-50 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:sticky lg:top-16
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex flex-col gap-2 w-full">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={(e) => {
                setIsMobileMenuOpen(false);
                // Prevent navigation if feature is disabled
                if (link.requiresEnable && !link.show) {
                  e.preventDefault();
                }
              }}
              className={({ isActive }) =>
                `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative
                  ${link.requiresEnable && !link.show
                    ? 'text-gray-500 dark:text-gray-600 cursor-not-allowed opacity-60'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
                  }
                  ${isActive && link.show ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : ''}
                `
              }
            >
              <span className="material-symbols-outlined text-xl">{link.icon}</span>
              <span className="flex-1">{link.label}</span>
              {link.requiresEnable && !link.show && (
                <span className="material-symbols-outlined text-sm text-gray-500" title="Enable in Settings">
                  lock
                </span>
              )}
              {link.badge > 0 && link.show && (
                <span className="bg-yellow-500 text-black text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              )}
              {link.to === "/calendar" && overdueCount > 0 && link.show && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                  {overdueCount > 99 ? '99+' : overdueCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Mobile Navigation - Bottom Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#171717] border-t border-gray-200 dark:border-gray-700 px-4 py-2 z-50">
          <div className="flex justify-around items-center">
            {links.slice(0, 5).map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  // Prevent navigation if feature is disabled
                  if (link.requiresEnable && !link.show) {
                    e.preventDefault();
                  }
                }}
                className={({ isActive }) =>
                  `
                    flex flex-col items-center gap-1 px-2 py-1 rounded-md transition-colors relative
                    ${link.requiresEnable && !link.show
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer'
                    }
                    ${isActive && link.show ? 'text-blue-600 dark:text-blue-400' : ''}
                  `
                }
              >
                <span className="material-symbols-outlined text-2xl">{link.icon}</span>
                <span className="text-xs">{link.label}</span>
                {link.requiresEnable && !link.show && (
                  <span className="material-symbols-outlined text-[10px] text-gray-500 absolute top-0 right-0">lock</span>
                )}
                {link.badge > 0 && link.show && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                )}
                {link.to === "/calendar" && overdueCount > 0 && link.show && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                    {overdueCount > 99 ? '99+' : overdueCount}
                  </span>
                )}
              </NavLink>
            ))}
            
            {/* More menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex flex-col items-center gap-1 px-2 py-1 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">more_horiz</span>
              <span className="text-xs">More</span>
            </button>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden mt-4 flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">More Options</h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {links.slice(5).map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  // Prevent navigation if feature is disabled
                  if (link.requiresEnable && !link.show) {
                    e.preventDefault();
                  }
                }}
                className={({ isActive }) =>
                  `
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative
                    ${link.requiresEnable && !link.show
                      ? 'text-gray-500 dark:text-gray-600 cursor-not-allowed opacity-60'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
                    }
                    ${isActive && link.show ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : ''}
                  `
                }
              >
                <span className="material-symbols-outlined text-xl">{link.icon}</span>
                <span className="flex-1">{link.label}</span>
                {link.requiresEnable && !link.show && (
                  <span className="material-symbols-outlined text-sm text-gray-500" title="Enable in Settings">
                    lock
                  </span>
                )}
                {link.badge > 0 && link.show && (
                  <span className="bg-yellow-500 text-black text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                )}
                {link.to === "/calendar" && overdueCount > 0 && link.show && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                    {overdueCount > 99 ? '99+' : overdueCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
