import React, { useState } from 'react';
import { REMOTE_BACKENDS_INFO } from '../../quantum/backends/RemoteBackends';
import { useQuantum } from '../../context/QuantumContext';
import { Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { QuantumBackendType } from '../../types/quantum';

export const BackendSelector: React.FC = () => {
  const { activeBackend, setActiveBackend } = useQuantum();
  const [selectedBackend, setSelectedBackend] = useState<QuantumBackendType>(activeBackend);
  const [showModal, setShowModal] = useState(false);

  const activeInfo = REMOTE_BACKENDS_INFO.find((b) => b.id === activeBackend);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-mono transition-colors cursor-pointer"
        title="Switch Quantum Simulator Backend"
      >
        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-slate-200 truncate max-w-[130px] sm:max-w-none">
          {activeInfo?.name || 'In-Browser Simulator'}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
      </button>

      {/* Backend Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Quantum Simulator Backends</h3>
                  <p className="text-[11px] text-slate-400">Select execution engine or target hardware</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {REMOTE_BACKENDS_INFO.map((backend) => {
                const isSelected = activeBackend === backend.id;
                return (
                  <div
                    key={backend.id}
                    onClick={() => {
                      if (backend.isAvailable) {
                        setActiveBackend(backend.id);
                        setShowModal(false);
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-sm'
                        : backend.isAvailable
                        ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 cursor-pointer'
                        : 'bg-slate-950/40 border-slate-800/80 opacity-65 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200 flex items-center gap-2">
                        {backend.name}
                        {isSelected && (
                          <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded font-mono">
                            ACTIVE
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          backend.isAvailable
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {backend.isAvailable ? 'Available' : 'Remote Service'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed mb-1.5">
                      {backend.description}
                    </p>

                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                      {backend.isAvailable ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                      )}
                      <span>{backend.statusMessage}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
