import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/common/DashboardLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardHRPage from './pages/DashboardHRPage';
import RecruitmentPage from './pages/RecruitmentPage';
import RecruitmentDetailPage from './pages/RecruitmentDetailPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#323235',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '500',
              fontSize: '14px',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(15,23,42,0.12)',
              border: '1px solid #f0edef',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#565e74', secondary: '#f7f7ff' },
            },
            error: {
              iconTheme: { primary: '#9f403d', secondary: '#fff7f6' },
            },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardHRPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment"
            element={
              <ProtectedRoute>
                <RecruitmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment/:id"
            element={
              <ProtectedRoute>
                <RecruitmentDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Placeholder routes */}
          <Route path="/directory" element={<ProtectedRoute><PlaceholderPage title="Directory" icon="group" /></ProtectedRoute>} />
          <Route path="/payroll" element={<ProtectedRoute><PlaceholderPage title="Payroll" icon="payments" /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><PlaceholderPage title="Analytics" icon="monitoring" /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><PlaceholderPage title="Support" icon="help" /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><PlaceholderPage title="Settings" icon="settings" /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Simple placeholder for unimplemented pages
function PlaceholderPage({ title, icon }) {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="w-20 h-20 bg-primary-container/30 rounded-2xl flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-5xl">{icon}</span>
        </div>
        <h2 className="text-2xl font-bold text-on-surface">{title}</h2>
        <p className="text-on-surface-variant text-sm">This section is under construction.</p>
      </div>
    </DashboardLayout>
  );
}
