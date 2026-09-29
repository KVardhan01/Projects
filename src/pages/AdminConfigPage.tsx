import React, { useState } from 'react';
import { GoogleSheetsService, SHEET_TABS } from '../services/google/googleSheets';
import { GeminiService } from '../services/ai/geminiClient';
import { Settings, Database, Sparkles, Check, FileCode, Key } from 'lucide-react';

export const AdminConfigPage: React.FC = () => {
  const [sheetsId, setSheetsId] = useState(GoogleSheetsService.getSpreadsheetId());
  const [appsScriptUrl, setAppsScriptUrl] = useState(GoogleSheetsService.getAppsScriptUrl());
  const [accessToken, setAccessToken] = useState(GoogleSheetsService.getAccessToken());
  const [geminiKey, setGeminiKey] = useState(
    import.meta.env.VITE_GEMINI_API_KEY || ''
  );
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    GoogleSheetsService.setSpreadsheetId(sheetsId);
    GoogleSheetsService.setAppsScriptUrl(appsScriptUrl);
    GoogleSheetsService.setAccessToken(accessToken);
    GeminiService.setApiKey(geminiKey);
    setSaveNotice('Settings updated successfully!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleTestSheets = async () => {
    setTesting(true);
    GoogleSheetsService.setSpreadsheetId(sheetsId);
    GoogleSheetsService.setAppsScriptUrl(appsScriptUrl);
    GoogleSheetsService.setAccessToken(accessToken);
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
          System & Database Configuration
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Configure your Google Sheets persistent database bindings, Google Apps Script bridge, and Gemini AI endpoints.
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
                Google Sheets Database Store
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowScriptModal(!showScriptModal)}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-mono underline"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{showScriptModal ? 'Hide Apps Script' : 'View Apps Script Code'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The platform persists registered students into the <strong>Users</strong> tab of your Google Spreadsheet (<code>UserId | Name | Username | Password | Role | Status | CreatedAt</code>).
          </p>

          {/* Spreadsheet ID */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-mono">
              Spreadsheet ID (from URL <code>/spreadsheets/d/&lt;ID&gt;/edit</code>):
            </label>
            <input
              type="text"
              value={sheetsId}
              onChange={(e) => setSheetsId(e.target.value)}
              placeholder="1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Google Apps Script Web App URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-slate-400 font-mono">
                Google Apps Script Web App URL (Recommended for Zero-Auth Database Writes):
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">No Student Google Sign-In Required</span>
            </div>
            <input
              type="url"
              value={appsScriptUrl}
              onChange={(e) => setAppsScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Deploy the Apps Script from <code>/google-apps-script.js</code> on your Google Sheet with "Execute as Me" and "Access: Anyone".
            </p>
          </div>

          {/* Google OAuth Access Token (Alternative) */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Key className="w-3 h-3 text-slate-400" />
              <label className="block text-xs text-slate-400 font-mono">
                OAuth 2.0 Access Token (Alternative for direct Google Sheets API v4):
              </label>
            </div>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="ya29.a0..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          {showScriptModal && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                <span className="font-bold text-cyan-400">Google Apps Script (Code.gs)</span>
                <button
                  type="button"
                  onClick={() => {
                    const code = `var SPREADSHEET_ID = '1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U';

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = params.action || 'read';
    var sheetId = params.sheetId || params.spreadsheetId || SPREADSHEET_ID;
    var tabName = params.tab || params.sheet || 'Users';

    var ss = SpreadsheetApp.openById(sheetId) || SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(tabName) || ss.getSheets()[0];
    var values = sheet.getDataRange().getValues();

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      tab: sheet.getName(),
      headers: values[0] || [],
      rows: values.slice(1) || []
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try { payload = JSON.parse(e.postData.contents); } catch (pErr) { payload = e.parameter || {}; }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action || 'register';
    var sheetId = payload.spreadsheetId || payload.sheetId || SPREADSHEET_ID;
    var ss = SpreadsheetApp.openById(sheetId) || SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Users') || ss.getSheets()[0];

    if (action === 'register' || action === 'registerUser') {
      var username = (payload.username || '').toString().trim();
      var password = (payload.password || '').toString();
      var name = (payload.name || username).toString().trim();

      if (!username) return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: 'Username is required' })).setMimeType(ContentService.MimeType.JSON);

      var values = sheet.getDataRange().getValues();
      var checkUser = username.toLowerCase();
      var maxNum = 0;

      for (var r = 1; r < values.length; r++) {
        var row = values[r];
        if (!row || row.length === 0) continue;
        var existingUser = (row[2] || '').toString().trim().toLowerCase();
        if (existingUser === checkUser) {
          return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            success: false,
            error: 'User already exists',
            message: 'User already exists'
          })).setMimeType(ContentService.MimeType.JSON);
        }
        var m = (row[0] || '').toString().match(/^U(\\d+)$/i);
        if (m) {
          var n = parseInt(m[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }

      var nextUserId = 'U' + ('000' + (maxNum + 1)).slice(-3);
      var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'UTC', 'yyyy-MM-dd');
      var newRow = [nextUserId, name, username, password, 'STUDENT', 'Active', today];
      sheet.appendRow(newRow);
      SpreadsheetApp.flush();

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        success: true,
        message: 'Account created successfully',
        userId: nextUserId,
        user: { userId: nextUserId, name: name, username: username, role: 'STUDENT', status: 'Active', createdAt: today }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'appendRow' || action === 'append') {
      sheet.appendRow(payload.row);
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Row appended successfully' })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unsupported action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
                    navigator.clipboard.writeText(code);
                    alert('Full Google Apps Script copied to clipboard!');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] underline cursor-pointer"
                >
                  Copy Script Code
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                In your Google Sheet, go to <strong>Extensions &gt; Apps Script</strong>, paste the code from <code>/google-apps-script.js</code>, and click <strong>Deploy &gt; New deployment &gt; Web app</strong> with Execute as: <strong>Me</strong> and Who has access: <strong>Anyone</strong>.
              </p>
            </div>
          )}

          {/* Test Connection Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestSheets}
              disabled={testing || !sheetsId.trim()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors disabled:opacity-40 cursor-pointer"
            >
              {testing ? 'Testing Connection...' : 'Test Database Connection'}
            </button>
            {testResult && (
              <span
                className={`text-xs font-mono ${
                  testResult.ok ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {testResult.ok ? `✓ ${testResult.title}` : `✗ ${testResult.error}`}
              </span>
            )}
          </div>

          {/* Required Spreadsheet Tabs Checklist */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
              Required Spreadsheet Tabs:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SHEET_TABS.map((tab) => (
                <span
                  key={tab}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    tab === 'Users'
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
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
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer hover:opacity-95"
        >
          Save Configuration Changes
        </button>
      </form>
    </div>
  );
};
