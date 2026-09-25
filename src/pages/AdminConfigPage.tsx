import React, { useState } from 'react';
import { GoogleSheetsService, SHEET_TABS } from '../services/google/googleSheets';
import { GeminiService } from '../services/ai/geminiClient';
import { Settings, Database, Sparkles, Check, AlertCircle } from 'lucide-react';

export const AdminConfigPage: React.FC = () => {
  const [sheetsId, setSheetsId] = useState(GoogleSheetsService.getSpreadsheetId());
  const [geminiKey, setGeminiKey] = useState(
    import.meta.env.VITE_GEMINI_API_KEY || ''
  );
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    GoogleSheetsService.setSpreadsheetId(sheetsId);
    GeminiService.setApiKey(geminiKey);
    setSaveNotice('Settings updated successfully!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleTestSheets = async () => {
    setTesting(true);
    const res = await GoogleSheetsService.testConnection();
    setTestResult(res);
    setTesting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-rose-400 mb-1">
          <Settings className="w-4 h-4" />
          <span>Platform Parameters</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
          System & API Configuration
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Manage your Google Cloud OAuth identity, persistent Google Sheets database bindings, and Gemini AI endpoints.
        </p>
      </div>

      {saveNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Google Sheets Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
              Google Sheets Database Store
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The platform uses a single Google Spreadsheet with 19 dedicated tabs as its persistent relational data store. Enter your Google Sheets Spreadsheet ID below.
          </p>

          <div>
            <label className="block text-xs text-slate-400 mb-1 font-mono">
              Spreadsheet ID (from URL /spreadsheets/d/&lt;ID&gt;/edit):
            </label>
            <input
              type="text"
              value={sheetsId}
              onChange={(e) => setSheetsId(e.target.value)}
              placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestSheets}
              disabled={testing || !sheetsId.trim()}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors disabled:opacity-40"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            {testResult && (
              <span
                className={`text-xs font-mono ${
                  testResult.ok ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {testResult.ok ? `✓ Connected: ${testResult.title}` : `✗ Error: ${testResult.error}`}
              </span>
            )}
          </div>

          {/* Required Spreadsheet Tabs Checklist */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
              Required 19 Spreadsheet Tabs:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SHEET_TABS.map((tab) => (
                <span
                  key={tab}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800"
                >
                  {tab}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Gemini AI Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
              Gemini AI Integration
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Powers the AI Quantum Study Companion, progressive hint generator, circuit debugging, and Qiskit code synthesis.
          </p>

          <div>
            <label className="block text-xs text-slate-400 mb-1 font-mono">
              Gemini API Key (optional — built-in quantum rule engine active when blank):
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <span className="text-amber-400 font-bold block mb-0.5">Security Notice:</span>
            In client-side architectures, API keys are accessed from browser scripts. For production deployments, apply HTTP Referrer restrictions in Google Cloud Console.
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        >
          Save Configuration Changes
        </button>
      </form>
    </div>
  );
};
