import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || '/dashboard';

  const [form,     setForm]     = useState({ email: '', password: '' });
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ── Root: full viewport, no vertical scroll on desktop ── */
    <div className="bg-surface min-h-screen flex flex-col antialiased overflow-x-hidden">

      {/* Background decorators */}
      <div className="fixed inset-0 -z-20 bg-surface" />
      <div className="fixed inset-0 -z-10 bg-grid-pattern pointer-events-none" />
      <div className="fixed top-1/4 -right-20 w-64 md:w-96 h-64 md:h-96 bg-primary-container/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-1/4 -left-20 w-64 md:w-96 h-64 md:h-96 bg-tertiary-container/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* ── Top bar ── */}
      <header className="fixed top-0 w-full flex justify-between items-center px-4 md:px-8 h-14 md:h-16 bg-surface/80 backdrop-blur-xl z-50">
        <div className="text-base md:text-lg font-bold tracking-tighter text-on-background">Portal HR</div>
        <div className="flex items-center gap-4 md:gap-6">
          <span className="material-symbols-outlined text-primary cursor-pointer hover:opacity-70 transition-opacity text-[20px] md:text-[24px]">language</span>
          <span className="material-symbols-outlined text-primary cursor-pointer hover:opacity-70 transition-opacity text-[20px] md:text-[24px]">help_outline</span>
        </div>
      </header>

      {/* ── Main: grow to fill available space, center content ── */}
      <main className="flex-1 flex items-center justify-center w-full pt-14 md:pt-16 pb-16 md:pb-12 px-4 md:px-6">
        <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 lg:gap-32">

          {/* ── Left branding (hidden on mobile) ── */}
          <div className="hidden md:flex flex-col max-w-sm lg:max-w-md animate-slide-in flex-shrink-0">
            <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tighter text-on-background mb-4 lg:mb-6 leading-tight">
              Design the future of your{' '}
              <span className="text-primary">workforce.</span>
            </h1>
            <p className="text-on-surface-variant text-base lg:text-lg leading-relaxed mb-8 lg:mb-12">
              A professional sanctuary for HR leadership. Managing personnel with the precision of a master artisan.
            </p>
            <div className="space-y-5 lg:space-y-8">
              <div className="flex flex-col">
                <span className="text-primary font-bold text-3xl lg:text-4xl tracking-tight">98%</span>
                <span className="text-sm font-medium tracking-widest text-outline uppercase">Retention Rate</span>
              </div>
              <div className="h-px w-12 bg-surface-container-highest" />
              <div className="flex flex-col">
                <span className="text-primary font-bold text-3xl lg:text-4xl tracking-tight">2.4k</span>
                <span className="text-sm font-medium tracking-widest text-outline uppercase">Talent Managed</span>
              </div>
            </div>
          </div>

          {/* ── Login card ── */}
          <div className="w-full max-w-[420px] bg-surface-container-lowest rounded-xl p-6 sm:p-8 md:p-10 shadow-[0_20px_40px_rgba(15,23,42,0.04)] relative animate-fade-in flex-shrink-0">
            <div className="absolute -top-1 -right-1 w-24 h-24 bg-primary/5 rounded-full blur-3xl -z-10" />

            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-on-background tracking-tight mb-1.5">Welcome Back</h2>
              <p className="text-on-surface-variant text-sm">
                Please enter your credentials to access the portal.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-outline-variant px-1" htmlFor="email">
                  Corporate Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@organization.com"
                  className="input-field"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-outline-variant" htmlFor="password">
                    Security Key
                  </label>
                  <button type="button" className="text-xs font-semibold text-primary hover:opacity-70 transition-opacity">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors min-h-[44px] flex items-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 md:mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-4 w-full">
                <div className="h-px flex-1 bg-surface-container-highest" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-outline-variant font-bold">Registration</span>
                <div className="h-px flex-1 bg-surface-container-highest" />
              </div>
              <p className="text-sm text-on-surface-variant">
                New to the platform?{' '}
                <Link to="/register" className="text-primary font-bold ml-1 hover:underline underline-offset-4 decoration-primary/30">
                  Register a new account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full px-4 md:px-8 py-3 md:py-4 flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-surface-container-highest/30">
        <p className="text-[10px] text-outline-variant font-medium tracking-widest uppercase text-center sm:text-left">
          © 2026 Portal HR Management. All rights reserved.
        </p>
        <div className="flex gap-6">
          <button className="text-[10px] text-outline-variant font-medium tracking-widest uppercase hover:text-primary transition-colors">
            Privacy Policy
          </button>
          <button className="text-[10px] text-outline-variant font-medium tracking-widest uppercase hover:text-primary transition-colors">
            Terms of Service
          </button>
        </div>
      </footer>
    </div>
  );
}
