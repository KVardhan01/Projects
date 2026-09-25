import React, { useState } from 'react';
import { LocalDatabase } from '../services/storage/localDatabase';
import { UserProfile, UserRole } from '../types/user';
import { Users, Shield, Check, UserCheck, UserX } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const list = LocalDatabase.getUsers();
    if (list.length === 0) {
      const current = LocalDatabase.getCurrentUser();
      return current ? [current] : [];
    }
    return list;
  });

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const updated = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    setUsers(updated);
    const userToSave = updated.find((u) => u.id === userId);
    if (userToSave) LocalDatabase.saveUser(userToSave);
  };

  const handleToggleActive = (userId: string) => {
    const updated = users.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u));
    setUsers(updated);
    const userToSave = updated.find((u) => u.id === userId);
    if (userToSave) LocalDatabase.saveUser(userToSave);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-rose-400 mb-1">
          <Shield className="w-4 h-4" />
          <span>Role-Based Access Control</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
          User & Role Management
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Assign authorization roles (Student, Instructor, Admin), activate or deactivate accounts, and manage learner access.
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
            All Registered Users ({users.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-3 px-4">Name / Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">XP</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No registered user accounts found in the database.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-200">{u.name}</div>
                    <div className="text-[11px] text-slate-400 font-sans">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="INSTRUCTOR">INSTRUCTOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-amber-300 font-bold">{u.xp} XP</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        u.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleActive(u.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-sans transition-colors cursor-pointer ${
                        u.isActive
                          ? 'bg-slate-800 text-slate-300 hover:bg-rose-950 hover:text-rose-300'
                          : 'bg-emerald-600 text-slate-950 font-bold'
                      }`}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
