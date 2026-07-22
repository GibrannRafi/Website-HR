import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  // { icon: 'group', label: 'Directory', to: '/directory' },
  // { icon: 'payments', label: 'Payroll', to: '/payroll' },
  // { icon: 'monitoring', label: 'Analytics', to: '/analytics' },
  { icon: 'person_add', label: 'Recruitment', to: '/recruitment' },
];

const bottomItems = [
  // { icon: 'help', label: 'Support', to: '/support' },
  { icon: 'settings', label: 'Settings', to: '/settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl shadow-lg flex-shrink-0">
          <span className="material-symbols-outlined text-white text-[20px]">token</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tighter text-[#2a3439]">Portal HR</h1>
          <p className="uppercase tracking-[0.05em] text-[10px] font-semibold text-secondary">
            Premium Management
          </p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="pt-4 border-t border-black/5 space-y-1">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="sidebar-link"
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}

        {/* User info + logout */}
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-left mt-2"
          title="Logout"
        >
          <span className="material-symbols-outlined text-[20px] text-error">logout</span>
          <span className="text-sm font-medium text-error">Logout</span>
        </button>
      </div>
    </aside>
  );
}
