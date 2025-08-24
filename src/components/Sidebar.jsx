import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const links = [
    { to: "/", label: "Home", icon: "home" },
    { to: "/archive", label: "Archive", icon: "archive" },
    { to: "/important", label: "Important", icon: "label_important" },
    { to: "/bin", label: "Bin", icon: "delete" },
  ];

  return (
    <aside
      className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] w-56 bg-white text-black dark:bg-black dark:text-white
        flex flex-col items-center justify-start mt-10
        max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:h-14 max-sm:w-full max-sm:flex-row max-sm:justify-around max-sm:items-center max-sm:border-t max-sm:border-gray-300 z-50
      `}
    >
     <div className='mt-20 border-r-white max-sm:flex max-sm:flex-row max-sm:mb-20 max-sm:gap-4 max-sm:p-2'>
       {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `
              p-4 m-4 rounded flex items-center justify-center gap-2 w-40 max-sm:w-10 max-sm:h-10
              ${isActive ? 'bg-black text-white dark:bg-white dark:text-black max-sm:rounded-full' : ''}
              hover:bg-gray-200 dark:hover:bg-white dark:hover:text-black transition-colors
            `
          }
        >
          <span className="material-symbols-outlined">{link.icon}</span>
          <span className="max-sm:hidden">{link.label}</span>
        </NavLink>
      ))}
     </div>
    </aside>
  );
};

export default Sidebar;
