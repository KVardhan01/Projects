import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UsersSheetService } from '../services/auth/usersSheetService';
import { logger } from '../services/logger';
import { Atom, AlertCircle, ArrowRight, User, Lock, Eye, EyeOff } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, clearError } = useAuth();

  const [username, setUsername] = useState<string>(() => '');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    const cleanUsername = username.trim();
    logger.info('Registration', `Registration request started for username: ${cleanUsername || '[empty]'}`);

    // 1. Check Username is entered
    if (!cleanUsername) {
      logger.warning('Registration', 'Username is required');
      setLocalError('Username is required');
      return;
    }

    // 2. Check whether the username already exists (case-insensitive)
    if (UsersSheetService.usernameExists(cleanUsername)) {
      logger.warning('Registration', `Duplicate username detected for username: ${cleanUsername}`);
      setLocalError('User already exists');
      return;
    }

    // 3. Validate Password
    if (!password) {
      logger.warning('Registration', 'Password validation failure: Password is required');
      setLocalError('Password is required');
      return;
    }
    if (password.length < 8) {
      logger.warning('Registration', 'Password validation failure: Minimum 8 characters required');
      setLocalError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      logger.warning('Registration', 'Password validation failure: Uppercase letter missing');
      setLocalError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(password)) {
      logger.warning('Registration', 'Password validation failure: Lowercase letter missing');
      setLocalError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      logger.warning('Registration', 'Password validation failure: Number missing');
      setLocalError('Password must contain at least one number');
      return;
    }
    if (!/[^A-Za-z0-9\s]/.test(password)) {
      logger.warning('Registration', 'Password validation failure: Special character missing');
      setLocalError('Password must contain at least one special character');
      return;
    }

    // 4. Validate Confirm Password
    if (!confirmPassword) {
      logger.warning('Registration', 'Confirm password mismatch: Confirm password is required');
      setLocalError('Confirm password is required');
      return;
    }
    if (password !== confirmPassword) {
      logger.warning('Registration', 'Confirm password mismatch: Passwords do not match');
      setLocalError('Confirm password is different');
      return;
    }

    // 5. Only if ALL validations pass: Create account
    try {
      await register(cleanUsername, password, confirmPassword);
      logger.success('Registration', `Registration request successful for username: ${cleanUsername}`);

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
      if (msg.includes('Google Apps Script Web App URL is not configured')) {
        logger.error('Registration', 'Google Apps Script Web App URL is not configured');
      } else if (msg === 'User already exists') {
        logger.warning('Registration', `Duplicate username: ${cleanUsername}`);
      } else {
        logger.error('Registration', `Google Sheet write failed: ${msg}`);
      }
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
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none focus:text-cyan-400 transition-colors p-0.5 rounded cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
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
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none focus:text-cyan-400 transition-colors p-0.5 rounded cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
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
