import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthService } from '../services/google/googleAuth';
import { Atom, AlertCircle, Key, X } from 'lucide-react';
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
  const { user, isAuthenticated, loginWithGoogle, isLoading, error, clearError } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [inputClientId, setInputClientId] = useState<string>(GoogleAuthService.getClientId());

  // If already authenticated with active status and role, redirect to authorized dashboard
  useEffect(() => {
    if (isAuthenticated && user && user.isActive) {
      navigate(routeByRole(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleGoogleSignIn = async () => {
    clearError();
    setLoginError(null);

    if (!GoogleAuthService.isConfigured()) {
      setShowConfigModal(true);
      return;
    }

    try {
      const authenticatedUser = await loginWithGoogle();
      navigate(routeByRole(authenticatedUser.role), { replace: true });
    } catch (err: any) {
      setLoginError(err.message || 'Google authentication was not completed.');
    }
  };

  const handleSaveClientId = async () => {
    if (!inputClientId || inputClientId.trim().length < 6) {
      setLoginError('Please enter a valid Google Cloud OAuth Client ID.');
      return;
    }
    GoogleAuthService.setClientId(inputClientId.trim());
    setShowConfigModal(false);
    setLoginError(null);
    try {
      const authenticatedUser = await loginWithGoogle();
      navigate(routeByRole(authenticatedUser.role), { replace: true });
    } catch (err: any) {
      setLoginError(err.message || 'Google authentication was not completed.');
    }
  };

  const displayedError = loginError || error;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background ambient quantum glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 space-y-6 text-center">
        {/* Brand Logo & Title */}
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

        {/* Welcome message */}
        <div className="space-y-1.5 pt-2">
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Sign in with your Google account to access your quantum workspace, circuits, and learning records.
          </p>
        </div>

        {/* Error Notice */}
        {displayedError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs text-left flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-relaxed font-sans">{displayedError}</div>
          </div>
        )}

        {/* Continue with Google button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs shadow-lg transition-all cursor-pointer border border-slate-200 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Security & Access Information */}
        <p className="text-[11px] text-slate-500 font-mono pt-2">
          Access restricted to active registered users in the Qubify directory.
        </p>
      </div>

      {/* OAuth Client ID Configuration Modal (If not set in env) */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100">
                Google OAuth 2.0 Client ID
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your Google Cloud OAuth Client ID (from Google Cloud Console &gt; APIs &amp; Services &gt; Credentials) to connect Google Sign-In with Google Sheets.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-mono text-slate-300">
                OAuth Web Client ID
              </label>
              <input
                type="text"
                value={inputClientId}
                onChange={(e) => setInputClientId(e.target.value)}
                placeholder="xxxxxx.apps.googleusercontent.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/60"
              />
              <p className="text-[10px] text-slate-400">
                Origin: <code className="text-cyan-400">{window.location.origin}</code>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClientId}
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
              >
                Save & Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
