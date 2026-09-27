import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleSheetsService } from '../services/google/googleSheets';
import { User, Award, Flame, Zap, Shield, Mail, Calendar, Database } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, role } = useAuth();
  const sheetsConnected = GoogleSheetsService.isConfigured();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <img
            src={
              user.photoUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0891b2&color=fff`
            }
            alt={user.name}
            className="w-16 h-16 rounded-2xl border-2 border-cyan-500/40 object-cover shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-100">{user.name}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold uppercase">
                {role}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
          Account & Credentials
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1 text-[10px]">ACCOUNT ROLE:</span>
            <span className="text-cyan-300 font-bold">{user.role}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1 text-[10px]">DATA PERSISTENCE:</span>
            <span className={sheetsConnected ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
              {sheetsConnected ? 'Google Sheets v4 API' : 'Relational Directory Store'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1 text-[10px]">TOTAL XP EARNED:</span>
            <span className="text-amber-300 font-bold">{user.xp.toLocaleString()} XP</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1 text-[10px]">CONFIDENCE SCORE:</span>
            <span className="text-teal-300 font-bold">{user.confidence}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
