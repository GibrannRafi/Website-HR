import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../components/common/DashboardLayout';
import { ScoreBar, ScoreCircle, StatusBadge } from '../components/ui/ScoreComponents';
import Modal from '../components/ui/Modal';
import api from '../services/api';
import toast from 'react-hot-toast';

const SCREENING_STATUSES = ['Screening', 'Shortlisted', 'Technical Test', 'Final Interview', 'Hired', 'Rejected'];

export default function RecruitmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [jobdesk, setJobdesk] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [summary, setSummary] = useState({ inScreening: 0, interviewed: 0, onHold: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score_desc');

  // Status update modal
  const [statusModal, setStatusModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  // CV Preview modal
  const [cvModal, setCvModal] = useState(false);
  const [cvApplicant, setCvApplicant] = useState(null);

  // Rescore
  const [rescoring, setRescoring] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jRes, aRes, sRes] = await Promise.all([
        api.get(`/jobdesks/${id}`),
        api.get(`/jobdesks/${id}/applicants`),
        api.get(`/jobdesks/${id}/summary`),
      ]);
      setJobdesk(jRes.data);
      setApplicants(aRes.data);
      setSummary(sRes.data);
    } catch {
      // Demo data
      const demo = {
        id: parseInt(id),
        title: 'Front End Developer',
        subject_keyword: 'FRONT END',
        email_subject: 'LAMARAN KERJA - FRONT END',
        department: 'Engineering',
        experience_level: 'Mid-level',
        status: 'active',
        description: 'Looking for a skilled Frontend Developer proficient in React.js, TypeScript, TailwindCSS, REST API integration, responsive design, and modern JavaScript frameworks.',
      };
      setJobdesk(demo);
      setApplicants([
        { id: 1, name: 'Adrian Bennett', email: 'adrian@email.com', role: 'Senior Engineer', location: 'London, UK', match_score: 98, screening_status: 'Technical Test', email_status: 'Integrated', received_at: '2024-01-10', cv_text: 'Experienced React.js developer with 8 years of frontend experience...', matched_keywords: ['react', 'typescript', 'api'], missing_keywords: ['vue'] },
        { id: 2, name: 'Elena Lysander', email: 'elena@email.com', role: 'UI Engineer', location: 'Berlin, DE', match_score: 84, screening_status: 'Shortlisted', email_status: 'Pending', received_at: '2024-01-09', cv_text: 'Frontend engineer specializing in Vue.js and React...', matched_keywords: ['vue', 'react'], missing_keywords: ['typescript', 'api'] },
        { id: 3, name: 'Julian Pearce', email: 'julian@email.com', role: 'React Developer', location: 'Toronto, CA', match_score: 65, screening_status: 'Review Needed', email_status: 'Integrated', received_at: '2024-01-08', cv_text: 'Junior developer learning React and JavaScript basics...', matched_keywords: ['react'], missing_keywords: ['typescript', 'api', 'tailwind'] },
        { id: 4, name: 'Sasha Chen', email: 'sasha@email.com', role: 'Front End Architect', location: 'Singapore', match_score: 91, screening_status: 'Final Interview', email_status: 'Integrated', received_at: '2024-01-07', cv_text: 'Architect-level frontend developer with deep TypeScript and performance optimization experience...', matched_keywords: ['typescript', 'api', 'react'], missing_keywords: [] },
        { id: 5, name: 'Maria Santos', email: 'maria@email.com', role: 'Frontend Dev', location: 'Jakarta, ID', match_score: 77, screening_status: 'Screening', email_status: 'Integrated', received_at: '2024-01-06', cv_text: 'React developer with 3 years experience in e-commerce projects...', matched_keywords: ['react'], missing_keywords: ['typescript'] },
      ]);
      setSummary({ inScreening: 12, interviewed: 8, onHold: 4, avgScore: 83 });
    } finally {
      setLoading(false);
    }
  };

  const handleRescore = async () => {
    setRescoring(true);
    try {
      await api.post(`/jobdesks/${id}/rescore`);
      toast.success('Re-scoring complete! Scores updated.');
      fetchData();
    } catch {
      toast.error('Re-scoring failed. Please try again.');
    } finally {
      setRescoring(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedApplicant || !newStatus) return;
    try {
      await api.patch(`/applicants/${selectedApplicant.id}/status`, { screening_status: newStatus });
      toast.success('Status updated');
      setStatusModal(false);
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleSendEmail = async (applicant) => {
    try {
      await api.post(`/applicants/${applicant.id}/send-email`);
      toast.success(`Email sent to ${applicant.name}`);
    } catch {
      toast.error('Failed to send email');
    }
  };

  // Sorting & filtering
  const sortedApplicants = [...applicants]
    .filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.role?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'score_desc') return b.match_score - a.match_score;
      if (sortBy === 'score_asc') return a.match_score - b.match_score;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'date') return new Date(b.received_at) - new Date(a.received_at);
      return 0;
    });

  const getInitials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const avatarColors = [
    'bg-primary-container text-on-primary-container',
    'bg-tertiary-container text-on-tertiary-container',
    'bg-secondary-container text-on-secondary-container',
    'bg-primary-fixed-dim text-on-primary-fixed-variant',
  ];

  return (
    <DashboardLayout searchPlaceholder="Search applicants..." onSearch={setSearch}>
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 pb-12 md:pb-20 pt-4 md:pt-6 space-y-6 md:space-y-8">
        {/* Breadcrumb + Header */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <nav className="flex items-center space-x-2 text-xs font-medium text-outline-variant mb-2 md:mb-3">
              <Link to="/recruitment" className="hover:text-primary transition-colors">Recruitment</Link>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-on-surface">{jobdesk?.title || 'Loading...'}</span>
            </nav>
            <h2 className="text-2xl sm:text-4xl lg:text-[3.5rem] font-extrabold tracking-tight text-on-surface leading-tight">
              {jobdesk?.title?.split(' ').slice(0, 2).join(' ') || '—'}
            </h2>
            <p className="text-on-surface-variant mt-2 md:mt-3 text-xs md:text-sm max-w-lg">
              Reviewing {sortedApplicants.length} candidates • Email subject:{' '}
              <span className="font-bold text-primary">{jobdesk?.email_subject}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:space-x-3 w-full sm:w-auto">
            <button
              onClick={handleRescore}
              disabled={rescoring}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-surface-container-highest px-4 md:px-5 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-semibold text-on-surface transition-all hover:bg-surface-container active:scale-[0.98] min-h-[44px]"
            >
              {rescoring ? (
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              )}
              Re-Score All CVs
            </button>
            <button className="flex-1 sm:flex-initial btn-primary flex items-center justify-center gap-2 text-xs md:text-sm py-2.5 md:py-3 min-h-[44px]">
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              Export List
            </button>
          </div>
        </section>

        {/* Insights Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Avg Match Score */}
          <div className="lg:col-span-8 bg-surface-container-low rounded-xl p-5 md:p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-60">
                  Success Metric
                </span>
                <p className="text-2xl sm:text-4xl font-bold mt-2">
                  {loading ? '—' : `${summary.avgScore}% Match Avg.`}
                </p>
              </div>
              <ScoreCircle score={summary.avgScore || 0} size={64} />
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed mt-4 md:mt-6">
              The current pool represents active candidates scored by the TalentSift v2 AI engine using TF-IDF vectorization
              and Cosine Similarity. Higher scores indicate stronger alignment with the job description.
            </p>
          </div>

          {/* Quick Summary */}
          <div className="lg:col-span-4 bg-surface-container-highest rounded-xl p-5 md:p-8 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Quick Summary</span>
            <div className="space-y-3 md:space-y-4">
              {[
                { label: 'In Screening', value: summary.inScreening },
                { label: 'Interviewed', value: summary.interviewed },
                { label: 'On Hold', value: summary.onHold },
              ].map((item, i) => (
                <div key={i} className={`flex justify-between items-center ${i < 2 ? 'border-b border-outline-variant/10 pb-3' : ''}`}>
                  <span className="text-xs md:text-sm">{item.label}</span>
                  <span className="font-bold text-sm md:text-base">{String(item.value).padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Applicants Table */}
        <section className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="px-4 md:px-8 py-4 md:py-6 border-b border-surface-container-high flex flex-wrap justify-between items-center gap-3">
            <h3 className="font-bold text-base md:text-lg">Active Applicants</h3>
            <div className="flex items-center space-x-2 md:space-x-3">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-xs md:text-sm border-none bg-surface-container rounded-lg px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="score_desc">Score: High to Low</option>
                <option value="score_asc">Score: Low to High</option>
                <option value="name">Name A–Z</option>
                <option value="date">Latest First</option>
              </select>
              <button className="p-2 hover:bg-surface-container text-outline-variant rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">filter_list</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="text-left border-collapse" style={{ minWidth: '700px', width: '100%' }}>
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-outline-variant font-bold bg-surface-container-low/50">
                  <th className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap">#</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap">Applicant Name</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap">CV Match Score</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap">Screening Status</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap">Applied</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-outline">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Loading applicants...</span>
                      </div>
                    </td>
                  </tr>
                ) : sortedApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-outline">
                      No applicants found for this jobdesk yet.
                    </td>
                  </tr>
                ) : (
                  sortedApplicants.map((applicant, idx) => (
                    <tr key={applicant.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-4 md:px-8 py-4 md:py-5 text-sm text-outline font-medium whitespace-nowrap">{idx + 1}</td>
                      <td className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
                            {getInitials(applicant.name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{applicant.name}</p>
                            <p className="text-[10px] text-on-surface-variant">
                              {applicant.role} {applicant.location ? `• ${applicant.location}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap">
                        <ScoreBar score={applicant.match_score} />
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedApplicant(applicant);
                            setNewStatus(applicant.screening_status);
                            setStatusModal(true);
                          }}
                          className="hover:opacity-80 transition-opacity"
                        >
                          <StatusBadge status={applicant.screening_status} />
                        </button>
                      </td>

                      <td className="px-4 md:px-8 py-4 md:py-5 whitespace-nowrap">
                        <span className="text-xs text-on-surface-variant">
                          {applicant.received_at ? new Date(applicant.received_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </span>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 text-right whitespace-nowrap">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => { setCvApplicant(applicant); setCvModal(true); }}
                            className="text-xs font-bold text-primary hover:underline underline-offset-4 decoration-primary/20"
                          >
                            View CV
                          </button>
                          <button
                            onClick={() => handleSendEmail(applicant)}
                            className="text-xs font-bold text-primary hover:underline underline-offset-4 decoration-primary/20"
                          >
                            Send Email
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 md:px-8 py-4 bg-surface-container-low/30 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline-variant">
              Displaying {sortedApplicants.length} of {applicants.length} candidates
            </p>
          </div>
        </section>

        {/* ML Info Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 pb-4">
          <div className="lg:col-span-5 bg-primary p-6 md:p-12 rounded-xl text-on-primary relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
                TalentSift v2 — ML Engine
              </span>
              <h4 className="text-xl md:text-3xl font-bold mt-2 md:mt-4 leading-tight">
                Identify top 5% matches instantly.
              </h4>
              <p className="mt-2 md:mt-4 text-primary-container/80 text-xs md:text-sm leading-relaxed">
                TalentSift v2 uses Sentecend Bert and Cosine Similarity to compare CV text against
                the job description. Emails arriving with subject <strong>{jobdesk?.email_subject}</strong> are
                automatically parsed, scored, and indexed.
              </p>
              <button className="mt-6 md:mt-8 px-5 md:px-6 py-2.5 md:py-3 border border-on-primary/20 rounded-lg hover:bg-on-primary hover:text-primary transition-all text-xs font-bold min-h-[44px]">
                Configure Scoring Logic
              </button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/10 blur-[60px]" />
          </div>

          <div className="lg:col-span-7 bg-surface-container-low p-6 md:p-10 rounded-xl space-y-6 md:space-y-8">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-base md:text-lg">Automated Email Integration</h4>
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline-variant">Email Subject Filter</label>
                <div className="p-3 md:p-4 bg-white rounded-lg border border-outline-variant/10 text-xs md:text-sm font-mono font-medium text-primary break-all">
                  {jobdesk?.email_subject || '—'}
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline-variant">Trigger Schedule</label>
                <div className="p-3 md:p-4 bg-white rounded-lg border border-outline-variant/10 text-xs md:text-sm font-medium">
                  Every 5 minutes (IMAP polling)
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline-variant">Scoring Model</label>
                <div className="p-3 md:p-4 bg-white rounded-lg border border-outline-variant/10 text-xs md:text-sm font-medium">
                  model_talentsift_v2 (TF-IDF + Cosine)
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline-variant">High Match Threshold</label>
                <div className="p-3 md:p-4 bg-white rounded-lg border border-outline-variant/10 text-xs md:text-sm font-medium">
                  ≥ 80% → Auto Shortlist
                </div>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed italic">
              Emails pelamar dengan subject <strong>{jobdesk?.email_subject}</strong> secara otomatis diproses,
              CV di-parse, dan discore menggunakan TalentSift v2.
            </p>
          </div>
        </section>
      </div>

      {/* Status Update Modal */}
      <Modal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        title="Update Screening Status"
        footer={
          <>
            <button onClick={() => setStatusModal(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleUpdateStatus} className="btn-primary px-8 py-2.5 text-sm">
              Update Status
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Update status for <strong>{selectedApplicant?.name}</strong>
          </p>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">New Status</label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className="input-field"
            >
              {SCREENING_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* CV Preview Modal */}
      <Modal
        open={cvModal}
        onClose={() => setCvModal(false)}
        title={`CV — ${cvApplicant?.name}`}
        footer={
          <button onClick={() => setCvModal(false)} className="btn-ghost">Close</button>
        }
      >
        <div className="space-y-4">
          {/* Score */}
          <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-1">Match Score</p>
              <p className="text-2xl font-bold text-primary">{cvApplicant?.match_score}%</p>
            </div>
            <ScoreCircle score={cvApplicant?.match_score || 0} size={72} />
          </div>

          {/* Score breakdown & Insights */}
          <div className="p-4 bg-surface-container-low rounded-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-3">Score Analysis</p>
            <ScoreBar score={cvApplicant?.match_score || 0} />
            <p className="text-xs text-on-surface-variant mt-2">
              {cvApplicant?.match_score >= 80
                ? '✅ High match — candidate aligns well with job requirements'
                : cvApplicant?.match_score >= 60
                  ? '⚠️ Medium match — some alignment, further review recommended'
                  : '❌ Low match — significant skill gap detected'}
            </p>

            {/* AI Insights: Summary */}
            {cvApplicant?.insight_summary && (
              <div className="mt-5 pt-4 border-t border-outline-variant/20">
                <p className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-3">
                  Insight Summary
                </p>
                <div className="flex flex-wrap gap-4 text-sm font-medium">
                  <div className="bg-surface-container rounded-lg px-4 py-2 flex flex-col">
                    <span className="text-xl font-bold">{cvApplicant.insight_summary.total_requirements}</span>
                    <span className="text-[10px] uppercase tracking-widest text-outline-variant">Requirements Analyzed</span>
                  </div>
                  <div className="bg-primary/10 text-primary rounded-lg px-4 py-2 flex flex-col">
                    <span className="text-xl font-bold">{cvApplicant.insight_summary.matched}</span>
                    <span className="text-[10px] uppercase tracking-widest">Matched</span>
                  </div>
                  <div className="bg-secondary/10 text-secondary rounded-lg px-4 py-2 flex flex-col">
                    <span className="text-xl font-bold">{cvApplicant.insight_summary.partial}</span>
                    <span className="text-[10px] uppercase tracking-widest">Partial</span>
                  </div>
                  <div className="bg-error/10 text-error rounded-lg px-4 py-2 flex flex-col">
                    <span className="text-xl font-bold">{cvApplicant.insight_summary.missing}</span>
                    <span className="text-[10px] uppercase tracking-widest">Missing</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Insights: Keywords */}
            {cvApplicant?.requirement_analysis?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-outline-variant/20">
                <p className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-3">
                  AI Requirement Analysis
                </p>

                <div className="space-y-3">
                  {cvApplicant.requirement_analysis.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white rounded-lg border border-outline-variant/10"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <p className="text-xs font-semibold text-on-surface">
                          {item.requirement}
                        </p>
                      </div>

                      <div className="mt-3 flex justify-between items-center bg-surface-container/50 px-3 py-2 rounded-md">
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${
                          item.status === 'matched' ? 'text-primary' :
                          item.status === 'partial' ? 'text-secondary' : 'text-error'
                        }`}>
                          {item.status === 'matched' ? '✓ MATCHED' :
                           item.status === 'partial' ? '⚠ PARTIAL MATCH' : '✕ MISSING'}
                        </p>
                        <span className="text-sm font-bold text-on-surface-variant">
                          {item.similarity}%
                        </span>
                      </div>

                      <div className="mt-3">
                        <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">
                          CV EVIDENCE
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1 italic">
                          {item.cv_evidence ? `“${item.cv_evidence}”` : 'No relevant evidence found in the CV.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CV Text */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-outline-variant">CV Content (Parsed)</p>
            <div className="p-4 bg-surface-container rounded-xl max-h-60 overflow-y-auto no-scrollbar">
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                {cvApplicant?.cv_text || 'CV content not available.'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => { handleSendEmail(cvApplicant); setCvModal(false); }}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              Send Interview Email
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
