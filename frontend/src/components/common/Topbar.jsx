import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ title, searchPlaceholder, onSearch, onMenuClick }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    onSearch?.(val);
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'HR';

  return (
    <header className="topbar">
      {/* Left side: Hamburger button + Search */}
      <div className="flex items-center space-x-2 md:space-x-4">
        <button
          onClick={onMenuClick}
          className="md:hidden hamburger-btn text-on-surface"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className="flex items-center bg-surface-container-low px-3 py-1.5 md:px-4 md:py-2 rounded-full w-40 sm:w-60 md:w-80 group focus-within:bg-white transition-all shadow-sm">
          <span className="material-symbols-outlined text-outline text-[18px] md:text-[20px]">search</span>
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder={searchPlaceholder || 'Search...'}
            className="bg-transparent border-none focus:ring-0 text-xs md:text-sm font-medium w-full ml-2 outline-none placeholder:text-outline-variant"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-2 md:space-x-4">
        <button className="relative hover:bg-slate-100 rounded-full p-2 transition-colors">
          <span className="material-symbols-outlined text-secondary text-[20px] md:text-[22px]">notifications_active</span>
          <span className="notif-dot" />
        </button>

        <button className="hidden sm:block hover:bg-slate-100 rounded-full p-2 transition-colors">
          <span className="material-symbols-outlined text-secondary text-[20px] md:text-[22px]">chat_bubble_outline</span>
        </button>

        <div className="h-6 md:h-8 w-px bg-outline-variant/30 hidden sm:block" />

        {/* User profile */}
        <div className="flex items-center space-x-2 md:space-x-3 cursor-pointer group">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs md:text-sm shadow-sm group-hover:ring-2 group-hover:ring-primary transition-all">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold text-on-surface leading-tight">
              {user?.name || 'HR Manager'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-outline font-semibold">
              {user?.role || 'HR Director'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
