import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/common/DashboardLayout';
import Modal from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/ScoreComponents';
import api from '../services/api';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Engineering', 'Marketing', 'Product', 'Design', 'Operations', 'HR', 'Finance'];
const EXPERIENCE = ['Junior', 'Mid-level', 'Senior', 'Lead'];

const emptyForm = {
  title: '',
  subject_keyword: '',
  department: 'Engineering',
  experience_level: 'Mid-level',
  description: '',
};

export default function RecruitmentPage() {
  const navigate = useNavigate();
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
        { id: 1, title: 'Senior Product Designer', subject_keyword: 'PRODUCT DESIGNER', department: 'Creative Arts', experience_level: 'Senior', status: 'active', candidate_count: 14, created_at: '2023-10-12', email_subject: 'LAMARAN KERJA - PRODUCT DESIGNER' },
        { id: 2, title: 'Cloud Infrastructure Lead', subject_keyword: 'CLOUD INFRASTRUCTURE', department: 'Engineering', experience_level: 'Lead', status: 'on hold', candidate_count: 5, created_at: '2023-11-04', email_subject: 'LAMARAN KERJA - CLOUD INFRASTRUCTURE' },
        { id: 3, title: 'Lead Talent Sourcer', subject_keyword: 'TALENT SOURCER', department: 'Operations', experience_level: 'Senior', status: 'active', candidate_count: 10, created_at: '2023-11-18', email_subject: 'LAMARAN KERJA - TALENT SOURCER' },
        { id: 4, title: 'Front End Developer', subject_keyword: 'FRONT END', department: 'Engineering', experience_level: 'Mid-level', status: 'active', candidate_count: 24, created_at: '2023-12-01', email_subject: 'LAMARAN KERJA - FRONT END' },
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
      subject_keyword: job.subject_keyword,
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
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-generate subject_keyword from title
      if (name === 'title') {
        updated.subject_keyword = value.toUpperCase();
      }
      return updated;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.subject_keyword || !form.department) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        email_subject: `LAMARAN KERJA - ${form.subject_keyword.trim().toUpperCase()}`,
      };
      if (editMode) {
        await api.put(`/jobdesks/${editId}`, payload);
        toast.success('Jobdesk updated successfully');
      } else {
        await api.post('/jobdesks', payload);
        toast.success('Jobdesk created! Email subject generated.');
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

  const previewEmailSubject = `LAMARAN KERJA - ${(form.subject_keyword || '').trim().toUpperCase() || '...'}`;

  return (
    <DashboardLayout searchPlaceholder="Search job desks, candidates..." onSearch={setSearch}>
      <div className="px-12 pb-12 pt-8">
        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Jobdesk Management</h2>
            <p className="text-secondary font-medium">Oversee active openings and recruitment pipelines.</p>
          </div>
          <button onClick={openAddModal} className="btn-primary flex items-center space-x-2">
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span className="font-bold tracking-tight">Add New Jobdesk</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-12 gap-6 mb-10">
          <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-xl p-8 shadow-[0_20px_40px_rgba(15,23,42,0.03)] flex flex-col justify-between h-48 border-b-2 border-primary/10">
            <span className="text-secondary font-semibold text-xs uppercase tracking-widest">Total Openings</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-extrabold text-primary-dim">{stats.totalOpenings}</span>
              <span className="text-primary text-sm font-medium">+3 this month</span>
            </div>
          </div>

          <div className="col-span-12 md:col-span-5 bg-surface-container-lowest rounded-xl p-8 shadow-[0_20px_40px_rgba(15,23,42,0.03)] flex flex-col justify-between h-48">
            <span className="text-secondary font-semibold text-xs uppercase tracking-widest">Pipeline Health</span>
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="h-2 w-full bg-primary-container rounded-full mb-3">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${stats.appConversion}%` }} />
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium">{stats.appConversion}% Application Conversion</span>
              </div>
              <div className="flex-1">
                <div className="h-2 w-full bg-secondary-container rounded-full mb-3">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${stats.interviewCompletion}%` }} />
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium">{stats.interviewCompletion}% Interview Completion</span>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-3 bg-inverse-surface rounded-xl p-8 shadow-xl flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-white">bolt</span>
            </div>
            <span className="text-inverse-on-surface text-sm font-medium">Avg Time to Hire</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.avgTimeToHire} Days</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_20px_60px_rgba(42,52,57,0.04)] overflow-hidden">
          <div className="px-8 py-6 flex items-center justify-between border-b border-surface-container">
            <h3 className="text-lg font-bold text-on-surface">Active Job Roles</h3>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 text-sm text-secondary hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">filter_list</span>
                <span className="font-medium">Filter</span>
              </button>
              <button className="flex items-center space-x-2 text-sm text-secondary hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">file_download</span>
                <span className="font-medium">Export</span>
              </button>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Job Title & Subject</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Department</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-center">Candidates</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Posting Date</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-right">Actions</th>
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
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface">{job.title}</span>
                      <span className="text-[11px] text-outline font-medium mt-0.5">
                        Email: {job.email_subject}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm text-on-surface-variant font-medium">{job.department}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button
                      onClick={() => navigate(`/recruitment/${job.id}`)}
                      className="text-sm font-bold text-primary hover:underline underline-offset-4"
                    >
                      {job.candidate_count || 0} candidates
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm text-on-surface-variant">
                      {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/recruitment/${job.id}`)}
                        className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                        title="View Applicants"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button
                        onClick={() => openEditModal(job)}
                        className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteId(job.id)}
                        className="p-2 hover:bg-error/10 rounded-lg text-error transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-8 py-6 flex items-center justify-between bg-surface-container-low/20">
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
              placeholder="e.g. Senior Software Engineer"
              className="input-field"
            />
          </div>

          {/* Subject Keyword */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              Email Subject Keyword <span className="text-error">*</span>
            </label>
            <input
              name="subject_keyword"
              value={form.subject_keyword}
              onChange={handleFormChange}
              placeholder="e.g. FRONT END"
              className="input-field"
            />
            <div className="flex items-center gap-2 mt-1 p-3 bg-primary-container/20 rounded-lg">
              <span className="material-symbols-outlined text-primary text-[16px]">mail</span>
              <p className="text-xs text-on-surface-variant">
                Email subject pelamar:{' '}
                <strong className="text-on-surface font-bold">{previewEmailSubject}</strong>
              </p>
            </div>
          </div>

          {/* Department & Experience */}
          <div className="grid grid-cols-2 gap-5">
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
