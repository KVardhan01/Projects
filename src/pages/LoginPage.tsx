import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Atom, AlertCircle, ArrowRight, User, Lock, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types/user';

export const routeByRole = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'INSTRUCTOR':
      return '/instructor';
    case 'STUDENT':
    default:
      return '/student/dashboard';
  }
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login, isLoading, error, clearError } = useAuth();

  const [username, setUsername] = useState<string>(() => {
    return (location.state as any)?.registeredUsername || '';
  });
  const [password, setPassword] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(() => {
    return (location.state as any)?.successMessage || null;
  });

  // If already authenticated with active status, automatically navigate to authorized portal
  useEffect(() => {
    if (isAuthenticated && user && user.isActive) {
      navigate(routeByRole(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setSuccessMessage(null);

    if (!username.trim() || !password.trim()) {
      setLocalError('Please enter both username and password.');
      return;
    }

    try {
      // Authenticate against the Users sheet table:
      // 1. Find matching user
      // 2. Verify username and password
      // 3. Check status is Active
      // 4. Read Role column and route automatically
      const authenticatedUser = await login(username.trim(), password.trim());
      navigate(routeByRole(authenticatedUser.role), { replace: true });
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const displayedError = localError || error;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background ambient quantum glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 space-y-6 text-center">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-xl shadow-cyan-500/20">
            <Atom className="w-8 h-8 text-slate-950 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-wider text-slate-100">
              QUBIFY
            </div>
            <div className="text-xs text-cyan-400 font-semibold tracking-wide uppercase mt-0.5 font-mono">
              QUANTUM LEARNING
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="space-y-1.5 pt-1">
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Sign in with your Qubify credentials to access your quantum workspace.
          </p>
        </div>

        {/* Success Notice */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs text-left flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="leading-relaxed font-sans">{successMessage}</div>
          </div>
        )}

        {/* Error Notice */}
        {displayedError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs text-left flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-relaxed font-sans">{displayedError}</div>
          </div>
        )}

        {/* Username & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left pt-2">
          {/* Username / Email field */}
          <div className="space-y-1.5">
            <label
              htmlFor="username-input"
              className="text-xs font-medium text-slate-300 block"
            >
              Username / Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="username-input"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username or email"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Password field (Never displayed in clear text) */}
          <div className="space-y-1.5">
            <label
              htmlFor="password-input"
              className="text-xs font-medium text-slate-300 block"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password-input"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* New user? Create an account */}
          <div className="pt-1 text-center">
            <p className="text-xs text-slate-400">
              New user?{' '}
              <Link
                to="/register"
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>
        </form>

        {/* Directory Notice */}
        <p className="text-[11px] text-slate-500 font-mono pt-1">
          Access restricted to active accounts registered in the Qubify Users directory.
        </p>
      </div>
    </div>
  );
};
