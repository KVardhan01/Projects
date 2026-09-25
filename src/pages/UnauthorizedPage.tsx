import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { role, switchRole } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-5 animate-in fade-in">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-xl">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs font-mono font-bold uppercase text-rose-400">
          Access Restricted • Error 403
        </span>
        <h1 className="text-2xl font-bold text-slate-100">
          Unauthorized Access Level
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your active authorization role (<span className="text-cyan-300 font-mono font-bold">{role}</span>) does not have privileges to view this portal area.
        </p>
      </div>

      {/* Quick Role Switcher for Evaluation */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 max-w-sm w-full">
        <div className="text-[11px] text-slate-400">
          Switch role below to inspect restricted portals:
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => switchRole('STUDENT')}
            className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
              role === 'STUDENT' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => switchRole('INSTRUCTOR')}
            className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
              role === 'INSTRUCTOR' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Instructor
          </button>
          <button
            onClick={() => switchRole('ADMIN')}
            className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
              role === 'ADMIN' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
