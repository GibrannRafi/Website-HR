import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/common/DashboardLayout';
import Modal from '../components/ui/Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch {
      toast.error('Gagal memuat data HR');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (hrUser) => {
    const isActive = hrUser.role === 'hr';
    const action = isActive ? 'deactivate' : 'activate';
    try {
      await api.patch(`/admin/users/${hrUser.id}/status`, { action });
      toast.success(`Akun ${hrUser.name} berhasil di-${isActive ? 'nonaktifkan' : 'aktifkan'}!`);
      fetchUsers();
    } catch {
      toast.error('Gagal mengubah status akun');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      toast.success(`Akun ${selectedUser.name} berhasil dihapus`);
      setDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch {
      toast.error('Gagal menghapus akun');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.company || '').toLowerCase().includes(search.toLowerCase())
  );

  const avatarColors = [
    'bg-primary-container text-on-primary-container',
    'bg-tertiary-container text-on-tertiary-container',
    'bg-secondary-container text-on-secondary-container',
  ];
  const getInitials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-[16px]">manage_accounts</span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Admin Panel</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Kelola Akun HR</h2>
            <p className="text-on-surface-variant mt-1 text-xs md:text-sm">
              Daftar seluruh HR yang terdaftar di platform Portal HR.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 bg-surface-container-highest px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-surface-container transition-colors min-h-[44px]"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Dashboard
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
          <input
            type="text"
            placeholder="Cari HR berdasarkan nama, email, perusahaan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface-container rounded-xl border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Users Table */}
        <section className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="px-5 md:px-8 py-4 border-b border-surface-container-high flex items-center justify-between">
            <h3 className="font-bold text-sm md:text-base">Daftar Akun HR</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline-variant">
              {filteredUsers.length} HR Terdaftar
            </span>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="text-left border-collapse" style={{ minWidth: '700px', width: '100%' }}>
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-outline-variant font-bold bg-surface-container-low/50">
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">#</th>
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">Nama HR</th>
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">Perusahaan</th>
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">Lowongan</th>
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">Pelamar</th>
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">Status</th>
                  <th className="px-5 md:px-8 py-4 whitespace-nowrap">Bergabung</th>
                  <th className="px-5 md:px-8 py-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-16 text-center text-outline">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Memuat data HR...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-16 text-center text-outline">
                      Tidak ada HR yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((hrUser, idx) => (
                    <tr key={hrUser.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-5 md:px-8 py-4 text-sm text-outline">{idx + 1}</td>
                      <td className="px-5 md:px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
                            {getInitials(hrUser.name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{hrUser.name}</p>
                            <p className="text-[10px] text-on-surface-variant">{hrUser.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 md:px-8 py-4 text-sm">{hrUser.company || '—'}</td>
                      <td className="px-5 md:px-8 py-4">
                        <span className="inline-flex items-center gap-1 text-sm font-bold">
                          <span className="material-symbols-outlined text-[14px] text-primary">work</span>
                          {hrUser.total_jobs}
                        </span>
                      </td>
                      <td className="px-5 md:px-8 py-4">
                        <span className="inline-flex items-center gap-1 text-sm font-bold">
                          <span className="material-symbols-outlined text-[14px] text-secondary">person</span>
                          {hrUser.total_applicants}
                        </span>
                      </td>
                      <td className="px-5 md:px-8 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          hrUser.role === 'hr'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-error/10 text-error'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hrUser.role === 'hr' ? 'bg-emerald-500' : 'bg-error'}`} />
                          {hrUser.role === 'hr' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-5 md:px-8 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                        {hrUser.created_at ? new Date(hrUser.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 md:px-8 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(hrUser)}
                            title={hrUser.role === 'hr' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                              hrUser.role === 'hr'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {hrUser.role === 'hr' ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button
                            onClick={() => { setSelectedUser(hrUser); setDeleteModal(true); }}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModal}
        onClose={() => { setDeleteModal(false); setSelectedUser(null); }}
        title="Hapus Akun HR"
        footer={
          <>
            <button onClick={() => { setDeleteModal(false); setSelectedUser(null); }} className="btn-ghost">
              Batal
            </button>
            <button onClick={handleDelete} className="bg-error text-on-error px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-error/90 transition-colors">
              Ya, Hapus Akun
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-on-surface-variant">
            Apakah kamu yakin ingin menghapus akun HR <strong>{selectedUser?.name}</strong> ({selectedUser?.email})?
          </p>
          <div className="p-3 bg-error/5 border border-error/20 rounded-xl">
            <p className="text-xs text-error font-medium">
              ⚠️ Semua jobdesk dan data pelamar milik HR ini juga akan ikut terhapus secara permanen!
            </p>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
