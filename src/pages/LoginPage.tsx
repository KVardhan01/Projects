import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Atom, Sparkles, Shield, GraduationCap, User, ArrowRight } from 'lucide-react';
import { UserRole } from '../types/user';
import { GoogleAuthService } from '../services/google/googleAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, loginDemo, isLoading, error } = useAuth();
  const [activeTab, setActiveTab] = useState<'google' | 'demo'>(() => {
    return GoogleAuthService.isConfigured() ? 'google' : 'demo';
  });
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (!GoogleAuthService.isConfigured()) {
      setGoogleNotice(
        'Google authentication is not configured yet because the final deployment URL has not been decided. The application runs fully in development/demo mode without requiring VITE_GOOGLE_CLIENT_ID.'
      );
      return;
    }
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (e: any) {
      console.warn(e);
      setGoogleNotice(e.message || 'Google authentication was not completed.');
    }
  };

  const handleDemoSignIn = (role: UserRole) => {
    loginDemo(role);
    if (role === 'INSTRUCTOR') {
      navigate('/instructor');
    } else if (role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background ambient quantum glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6 text-center">
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-xl shadow-cyan-500/20">
            <Atom className="w-8 h-8 text-slate-950 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-wider text-slate-100 flex items-center justify-center gap-1.5">
              QUBIFY
            </div>
            <div className="text-xs text-slate-400 font-medium">
              AI-Powered Quantum Algorithm Learning Platform
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs text-left">
            {error}
          </div>
        )}

        {googleNotice && (
          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs text-left">
            {googleNotice}
          </div>
        )}

        {/* Tab switch between Google Identity Services and Demo Mode */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'demo'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Instant Demo Mode
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'google'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google Identity
          </button>
        </div>

        {activeTab === 'google' ? (
          <div className="space-y-4">
            {!GoogleAuthService.isConfigured() ? (
              <div className="space-y-3.5 text-left p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-mono font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Pending Deployment URL</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Google authentication is not configured yet because the final deployment URL has not been decided. Keep authentication in development/demo mode and allow the application to run without <code className="text-cyan-300 font-mono">VITE_GOOGLE_CLIENT_ID</code>.
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  No fake OAuth credentials are used. Real Google Login and Sheets syncing will be enabled later once the final deployment URL is available.
                </p>
                <button
                  onClick={() => setActiveTab('demo')}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer text-center"
                >
                  Explore in Instant Demo Mode
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sign in with your Google Account via Google Identity Services. Your profile, XP, and circuit submissions will sync to Google Sheets.
                </p>

                {/* Official Google Material Style Button per Section 6 & workspace skill */}
                <button
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
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Select a role persona to explore the platform without Google OAuth:
            </p>

            <button
              onClick={() => handleDemoSignIn('STUDENT')}
              className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-100 flex items-center justify-between transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-cyan-400" />
                <div className="text-left">
                  <div>Enter as Student</div>
                  <div className="text-[10px] text-slate-400 font-normal">Alex Rivera (0 XP · New Student)</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => handleDemoSignIn('INSTRUCTOR')}
              className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-100 flex items-center justify-between transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <div className="text-left">
                  <div>Enter as Instructor</div>
                  <div className="text-[10px] text-slate-400 font-normal">Dr. Evelyn Vance</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => handleDemoSignIn('ADMIN')}
              className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-100 flex items-center justify-between transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-rose-400" />
                <div className="text-left">
                  <div>Enter as Administrator</div>
                  <div className="text-[10px] text-slate-400 font-normal">Dr. Marcus Sterling</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
