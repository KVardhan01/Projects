import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Atom, AlertCircle, ArrowRight, User, Lock } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, clearError } = useAuth();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    const cleanUsername = username.trim();

    // Required Field Validations
    if (!cleanUsername) {
      setLocalError('Username is required');
      return;
    }
    if (!password) {
      setLocalError('Password is required');
      return;
    }
    if (!confirmPassword) {
      setLocalError('Confirm password is required');
      return;
    }

    // Confirm password match validation
    if (password !== confirmPassword) {
      setLocalError('Confirm password is different');
      return;
    }

    try {
      await register(cleanUsername, password, confirmPassword);

      // Return user to login page with prefilled username and success banner
      navigate('/login', {
        replace: true,
        state: {
          registeredUsername: cleanUsername,
          successMessage: 'Account created successfully',
        },
      });
    } catch (err: any) {
      const msg = err.message || 'Unable to create account. Please try again.';
      setLocalError(msg);
    }
  };

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

        {/* Create Account Heading */}
        <div className="space-y-1.5 pt-1">
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Create your account
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Join Qubify to start your interactive quantum computing journey.
          </p>
        </div>

        {/* Error Notice */}
        {localError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs text-left flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-relaxed font-sans">{localError}</div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left pt-2">
          {/* Username field */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-username-input"
              className="text-xs font-medium text-slate-300 block"
            >
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-username-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-password-input"
              className="text-xs font-medium text-slate-300 block"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-password-input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Confirm Password field */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-confirm-password-input"
              className="text-xs font-medium text-slate-300 block"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-confirm-password-input"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Create Account Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Already have an account? Sign In */}
          <div className="pt-1 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </form>

        {/* Directory Notice */}
        <p className="text-[11px] text-slate-500 font-mono pt-1">
          Registered accounts are saved as Active STUDENT records in the Users directory.
        </p>
      </div>
    </div>
  );
};
