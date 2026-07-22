import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ title, searchPlaceholder, onSearch }) {
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
      {/* Search */}
      <div className="flex items-center bg-surface-container-low px-4 py-2 rounded-full w-80 group focus-within:bg-white transition-all shadow-sm">
        <span className="material-symbols-outlined text-outline text-[20px]">search</span>
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder={searchPlaceholder || 'Search...'}
          className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full ml-2 outline-none placeholder:text-outline-variant"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative hover:bg-slate-100 rounded-full p-2 transition-colors">
          <span className="material-symbols-outlined text-secondary text-[22px]">notifications_active</span>
          <span className="notif-dot" />
        </button>

        {/* Messages */}
        <button className="hover:bg-slate-100 rounded-full p-2 transition-colors">
          <span className="material-symbols-outlined text-secondary text-[22px]">chat_bubble_outline</span>
        </button>

        <div className="h-8 w-px bg-outline-variant/30" />

        {/* User profile */}
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm shadow-sm group-hover:ring-2 group-hover:ring-primary transition-all">
            {initials}
          </div>
          <div className="flex flex-col">
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
