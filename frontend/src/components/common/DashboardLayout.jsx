import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children, searchPlaceholder, onSearch }) {
  return (
    <div className="bg-surface min-h-screen text-on-surface">
      <Sidebar />
      <Topbar searchPlaceholder={searchPlaceholder} onSearch={onSearch} />
      <main className="main-content pt-20 min-h-screen">
        {children}
      </main>
    </div>
  );
}
