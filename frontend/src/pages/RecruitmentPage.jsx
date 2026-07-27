import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/common/DashboardLayout';
import Modal from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/ScoreComponents';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Engineering', 'Marketing', 'Product', 'Design', 'Operations', 'HR', 'Finance'];
const EXPERIENCE = ['Junior', 'Mid-level', 'Senior', 'Lead'];

const emptyForm = {
  title: '',
  department: 'Engineering',
  experience_level: 'Mid-level',
  description: '',
};

export default function RecruitmentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyName = (user?.company || '').trim().toUpperCase() || 'PT ABC INDONESIA';

  const [jobdesks, setJobdesks] = useState([]);
  const [stats, setStats] = useState({ totalOpenings: 0, appConversion: 75, interviewCompletion: 50, avgTimeToHire: 18 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchJobdesks();
  }, []);

  const fetchJobdesks = async () => {
    setLoading(true);
    try {
      const [jRes, sRes] = await Promise.all([
        api.get('/jobdesks'),
        api.get('/jobdesks/stats'),
      ]);
      setJobdesks(jRes.data);
      setStats(sRes.data);
    } catch {
      // Demo fallback
      setJobdesks([
        { id: 1, title: 'Senior Product Designer', subject_keyword: 'SENIOR PRODUCT DESIGNER', department: 'Creative Arts', experience_level: 'Senior', status: 'active', candidate_count: 14, created_at: '2023-10-12', email_subject: `LAMARAN KERJA - SENIOR PRODUCT DESIGNER - ${companyName}` },
        { id: 2, title: 'Cloud Infrastructure Lead', subject_keyword: 'CLOUD INFRASTRUCTURE LEAD', department: 'Engineering', experience_level: 'Lead', status: 'on hold', candidate_count: 5, created_at: '2023-11-04', email_subject: `LAMARAN KERJA - CLOUD INFRASTRUCTURE LEAD - ${companyName}` },
        { id: 3, title: 'Lead Talent Sourcer', subject_keyword: 'LEAD TALENT SOURCER', department: 'Operations', experience_level: 'Senior', status: 'active', candidate_count: 10, created_at: '2023-11-18', email_subject: `LAMARAN KERJA - LEAD TALENT SOURCER - ${companyName}` },
        { id: 4, title: 'Front End Developer', subject_keyword: 'FRONT END DEVELOPER', department: 'Engineering', experience_level: 'Mid-level', status: 'active', candidate_count: 24, created_at: '2023-12-01', email_subject: `LAMARAN KERJA - FRONT END DEVELOPER - ${companyName}` },
      ]);
      setStats({ totalOpenings: 24, appConversion: 75, interviewCompletion: 50, avgTimeToHire: 18 });
    } finally {
      setLoading(false);
    }
  };

  const filteredJobdesks = jobdesks.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.department.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredJobdesks.length / ITEMS_PER_PAGE);
  const paginatedJobdesks = filteredJobdesks.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openAddModal = () => {
    setForm(emptyForm);
    setEditMode(false);
    setEditId(null);
    setModalOpen(true);
  };

  const openEditModal = (job) => {
    setForm({
      title: job.title,
      department: job.department,
      experience_level: job.experience_level,
      description: job.description || '',
    });
    setEditMode(true);
    setEditId(job.id);
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.department) {
      toast.error('Please fill in required fields');
      return;
    }
    setSaving(true);
    try {
      if (editMode) {
        await api.put(`/jobdesks/${editId}`, form);
        toast.success('Jobdesk updated successfully');
      } else {
        await api.post('/jobdesks', form);
        toast.success('Jobdesk created! Email subject generated automatically.');
      }
      setModalOpen(false);
      fetchJobdesks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save jobdesk');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/jobdesks/${id}`);
      toast.success('Jobdesk deleted');
      setDeleteId(null);
      fetchJobdesks();
    } catch {
      toast.error('Failed to delete jobdesk');
    }
  };

  const previewEmailSubject = form.title.trim()
    ? `LAMARAN KERJA - ${form.title.trim().toUpperCase()} - ${companyName}`
    : `LAMARAN KERJA - {NAMA POSISI} - ${companyName}`;

  return (
    <DashboardLayout searchPlaceholder="Search job desks, candidates..." onSearch={setSearch}>
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 pb-8 md:pb-12 pt-4 md:pt-8">
        {/* Header */}
        <div className="flex flex-wrap gap-4 justify-between items-start md:items-end mb-6 md:mb-10">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">Jobdesk Management</h2>
            <p className="text-secondary font-medium text-sm md:text-base">Oversee active openings and recruitment pipelines.</p>
          </div>
          <button onClick={openAddModal} className="btn-primary flex items-center space-x-2 text-sm">
            <span className="material-symbols-outlined text-[18px] md:text-[20px]">add_circle</span>
            <span className="font-bold tracking-tight">Add New Jobdesk</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 mb-6 md:mb-10">
          <div className="sm:col-span-1 lg:col-span-4 bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_20px_40px_rgba(15,23,42,0.03)] flex flex-col justify-between min-h-[140px] md:h-48 border-b-2 border-primary/10">
            <span className="text-secondary font-semibold text-xs uppercase tracking-widest">Total Openings</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl md:text-5xl font-extrabold text-primary-dim">{stats.totalOpenings}</span>
              <span className="text-primary text-sm font-medium">+3 this month</span>
            </div>
          </div>

          <div className="sm:col-span-1 lg:col-span-5 bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_20px_40px_rgba(15,23,42,0.03)] flex flex-col justify-between min-h-[140px] md:h-48">
            <span className="text-secondary font-semibold text-xs uppercase tracking-widest">Pipeline Health</span>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="h-2 w-full bg-primary-container rounded-full mb-2">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${stats.appConversion}%` }} />
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium">{stats.appConversion}% Application Conversion</span>
              </div>
              <div className="flex-1">
                <div className="h-2 w-full bg-secondary-container rounded-full mb-2">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${stats.interviewCompletion}%` }} />
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium">{stats.interviewCompletion}% Interview Completion</span>
              </div>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 bg-inverse-surface rounded-xl p-6 md:p-8 shadow-xl flex flex-col justify-center items-center text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center mb-2 md:mb-3">
              <span className="material-symbols-outlined text-white text-[20px]">bolt</span>
            </div>
            <span className="text-inverse-on-surface text-sm font-medium">Avg Time to Hire</span>
            <span className="text-xl md:text-2xl font-bold text-white mt-1">{stats.avgTimeToHire} Days</span>
          </div>
        </div>

        {/* Content Section: Desktop Table & Mobile Cards */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_20px_60px_rgba(42,52,57,0.04)] overflow-hidden">
          <div className="px-4 md:px-8 py-4 md:py-6 flex items-center justify-between border-b border-surface-container">
            <h3 className="text-base md:text-lg font-bold text-on-surface">Active Job Roles</h3>
            <div className="flex items-center space-x-2 md:space-x-4">
              <button className="flex items-center space-x-1 md:space-x-2 text-sm text-secondary hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">filter_list</span>
                <span className="font-medium hidden sm:inline">Filter</span>
              </button>
              <button className="flex items-center space-x-1 md:space-x-2 text-sm text-secondary hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">file_download</span>
                <span className="font-medium hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* ── Mobile View (Card Layout) ── */}
          <div className="block md:hidden divide-y divide-surface-container/50">
            {loading ? (
              <div className="p-8 text-center text-outline flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading jobdesks...</span>
              </div>
            ) : paginatedJobdesks.length === 0 ? (
              <div className="p-8 text-center text-outline">
                No jobdesks found. Create one to get started.
              </div>
            ) : (
              paginatedJobdesks.map((job) => (
                <div key={job.id} className="p-4 space-y-3 bg-surface-container-lowest hover:bg-surface-container-low/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-on-surface text-base">{job.title}</h4>
                      <p className="text-xs text-secondary font-medium">{companyName}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => navigate(`/recruitment/${job.id}`)}
                      className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-sm"
                      title="Lihat Hasil Screening"
                    >
                      <span className="text-sm">👥</span>
                      <span>{job.candidate_count || 0} Pelamar</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container-low">
                    <button
                      onClick={() => openEditModal(job)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                    >
                      <span>✏️</span> Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(job.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors"
                    >
                      <span>🗑️</span> Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Desktop View (Table Layout) ── */}
          <div className="hidden md:block overflow-x-auto w-full">
            <table className="text-left border-collapse" style={{ minWidth: '640px', width: '100%' }}>
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-4 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-outline whitespace-nowrap">Job Title & Subject</th>
                  <th className="px-4 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-outline whitespace-nowrap">Department</th>
                  <th className="px-4 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-center whitespace-nowrap">Candidates</th>
                  <th className="px-4 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-outline whitespace-nowrap">Status</th>
                  <th className="px-4 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-outline whitespace-nowrap">Posting Date</th>
                  <th className="px-4 md:px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-outline">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Loading jobdesks...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedJobdesks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-outline">
                      No jobdesks found. Create one to get started.
                    </td>
                  </tr>
                ) : paginatedJobdesks.map((job) => (
                  <tr key={job.id} className="hover:bg-surface-container-low/30 transition-colors group">
                    <td className="px-4 md:px-8 py-4 md:py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">{job.title}</span>
                        <span className="text-[11px] text-outline font-medium mt-0.5 max-w-[280px] truncate" title={job.email_subject}>
                          Email: {job.email_subject || `LAMARAN KERJA - ${job.title.toUpperCase()} - ${companyName}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-5">
                      <span className="text-sm text-on-surface-variant font-medium whitespace-nowrap">{job.department}</span>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-5 text-center">
                      <button
                        onClick={() => navigate(`/recruitment/${job.id}`)}
                        className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold px-3 py-1.5 rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm whitespace-nowrap"
                        title="Lihat Hasil Screening"
                      >
                        <span>👥</span>
                        <span>{job.candidate_count || 0} Pelamar</span>
                      </button>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-5">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-5">
                      <span className="text-sm text-on-surface-variant whitespace-nowrap">
                        {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(job)}
                          className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                          title="Edit Jobdesk"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteId(job.id)}
                          className="p-2 hover:bg-error/10 rounded-lg text-error transition-colors"
                          title="Delete Jobdesk"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 md:px-8 py-4 md:py-6 flex flex-wrap items-center justify-between gap-3 bg-surface-container-low/20">
            <span className="text-xs text-secondary font-medium">
              Showing {Math.min(paginatedJobdesks.length, ITEMS_PER_PAGE)} of {filteredJobdesks.length} job desks
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-outline-variant hover:bg-white transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${page === p ? 'bg-primary text-on-primary' : 'hover:bg-surface-container text-on-surface'}`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-outline-variant hover:bg-white transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? 'Edit Jobdesk' : 'Create Jobdesk'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-ghost">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-8 py-2.5 text-sm"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              ) : editMode ? 'Save Changes' : 'Publish Opening'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Job Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              Job Role Title <span className="text-error">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleFormChange}
              placeholder="e.g. Front End Developer"
              className="input-field"
            />
          </div>

          {/* Email Subject Auto Preview (Read Only) */}
          <div className="p-3.5 bg-primary-container/20 rounded-xl border border-primary/10 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>Otomatisasi Subject Email</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Subject dibuat otomatis oleh sistem untuk pencocokan email pelamar via IMAP:
            </p>
            <div className="p-2.5 bg-white/80 rounded-lg text-xs font-mono font-bold text-on-surface break-all border border-outline-variant/20 shadow-sm mt-1">
              {previewEmailSubject}
            </div>
          </div>

          {/* Department & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Department</label>
              <select name="department" value={form.department} onChange={handleFormChange} className="input-field">
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Experience Level</label>
              <select name="experience_level" value={form.experience_level} onChange={handleFormChange} className="input-field">
                {EXPERIENCE.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              Job Description (used for AI scoring)
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              placeholder="Define the core responsibilities, skills required, technologies, experience expected..."
              className="input-field h-32 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Delete"
        footer={
          <>
            <button onClick={() => setDeleteId(null)} className="btn-ghost">Cancel</button>
            <button
              onClick={() => handleDelete(deleteId)}
              className="px-8 py-2.5 bg-error text-on-error text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-on-surface-variant">
          Are you sure you want to delete this jobdesk? All associated applicants and scores will be permanently removed.
        </p>
      </Modal>
    </DashboardLayout>
  );
}
