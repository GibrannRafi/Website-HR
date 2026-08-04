import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/common/DashboardLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, activityRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/activity'),
      ]);
      setStats(statsRes.data);
      setActivity(activityRes.data);
    } catch (err) {
      toast.error('Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: 'Total HR Terdaftar', value: stats.totalHR, icon: 'group', color: 'bg-primary/10 text-primary border-primary/20' },
    { label: 'Total Lowongan', value: stats.totalJobs, icon: 'work', color: 'bg-secondary/10 text-secondary border-secondary/20' },
    { label: 'Total Pelamar', value: stats.totalApplicants, icon: 'person_add', color: 'bg-tertiary/10 text-tertiary border-tertiary/20' },
    { label: 'Lowongan Aktif', value: stats.activeJobs, icon: 'campaign', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'Rata-rata Match Score', value: `${stats.avgScore}%`, icon: 'analytics', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Total Hired', value: stats.hired, icon: 'how_to_reg', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  ] : [];

  const getStatusColor = (status) => {
    const map = {
      Hired: 'bg-emerald-100 text-emerald-700',
      Shortlisted: 'bg-primary/10 text-primary',
      'Final Interview': 'bg-blue-100 text-blue-700',
      'Technical Test': 'bg-purple-100 text-purple-700',
      Screening: 'bg-surface-container text-on-surface-variant',
      Rejected: 'bg-error/10 text-error',
      'Review Needed': 'bg-amber-100 text-amber-700',
    };
    return map[status] || 'bg-surface-container text-on-surface-variant';
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Admin Panel</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Platform Overview</h2>
            <p className="text-on-surface-variant mt-1 text-xs md:text-sm">
              Statistik global seluruh HR dan pelamar di sistem Portal HR.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/users')}
            className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5 min-h-[44px]"
          >
            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
            Kelola HR
          </button>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-outline-variant/20 p-5 animate-pulse bg-surface-container-low h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {statCards.map((card) => (
              <div key={card.label} className={`rounded-xl border p-4 md:p-5 flex flex-col gap-2 ${card.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{card.label}</span>
                  <span className="material-symbols-outlined text-[18px] opacity-60">{card.icon}</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent Activity Table */}
        <section className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="px-5 md:px-8 py-4 md:py-5 border-b border-surface-container-high flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">history</span>
            <h3 className="font-bold text-sm md:text-base">Aktivitas Terbaru Platform</h3>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-outline-variant">
              20 Terbaru
            </span>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="text-left border-collapse" style={{ minWidth: '700px', width: '100%' }}>
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-outline-variant font-bold bg-surface-container-low/50">
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">#</th>
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">Pelamar</th>
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">Posisi</th>
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">Perusahaan (HR)</th>
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">Match Score</th>
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">Status</th>
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-16 text-center text-outline">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : activity.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-16 text-center text-outline">
                      Belum ada aktivitas pelamar.
                    </td>
                  </tr>
                ) : (
                  activity.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-5 md:px-8 py-4 text-sm text-outline">{idx + 1}</td>
                      <td className="px-5 md:px-8 py-4">
                        <p className="text-sm font-bold">{item.applicant_name}</p>
                        <p className="text-[10px] text-on-surface-variant">{item.email}</p>
                      </td>
                      <td className="px-5 md:px-8 py-4 text-sm whitespace-nowrap">{item.job_title}</td>
                      <td className="px-5 md:px-8 py-4">
                        <p className="text-sm">{item.company || '—'}</p>
                        <p className="text-[10px] text-on-surface-variant">{item.hr_name}</p>
                      </td>
                      <td className="px-5 md:px-8 py-4">
                        <span className={`text-sm font-bold ${
                          item.match_score >= 75 ? 'text-emerald-600' :
                          item.match_score >= 50 ? 'text-amber-600' : 'text-error'
                        }`}>
                          {item.match_score}%
                        </span>
                      </td>
                      <td className="px-5 md:px-8 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(item.screening_status)}`}>
                          {item.screening_status}
                        </span>
                      </td>
                      <td className="px-5 md:px-8 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                        {item.received_at ? new Date(item.received_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
