import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Settings,
  Database,
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { GoogleSheetsService } from '../services/google/googleSheets';
import { GeminiService } from '../services/ai/geminiClient';
import { LocalDatabase } from '../services/storage/localDatabase';

export const AdminDashboardPage: React.FC = () => {
  const users = LocalDatabase.getUsers();
  const circuits = LocalDatabase.getCircuits();
  const [sheetsTesting, setSheetsTesting] = useState(false);
  const [sheetsStatus, setSheetsStatus] = useState<any | null>(null);

  const testSheets = async () => {
    setSheetsTesting(true);
    const res = await GoogleSheetsService.testConnection();
    setSheetsStatus(res);
    setSheetsTesting(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-rose-400 mb-1">
          <Shield className="w-4 h-4" />
          <span>System Administration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
          Platform Governance & Configuration
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Supervise user role authorizations, inspect persistent Google Sheets connectivity, configure Gemini AI parameters, and review system diagnostics.
        </p>
      </div>

      {/* System Health Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Google Sheets Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>PERSISTENT STORAGE</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-slate-100">
            {GoogleSheetsService.isConfigured() ? 'Google Sheets v4' : 'LocalStorage (Demo)'}
          </div>
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                GoogleSheetsService.isConfigured() ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span>
              {GoogleSheetsService.isConfigured()
                ? `ID: ${GoogleSheetsService.getSpreadsheetId().slice(0, 10)}...`
                : 'Demo Mode Active'}
            </span>
          </div>
          <button
            onClick={testSheets}
            disabled={sheetsTesting}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono pt-1 cursor-pointer block"
          >
            {sheetsTesting ? 'Testing API...' : 'Test Connection'}
          </button>
          {sheetsStatus && (
            <div
              className={`text-[10px] font-mono p-1.5 rounded ${
                sheetsStatus.ok
                  ? 'bg-emerald-950 text-emerald-300'
                  : 'bg-rose-950 text-rose-300'
              }`}
            >
              {sheetsStatus.ok ? `Connected: ${sheetsStatus.title}` : sheetsStatus.error}
            </div>
          )}
        </div>

        {/* Gemini AI Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>AI TUTOR ENGINE</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-slate-100">
            {GeminiService.isAvailable() ? 'Gemini 2.5 Flash' : 'Built-in Quantum Engine'}
          </div>
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                GeminiService.isAvailable() ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
            />
            <span>
              {GeminiService.isAvailable() ? 'API Key Attached' : 'Local Fallback Active'}
            </span>
          </div>
        </div>

        {/* Browser Quantum Engine */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>SIMULATOR STATUS</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-slate-100">
            Complex128 State Vector
          </div>
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>100% Client-Side Execution</span>
          </div>
        </div>
      </div>

      {/* Navigation to Admin Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/users"
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 transition-colors space-y-2"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-100">User & Role Management</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Assign Student, Instructor, or Admin roles, activate/deactivate accounts, and inspect user activity audit logs.
          </p>
        </Link>

        <Link
          to="/admin/config"
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 transition-colors space-y-2"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-100">Platform & Google Sheets Setup</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure Google Sheets Spreadsheet ID, OAuth client scopes, Gemini parameters, and inspect tab schemas.
          </p>
        </Link>
      </div>
    </div>
  );
};
