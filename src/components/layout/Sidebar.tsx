import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Atom,
  BookOpen,
  FlaskConical,
  BookMarked,
  CheckSquare,
  Award,
  BarChart3,
  User,
  Settings,
  Shield,
  GraduationCap,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/student/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['STUDENT'] },
    { to: '/learning', label: 'Learning Path', icon: BookOpen, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
    { to: '/circuit-lab', label: 'Circuit Lab', icon: FlaskConical, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
    { to: '/exercises', label: 'Exercises', icon: CheckSquare, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
    { to: '/reference', label: 'Reference', icon: BookMarked, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
    { to: '/progress', label: 'My Progress', icon: BarChart3, roles: ['STUDENT'] },
    { to: '/achievements', label: 'Achievements', icon: Award, roles: ['STUDENT'] },
  ];

  const instructorItems = [
    { to: '/instructor', label: 'Instructor Overview', icon: GraduationCap },
    { to: '/instructor/students', label: 'Student Directory', icon: User },
    { to: '/instructor/exercises', label: 'Exercise Builder', icon: CheckSquare },
    { to: '/instructor/analytics', label: 'Cohort Telemetry', icon: BarChart3 },
  ];

  const adminItems = [
    { to: '/admin', label: 'Admin Console', icon: Shield },
    { to: '/admin/users', label: 'User & Roles', icon: User },
    { to: '/admin/settings', label: 'Platform Settings', icon: Settings },
  ];

  const homePath =
    role === 'ADMIN' ? '/admin' : role === 'INSTRUCTOR' ? '/instructor' : '/student/dashboard';

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col shrink-0 select-none backdrop-blur-md">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <NavLink to={homePath} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Atom className="w-5 h-5 text-slate-950 stroke-[2.2]" />
          </div>
          <div>
            <div className="font-bold text-base tracking-wider text-slate-100 flex items-center gap-1.5 font-mono">
              QUBIFY
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide">
              QUANTUM LEARNING
            </div>
          </div>
        </NavLink>
      </div>

      {/* Verified Role Identity Display (Read-Only) */}
      <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-[11px] font-mono text-slate-300 font-medium truncate">
            {user?.name || 'Verified User'}
          </span>
        </div>
        <span
          className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded font-bold border shrink-0 ${
            role === 'ADMIN'
              ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
              : role === 'INSTRUCTOR'
              ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
              : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
          }`}
        >
          {role}
        </span>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Workspace
          </div>
          <div className="space-y-1">
            {navItems
              .filter((item) => item.roles.includes(role))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 text-cyan-400/80" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
          </div>
        </div>

        {/* Instructor Section */}
        {(role === 'INSTRUCTOR' || role === 'ADMIN') && (
          <div>
            <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Instructor Portal</span>
            </div>
            <div className="space-y-1">
              {instructorItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin Section */}
        {role === 'ADMIN' && (
          <div>
            <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Administration</span>
            </div>
            <div className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 text-rose-400" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Logout */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <NavLink to="/reference" className="hover:text-slate-200 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Reference</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800/60"
          title="Sign out of Qubify"
        >
          <LogOut className="w-3 h-3 text-rose-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
