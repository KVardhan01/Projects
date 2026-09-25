import React, { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, AlertTriangle, Code2 } from 'lucide-react';
import { useQuantum } from '../../context/QuantumContext';

export const QiskitCodeEditor: React.FC = () => {
  const { qiskitCode, updateFromQiskit, qiskitWarnings } = useQuantum();
  const [editableCode, setEditableCode] = useState(qiskitCode);
  const [copied, setCopied] = useState(false);
  const [isSynced, setIsSynced] = useState(true);

  useEffect(() => {
    setEditableCode(qiskitCode);
    setIsSynced(true);
  }, [qiskitCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableCode(e.target.value);
    setIsSynced(false);
  };

  const handleApplyToVisual = () => {
    updateFromQiskit(editableCode);
    setIsSynced(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editableCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
      {/* Code Editor Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
            Qiskit Python Code
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {isSynced ? 'Synced with Canvas' : 'Modified (Unapplied)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isSynced && (
            <button
              onClick={handleApplyToVisual}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Apply to Canvas</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
            title="Copy Qiskit code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Warnings if any unsupported commands */}
      {qiskitWarnings.length > 0 && (
        <div className="p-2.5 bg-amber-950/60 border-b border-amber-800/80 text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="space-y-0.5">
            {qiskitWarnings.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>
        </div>
      )}

      {/* Code Area */}
      <div className="flex-1 relative p-3">
        <textarea
          value={editableCode}
          onChange={handleCodeChange}
          spellCheck={false}
          className="w-full h-full bg-slate-950 text-cyan-200 font-mono text-xs p-3 rounded-xl border border-slate-800/80 resize-none focus:outline-none focus:border-cyan-500 leading-relaxed"
        />
      </div>

      <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
        <span>Bi-directional AST Sync: Type qc.h(0), qc.cx(0, 1), etc.</span>
        <span className="text-cyan-400">Python 3.11 / Qiskit 1.x</span>
      </div>
    </div>
  );
};
