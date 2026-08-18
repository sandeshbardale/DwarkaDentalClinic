import { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { ROLE_HOME } from '../../data/users';

const DEMO_CREDS = [
  { role: 'Admin', email: 'admin@dwarkadental.com', password: 'admin123', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { role: 'Doctor', email: 'doctor@dwarkadental.com', password: 'doctor123', color: 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border-[var(--color-primary-200)]' },
  { role: 'Receptionist', email: 'receptionist@dwarkadental.com', password: 'recep123', color: 'bg-amber-50 text-amber-700 border-amber-200' },
];

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const { isAuthenticated, role } = useSelector(state => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated && role) {
    return <Navigate to={ROLE_HOME[role]} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await login(email, password);
  }

  function fillDemo(cred) {
    setEmail(cred.email);
    setPassword(cred.password);
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 40%, #e6f7f5 100%)' }}>
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full" aria-hidden="true">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-[var(--color-primary-500)]/8 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-[var(--color-accent-500)]/8 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-500)] flex items-center justify-center shadow-lg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2C8 2 4 5 4 9c0 2.5 1 4 2 5.5S8 17 8 22h8c0-5 2-4 4-7.5s2-3 2-5.5c0-4-4-7-8-7z"/>
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-[var(--color-text)] mb-3 leading-tight">
            Dwarka Dental Clinic
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] mb-10">
            Professional dental care management for patients, doctors, and staff.
          </p>

          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Patients Served', value: '2,100+' },
              { label: 'Doctors', value: '5' },
              { label: 'Years of Service', value: '12' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/80">
                <p className="text-2xl font-bold text-[var(--color-primary-500)]">{stat.value}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-500)] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2C8 2 4 5 4 9c0 2.5 1 4 2 5.5S8 17 8 22h8c0-5 2-4 4-7.5s2-3 2-5.5c0-4-4-7-8-7z"/>
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--color-text)]">Dwarka Dental Clinic</p>
              <p className="text-xs text-[var(--color-text-muted)]">Management System</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-[var(--color-border)] p-8">
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-1">Sign in</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">Enter your credentials to access the system.</p>

            {/* Demo role shortcuts */}
            <div className="mb-6">
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">Quick access — Demo credentials:</p>
              <div className="flex flex-wrap gap-2">
                {DEMO_CREDS.map(cred => (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() => fillDemo(cred)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-opacity hover:opacity-80 cursor-pointer ${cred.color}`}
                  >
                    {cred.role}
                  </button>
                ))}
              </div>
            </div>

            {/* Error alert */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-4" role="alert">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="mb-4">
                <label htmlFor="login-email" className="text-sm font-medium text-[var(--color-text)] block mb-1.5">
                  Email address <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@dwarkadental.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                  aria-label="Email address"
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label htmlFor="login-password" className="text-sm font-medium text-[var(--color-text)] block mb-1.5">
                  Password <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input pr-10"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me / Forgot */}
              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] cursor-pointer">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-[var(--color-border)]"
                  />
                  Remember me
                </label>
                <button type="button" className="text-sm text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] cursor-pointer">
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full h-10 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                    Signing in…
                  </>
                ) : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-[var(--color-text-subtle)] mt-4">
            © 2024 Dwarka Dental Clinic. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
