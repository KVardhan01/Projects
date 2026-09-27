import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { role } = useAuth();

  const homePath =
    role === 'ADMIN' ? '/admin' : role === 'INSTRUCTOR' ? '/instructor' : '/student/dashboard';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6 animate-in fade-in">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-xl">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs font-mono font-bold uppercase text-rose-400">
          Access Denied • 403 Forbidden
        </span>
        <h1 className="text-2xl font-bold text-slate-100">
          Restricted Resource
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your account does not have sufficient authorization privileges to access this area.
          Role permissions are managed centrally in the organization directory.
        </p>
      </div>

      <Link
        to={homePath}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold shadow-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Authorized Portal</span>
      </Link>
    </div>
  );
};
