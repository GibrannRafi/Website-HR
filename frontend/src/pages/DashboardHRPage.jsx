import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/common/DashboardLayout';
import api from '../services/api';
import toast from 'react-hot-toast';

const activityIcons = {
  screening: 'person',
  interview: 'mail',
  offer:     'star',
  hired:     'check_circle',
};

export default function DashboardHRPage() {
  const [stats, setStats] = useState({
    totalApplicants:  0,
    activeJobdesks:   0,
    pendingScreenings: 0,
    matchAvg:         0,
  });
  const [activities, setActivities] = useState([]);
  const [pipeline,   setPipeline]   = useState({ retention: 94, timeToHire: 18 });
  const [loading,    setLoading]    = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/activities'),
      ]);
      setStats(statsRes.data);
      setActivities(activitiesRes.data);
    } catch {
      setStats({ totalApplicants: 1248, activeJobdesks: 42, pendingScreenings: 18, matchAvg: 88.4 });
      setActivities([
        { id: 1, type: 'screening', title: 'New Applicant for Lead UI Designer',         subtitle: 'Sarah Jenkins • 2 hours ago',                       tag: 'Screening', tagClass: 'badge-secondary' },
        { id: 2, type: 'interview', title: 'Interview Scheduled',                         subtitle: 'Marcus Aurelius • Senior React Dev • 5 hours ago',  tag: 'Interview', tagClass: 'badge-active' },
        { id: 3, type: 'offer',     title: 'Offer Extended',                              subtitle: 'Elena Fischer • Frontend Lead • Yesterday',          tag: 'Hiring',    tagClass: 'px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold rounded-full uppercase tracking-tight' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout searchPlaceholder="Search talent or roles...">
      {/* ── Page padding: tighter on mobile, generous on desktop ── */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 pb-10 md:pb-20 pt-4 md:pt-8">
        <div className="max-w-7xl mx-auto">

          {/* ── Header ── */}
          <div className="mb-6 md:mb-10 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-[3.5rem] font-extrabold tracking-tighter text-on-surface leading-tight mb-1 md:mb-2">
              Talent Overview
            </h2>
            <p className="text-secondary font-medium tracking-wide text-sm md:text-base">
              Refined recruitment metrics for the current quarter.
            </p>
          </div>

          {/* ── Bento Stats Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 mb-6 md:mb-12">

            {/* Main Metric — full width mobile, 5-col desktop */}
            <div className="sm:col-span-2 lg:col-span-5 bg-surface-container-low rounded-xl p-6 md:p-10 flex flex-col justify-between min-h-[200px] md:min-h-[280px] lg:min-h-[320px]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-4 md:mb-6 block">
                  Total Applicants
                </span>
                <p className="text-[3.5rem] md:text-[5rem] font-bold tracking-tighter text-editorial-gradient leading-none">
                  {loading ? '—' : stats.totalApplicants.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-green-600 font-bold">+12%</span>
                <span className="text-outline font-medium">vs last month</span>
              </div>
            </div>

            {/* Right grid — 2 col always, 7-col desktop */}
            <div className="sm:col-span-2 lg:col-span-7 grid grid-cols-2 gap-4 md:gap-6">

              {/* Active Jobdesks */}
              <div className="bg-surface-container-lowest shadow-[0_20px_40px_rgba(15,23,42,0.06)] rounded-xl p-5 md:p-8 flex flex-col justify-between">
                <div className="bg-primary-container/30 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-4 md:mb-6">
                  <span className="material-symbols-outlined text-primary text-[20px] md:text-[24px]">work_outline</span>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-on-surface mb-1">
                    {loading ? '—' : stats.activeJobdesks}
                  </p>
                  <span className="text-[10px] md:text-xs font-semibold text-outline uppercase tracking-wider">Active Jobdesks</span>
                </div>
              </div>

              {/* Pending Screenings */}
              <div className="bg-surface-container-lowest shadow-[0_20px_40px_rgba(15,23,42,0.06)] rounded-xl p-5 md:p-8 flex flex-col justify-between">
                <div className="bg-tertiary-container/30 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-4 md:mb-6">
                  <span className="material-symbols-outlined text-tertiary text-[20px] md:text-[24px]">fact_check</span>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-on-surface mb-1">
                    {loading ? '—' : stats.pendingScreenings}
                  </p>
                  <span className="text-[10px] md:text-xs font-semibold text-outline uppercase tracking-wider">Pending Screenings</span>
                </div>
              </div>

              {/* Category Highlight — spans 2 cols */}
              <div className="col-span-2 bg-inverse-surface text-surface-container-lowest rounded-xl p-5 md:p-8 relative overflow-hidden flex items-center">
                <div className="relative z-10 w-2/3">
                  <h3 className="text-base md:text-xl font-bold mb-2 md:mb-4">Top Category Match</h3>
                  <div className="flex space-x-6 md:space-x-12">
                    <div>
                      <p className="text-xl md:text-2xl font-bold">156</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-60">Applicants</p>
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl font-bold">
                        {loading ? '—' : `${stats.matchAvg}%`}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest opacity-60">Avg Match Score</p>
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary-dim to-transparent flex items-center justify-center">
                  <span className="material-symbols-outlined text-[60px] md:text-[80px] opacity-20 rotate-12">psychology</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">

            {/* Recent Activity */}
            <div className="lg:col-span-8 bg-surface-container-low rounded-xl p-5 md:p-8">
              <div className="flex justify-between items-center mb-5 md:mb-8">
                <h3 className="text-base md:text-lg font-bold tracking-tight">Recent Activity</h3>
                <button className="text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">
                  View All
                </button>
              </div>
              <div className="space-y-1">
                {activities.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 md:p-4 hover:bg-surface-container-lowest transition-colors rounded-lg group"
                  >
                    <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-surface-container-highest flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-sm">
                          {activityIcons[item.type] || 'notifications'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{item.title}</p>
                        <p className="text-xs text-outline font-medium truncate">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className={`${item.tagClass} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2 hidden sm:inline`}>
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Health */}
            <div className="lg:col-span-4 space-y-4 md:space-y-6">
              <div className="bg-surface-container-highest/50 p-5 md:p-8 rounded-xl border border-outline-variant/10">
                <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 md:mb-6">
                  Pipeline Health
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium">Retention Rate</span>
                      <span className="text-sm font-bold">{pipeline.retention}%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1">
                      <div
                        className="bg-primary h-1 rounded-full transition-all duration-700"
                        style={{ width: `${pipeline.retention}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium">Time to Hire</span>
                      <span className="text-sm font-bold">{pipeline.timeToHire} days</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1">
                      <div className="bg-tertiary h-1 rounded-full transition-all duration-700" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Culture card */}
              <div className="relative rounded-xl h-40 md:h-48 overflow-hidden group cursor-pointer">
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center">
                  <span className="material-symbols-outlined text-[80px] text-on-primary opacity-20">apartment</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-5 md:p-6">
                  <p className="text-white text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Atelier Culture</p>
                  <p className="text-white text-base md:text-lg font-bold">View internal handbook</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
