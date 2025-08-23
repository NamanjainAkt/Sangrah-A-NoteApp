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
    <aside className="flex flex-col items-center justify-center my-auto dark:bg-black dark:text-white bg-white text-black h-full w-54">
      <div className="flex flex-col items-center justify-center dark:border-r dark:border-white border-r border-black mt-16 ">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `p-4 m-4 rounded flex items-center justify-center gap-2 w-40 dark:hover:bg-white dark:hover:text-black ${
                isActive ? 'dark:bg-white dark:text-black bg-black text-white' : ''
              }`
            }
          >
            <span className="material-symbols-outlined">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
