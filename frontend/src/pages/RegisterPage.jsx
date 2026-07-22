import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.company || !form.password || !form.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        company: form.company,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-20 bg-surface/80 backdrop-blur-xl border-b border-surface-container-high/30">
        <div className="text-lg font-bold tracking-tighter text-on-background">Portal HR</div>
        <div className="flex gap-6 items-center">
          <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">help_outline</span>
          <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">language</span>
        </div>
      </header>

      <main className="h-screen pt-20 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
        {/* Background decorators */}
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-primary-container/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-tertiary-container/20 rounded-full blur-[100px] pointer-events-none" />

        <section className="w-full max-w-[1100px] h-[calc(100vh-7rem)] max-h-[750px] grid md:grid-cols-12 gap-0 bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(15,23,42,0.04)] overflow-hidden relative z-10 animate-fade-in">
          {/* Left branding panel */}
          <div className="hidden md:flex md:col-span-5 bg-surface-container-low p-10 lg:p-12 flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tighter leading-tight text-on-surface mb-4">
                Design the future of your workforce.
              </h1>
              <p className="text-on-surface-variant text-sm font-medium leading-relaxed max-w-xs">
                A workspace built for precision, clarity, and intentional management.
              </p>
            </div>
            <div className="mt-6 relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                  <span
                    className="material-symbols-outlined text-[20px] text-on-primary-container"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">Precision Metrics</p>
                  <p className="text-[11px] text-on-surface-variant">Real-time data visualization</p>
                </div>
              </div>
            </div>
            {/* Bottom architectural image */}
            <div className="absolute bottom-0 right-0 w-full h-1/2 opacity-10 pointer-events-none">
              <img
                className="w-full h-full object-cover"
                alt="minimalist architectural details"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZUujCgidZl2Jl-2bV-08hei-yBH5X1IAoibI2MT7ftI_UyPAAwIdA1jPRA1gEA8Ct2z1X6KvuUmyl9FGPhhM0ehzbFptFip7QmJXM4LV78L1dwZcC8xBQqZetANWD4aqIJ3cS-4pn5if9WEFZlXYjqY04TtBaMsQ64kl_g3tpHinjvwJmfwsCrKLa_G8kyfVTXuYem6IQmcmHlMwMzCKr_fh8jDsbkfM4t6Hz5XhIjMagMTToSn4V-yjD7HQBr1HeM6PSY_OaHZ4"
              />
            </div>
          </div>

          {/* Right form panel */}
          <div className="col-span-12 md:col-span-7 px-6 py-10 md:px-12 md:py-12 lg:px-16 lg:py-14 overflow-y-auto no-scrollbar max-h-full">
            <div className="max-w-md mx-auto flex flex-col">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface mb-1">Create Account</h2>
                <p className="text-on-surface-variant text-xs md:text-sm">
                  Join Portal HR and start managing with precision.
                </p>
              </div>

              <form className="space-y-4 md:space-y-5" onSubmit={handleSubmit}>
                {/* Full Name */}
                <div className="space-y-1 group">
                  <label
                    className="block text-[10px] font-bold tracking-[0.05em] uppercase text-outline transition-colors group-focus-within:text-primary"
                    htmlFor="name"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Julianne Smith"
                    className="input-ghost"
                    autoComplete="name"
                  />
                </div>

                {/* Work Email */}
                <div className="space-y-1 group">
                  <label
                    className="block text-[10px] font-bold tracking-[0.05em] uppercase text-outline transition-colors group-focus-within:text-primary"
                    htmlFor="email"
                  >
                    Work Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="julianne@company.com"
                    className="input-ghost"
                    autoComplete="email"
                  />
                </div>

                {/* Company */}
                <div className="space-y-1 group">
                  <label
                    className="block text-[10px] font-bold tracking-[0.05em] uppercase text-outline transition-colors group-focus-within:text-primary"
                    htmlFor="company"
                  >
                    Company Name
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Digital Atelier Ltd."
                    className="input-ghost"
                    autoComplete="organization"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1 group">
                  <label
                    className="block text-[10px] font-bold tracking-[0.05em] uppercase text-outline transition-colors group-focus-within:text-primary"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="input-ghost pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1 group">
                  <label
                    className="block text-[10px] font-bold tracking-[0.05em] uppercase text-outline transition-colors group-focus-within:text-primary"
                    htmlFor="confirmPassword"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-ghost"
                    autoComplete="new-password"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create Account</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <p className="text-xs text-on-surface-variant">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary font-bold ml-1 hover:underline underline-offset-4 decoration-primary/20">
                    Login
                  </Link>
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-6 opacity-45">
                <span className="text-[9px] font-bold tracking-widest uppercase">Privacy</span>
                <span className="text-[9px] font-bold tracking-widest uppercase">Terms</span>
                <span className="text-[9px] font-bold tracking-widest uppercase">Cookies</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Success overlay */}
      {success && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 glass-bg animate-fade-in">
          <div className="max-w-md w-full text-center p-12">
            <span
              className="material-symbols-outlined text-6xl text-primary mb-8 block"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <h3 className="text-3xl font-bold tracking-tight text-on-surface mb-4">Welcome to Portal HR.</h3>
            <p className="text-on-surface-variant mb-12 leading-relaxed">
              Your professional sanctuary is ready. You can now log in to your workspace.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-surface-container-highest text-on-surface font-bold py-4 px-10 rounded-lg hover:bg-surface-variant transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
