import React, { useState } from 'react';
import { GateType, GateInfo } from '../../types/quantum';
import { GATE_REGISTRY } from '../../quantum/QuantumGate';
import { Info, HelpCircle } from 'lucide-react';

interface GatePaletteProps {
  selectedGate: GateType | null;
  onSelectGate: (gate: GateType) => void;
  allowedGates?: GateType[];
}

export const GatePalette: React.FC<GatePaletteProps> = ({
  selectedGate,
  onSelectGate,
  allowedGates,
}) => {
  const [inspectingGate, setInspectingGate] = useState<GateInfo | null>(null);

  const gates = Object.values(GATE_REGISTRY).filter(
    (g) => !allowedGates || allowedGates.includes(g.type)
  );

  const categories = [
    { id: 'single', label: 'Single Qubit' },
    { id: 'phase', label: 'Phase & Rotations' },
    { id: 'multi', label: 'Entangling & Multi' },
    { id: 'measurement', label: 'Measurement' },
  ];

  return (
    <div className="w-56 bg-slate-900/95 border-r border-slate-800/90 flex flex-col p-4 shrink-0 select-none">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
          Gate Toolkit
        </h3>
        <span className="text-[10px] text-cyan-400 font-medium bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
          Palette
        </span>
      </div>

      <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
        Select a gate or drag it onto the circuit grid:
      </p>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {categories.map((cat) => {
          const catGates = gates.filter((g) => g.category === cat.id);
          if (catGates.length === 0) return null;

          return (
            <div key={cat.id}>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {cat.label}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {catGates.map((gate) => {
                  const isSelected = selectedGate === gate.type;
                  return (
                    <div
                      key={gate.type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', gate.type);
                        onSelectGate(gate.type);
                      }}
                      onClick={() => onSelectGate(gate.type)}
                      className={`relative group p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20 scale-[1.02]'
                          : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/70 text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      {/* Gate Chip */}
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm font-mono shadow-inner ${
                          gate.type === 'H'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : gate.type === 'X'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : gate.type === 'CX'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : gate.type === 'M'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : gate.type === 'SWAP'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        }`}
                      >
                        {gate.symbol}
                      </div>

                      <div className="text-[11px] font-medium text-slate-300 mt-1 truncate max-w-full">
                        {gate.name.split(' ')[0]}
                      </div>

                      {/* Tooltip trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingGate(gate);
                        }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-100 transition-opacity"
                        title="Gate details"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspect Gate Details Modal */}
      {inspectingGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold font-mono">
                  {inspectingGate.symbol}
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{inspectingGate.name}</h4>
                  <div className="text-[10px] text-cyan-400 font-mono">
                    {inspectingGate.qiskitSyntax}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectingGate(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {inspectingGate.description}
            </p>

            <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">
              Properties
            </div>
            <div className="text-xs text-slate-400 space-y-1 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <div>Targets: {inspectingGate.numTargets} qubit(s)</div>
              <div>Controls: {inspectingGate.numControls} qubit(s)</div>
              <div>Category: {inspectingGate.category}</div>
            </div>

            <button
              onClick={() => {
                onSelectGate(inspectingGate.type);
                setInspectingGate(null);
              }}
              className="mt-4 w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Select Gate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
