import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';

export const Sidebar: React.FC = () => {
  const { role, switchRole, isDemoMode } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
    { to: '/learn', label: 'Learning Path', icon: BookOpen, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
    { to: '/lab', label: 'Circuit Lab', icon: FlaskConical, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
    { to: '/exercises', label: 'Exercises', icon: CheckSquare, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
    { to: '/reference', label: 'Reference', icon: BookMarked, roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
    { to: '/progress', label: 'My Progress', icon: BarChart3, roles: ['STUDENT'] },
    { to: '/achievements', label: 'Achievements', icon: Award, roles: ['STUDENT'] },
  ];

  const instructorItems = [
    { to: '/instructor', label: 'Instructor Overview', icon: GraduationCap },
    { to: '/instructor/students', label: 'Student Analytics', icon: User },
    { to: '/instructor/exercises', label: 'Exercise Builder', icon: CheckSquare },
  ];

  const adminItems = [
    { to: '/admin', label: 'Admin Console', icon: Shield },
    { to: '/admin/users', label: 'User & Roles', icon: User },
    { to: '/admin/config', label: 'Platform Config', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col shrink-0 select-none backdrop-blur-md">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
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

      {/* Role Switcher Toolbar (Crucial for Reviewing Student / Instructor / Admin) */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/60">
        <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1.5 flex items-center justify-between">
          <span>Active Role</span>
          {isDemoMode && (
            <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded font-mono">
              DEMO
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          {(['STUDENT', 'INSTRUCTOR', 'ADMIN'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => switchRole(r)}
              className={`text-[10px] font-medium py-1 rounded transition-colors ${
                role === r
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {r === 'STUDENT' ? 'Student' : r === 'INSTRUCTOR' ? 'Instr' : 'Admin'}
            </button>
          ))}
        </div>
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

        {/* Current Path Widget */}
        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <div className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
            Current Learning Path
          </div>
          <div className="text-xs font-medium text-slate-200 mt-1 line-clamp-1">
            Quantum States & Gates
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full w-[45%]" />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
            <span>3 of 8 Lessons</span>
            <span>45%</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <NavLink to="/reference" className="hover:text-slate-200 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Documentation</span>
        </NavLink>
        <span className="font-mono text-[10px] text-cyan-500">v2.5</span>
      </div>
    </aside>
  );
};
