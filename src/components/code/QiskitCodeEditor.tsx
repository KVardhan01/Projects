import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileCode2,
} from 'lucide-react';
import { useQuantum } from '../../context/QuantumContext';

export const QiskitCodeEditor: React.FC = () => {
  const {
    qiskitCode,
    updateFromQiskit,
    qiskitWarnings,
    validationErrors,
    simulationError,
    syncSource,
  } = useQuantum();

  const [localCode, setLocalCode] = useState<string>(qiskitCode);
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditorReady, setIsEditorReady] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // When visual circuit updates (syncSource === 'visual'), update the editor text
  useEffect(() => {
    if (syncSource === 'visual' || localCode !== qiskitCode) {
      setLocalCode(qiskitCode);
    }
  }, [qiskitCode, syncSource]);

  // Handle user typing in the Python/Qiskit code editor
  const handleEditorChange = (value: string | undefined) => {
    const newCode = value ?? '';
    setLocalCode(newCode);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce to allow natural typing before parsing
    debounceTimerRef.current = setTimeout(() => {
      updateFromQiskit(newCode);
    }, 200);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleResetToVisual = () => {
    setLocalCode(qiskitCode);
    updateFromQiskit(qiskitCode);
  };

  const hasErrors = validationErrors.length > 0 || Boolean(simulationError);

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Editor Header - Clearly labeled Python / Qiskit Code */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <FileCode2 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span>Python / Qiskit Code</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-sans font-normal">
                Qiskit 1.x
              </span>
            </div>
          </div>
        </div>

        {/* Synchronization and Actions */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono">
            {hasErrors ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-rose-400 font-sans">Syntax Error / Unsupported</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 font-sans flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 inline" />
                  Synced with Visual Circuit
                </span>
              </>
            )}
          </div>

          {/* Reset button if syntax error */}
          {hasErrors && (
            <button
              onClick={handleResetToVisual}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors cursor-pointer"
              title="Reset code to last valid visual circuit"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Reset to Visual</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
            title="Copy Python/Qiskit code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unsupported Operations / Errors Notice */}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-rose-950/70 border-b border-rose-800/80 text-rose-200 text-xs space-y-1 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Qiskit Code Validation Warning</span>
          </div>
          {validationErrors.map((err, i) => (
            <div key={i} className="pl-6 text-[11px] font-mono text-rose-300">
              {err}
            </div>
          ))}
          <div className="pl-6 text-[11px] text-slate-400 pt-0.5">
            The visual circuit remains on the last valid state until errors are resolved.
          </div>
        </div>
      )}

      {/* Warnings if any */}
      {qiskitWarnings.length > 0 && validationErrors.length === 0 && (
        <div className="p-2.5 bg-amber-950/60 border-b border-amber-800/80 text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="space-y-0.5 text-[11px]">
            {qiskitWarnings.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>
        </div>
      )}

      {/* Monaco Code Editor Area */}
      <div className="flex-1 min-h-[220px] relative bg-[#1e1e1e]">
        <Editor
          height="100%"
          language="python"
          theme="vs-dark"
          value={localCode}
          onChange={handleEditorChange}
          onMount={() => setIsEditorReady(true)}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
            padding: { top: 10, bottom: 10 },
            renderLineHighlight: 'all',
          }}
          loading={
            <div className="p-4 text-slate-400 text-xs font-mono flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              Loading Python / Qiskit Monaco Editor...
            </div>
          }
        />
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-slate-900/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono flex-wrap gap-2">
        <span className="text-slate-400">
          Bidirectional: Edits here instantly update the Visual Quantum Circuit
        </span>
        <span className="text-cyan-400">Language: Python 3.11</span>
      </div>
    </div>
  );
};
