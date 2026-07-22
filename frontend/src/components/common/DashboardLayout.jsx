import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children, searchPlaceholder, onSearch }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar
        searchPlaceholder={searchPlaceholder}
        onSearch={onSearch}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <main className="main-content min-h-screen">
        {children}
      </main>
    </div>
  );
}
