import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  Award,
  Zap,
  Sparkles,
  ChevronRight,
  Database,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleSheetsService } from '../../services/google/googleSheets';

interface TopBarProps {
  onOpenAITutor?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenAITutor }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, role } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Generate breadcrumb items from current path
  const pathParts = location.pathname.split('/').filter(Boolean);

  return (
    <header className="h-14 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link to="/dashboard" className="hover:text-slate-200 transition-colors">
          Workspace
        </Link>
        {pathParts.length > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        {pathParts.map((part, index) => {
          const isLast = index === pathParts.length - 1;
          const formatted = part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          return (
            <React.Fragment key={index}>
              <span className={isLast ? 'text-cyan-300 font-medium' : 'hover:text-slate-200'}>
                {formatted}
              </span>
              {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stats & Actions */}
      <div className="flex items-center gap-4">
        {/* Persistent Storage Status */}
        {GoogleSheetsService.isConfigured() && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Database className="w-3 h-3" />
            <span>Sheets Database</span>
          </div>
        )}

        {/* Gamification Stats (XP, Streak, Confidence) */}
        {user && role === 'STUDENT' && (
          <div className="hidden md:flex items-center gap-3">
            {/* XP */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-amber-300 font-semibold shadow-inner">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{user.xp.toLocaleString()} XP</span>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-orange-400 font-semibold shadow-inner">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>{user.streak}D STREAK</span>
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-cyan-300 font-semibold shadow-inner">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>{user.confidence}% CONFIDENCE</span>
            </div>
          </div>
        )}

        {/* AI Tutor Button */}
        {onOpenAITutor && (
          <button
            onClick={onOpenAITutor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-medium hover:bg-cyan-500/30 transition-all cursor-pointer shadow-sm shadow-cyan-500/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Ask AI Tutor</span>
          </button>
        )}

        {/* User Profile / Auth Action */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          {user && (
            <div className="flex items-center gap-2">
              <img
                src={
                  user.photoUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0891b2&color=fff`
                }
                alt={user.name}
                className="w-7 h-7 rounded-full border border-cyan-500/40 object-cover"
              />
              <div className="hidden lg:block text-left">
                <div className="text-xs font-medium text-slate-200 leading-tight">
                  {user.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono leading-none">
                  {role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out of Qubify"
                className="px-2 py-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors ml-1 cursor-pointer flex items-center gap-1 text-xs"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
