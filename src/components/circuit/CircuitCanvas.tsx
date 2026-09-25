import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Undo2,
  Redo2,
  RotateCcw,
  Sparkles,
  Save,
  Play,
  Gauge,
  X,
  Radio,
} from 'lucide-react';
import { GateType, CircuitModel, CircuitOperation } from '../../types/quantum';
import { GATE_REGISTRY } from '../../quantum/QuantumGate';
import { useQuantum } from '../../context/QuantumContext';

interface CircuitCanvasProps {
  editable?: boolean;
  onSimulate?: () => void;
  onOpenAITutor?: () => void;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  editable = true,
  onSimulate,
  onOpenAITutor,
}) => {
  const {
    circuit,
    selectedGate,
    canUndo,
    canRedo,
    validationErrors,
    addGate,
    removeGate,
    addQubit,
    removeQubit,
    toggleInitialValue,
    clearCircuit,
    undo,
    redo,
    saveCircuit,
    runSimulation,
    isSimulating,
  } = useQuantum();

  const [hoveredOp, setHoveredOp] = useState<string | null>(null);
  const [controlSelection, setControlSelection] = useState<{
    targetQubit: number;
    moment: number;
  } | null>(null);

  const numQubits = circuit.numQubits;
  const numMoments = Math.max(circuit.numMoments, 6);

  // Handle click on grid cell
  const handleCellClick = (qubitIndex: number, momentIndex: number) => {
    if (!editable) return;

    // If awaiting control qubit selection for CNOT
    if (controlSelection && controlSelection.moment === momentIndex) {
      if (controlSelection.targetQubit !== qubitIndex) {
        addGate('CX', controlSelection.targetQubit, momentIndex, qubitIndex);
        setControlSelection(null);
        return;
      }
    }

    if (!selectedGate) return;

    if (selectedGate === 'CX') {
      // Need control qubit: set state to prompt user to pick control qubit
      setControlSelection({ targetQubit: qubitIndex, moment: momentIndex });
      return;
    }

    if (selectedGate === 'SWAP') {
      // Pick next available qubit as partner
      const partner = qubitIndex === numQubits - 1 ? qubitIndex - 1 : qubitIndex + 1;
      addGate('SWAP', qubitIndex, momentIndex);
      return;
    }

    // Single-qubit or measurement gate
    addGate(selectedGate, qubitIndex, momentIndex);
  };

  // Find operations at a given moment
  const getOperationsAtMoment = (moment: number) => {
    return circuit.operations.filter((op) => op.moment === moment);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 min-h-0 border-x border-slate-800">
      {/* Canvas Action Bar */}
      <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSimulate ? onSimulate() : runSimulation()}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : 'Simulate Circuit'}</span>
          </button>

          <button
            onClick={saveCircuit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors cursor-pointer"
            title="Save to Persistent Storage"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* History Controls */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 border border-slate-700 transition-colors"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 border border-slate-700 transition-colors"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={clearCircuit}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Clear all gates"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Qubit Management */}
        <div className="flex items-center gap-2">
          {numQubits < 8 && (
            <button
              onClick={addQubit}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-cyan-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Qubit</span>
            </button>
          )}

          {controlSelection && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-sky-950 border border-sky-600 text-sky-200 text-xs animate-pulse">
              <span>Select CONTROL qubit for CNOT target q{controlSelection.targetQubit}</span>
              <button
                onClick={() => setControlSelection(null)}
                className="text-sky-300 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Validation Banner if invalid */}
      {validationErrors.length > 0 && (
        <div className="bg-rose-950/80 border-b border-rose-800 text-rose-200 px-4 py-2 text-xs">
          ⚠️ {validationErrors.join(' | ')}
        </div>
      )}

      {/* Circuit Grid Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-6 flex flex-col justify-center">
        <div className="min-w-fit mx-auto relative select-none">
          {/* Moment Column Headers */}
          <div className="flex ml-28 mb-3">
            {Array.from({ length: numMoments }, (_, m) => (
              <div
                key={m}
                className="w-16 text-center text-[10px] font-mono font-medium text-slate-400"
              >
                M{m}
              </div>
            ))}
          </div>

          {/* Qubit Wires */}
          <div className="space-y-6 relative">
            {circuit.qubits.map((qubit) => {
              const qIdx = qubit.index;
              return (
                <div key={qIdx} className="flex items-center relative group">
                  {/* Qubit Header & Controls */}
                  <div className="w-28 flex items-center justify-between pr-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {qubit.name}
                      </span>
                      {/* Initial Value Toggle */}
                      <button
                        onClick={() => toggleInitialValue(qIdx)}
                        className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          qubit.initialValue === 1
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                        title="Click to toggle initial state |0⟩ / |1⟩"
                      >
                        |{qubit.initialValue}⟩
                      </button>
                    </div>

                    {/* Remove Qubit */}
                    {numQubits > 1 && (
                      <button
                        onClick={() => removeQubit(qIdx)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition-opacity"
                        title="Remove qubit wire"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Wire Slots Row */}
                  <div className="flex items-center relative">
                    {/* The Background Horizontal Wire Line */}
                    <div className="absolute inset-x-0 h-[2px] bg-slate-800 z-0 group-hover:bg-slate-700 transition-colors" />

                    {/* Moments Slots */}
                    {Array.from({ length: numMoments }, (_, mIdx) => {
                      // Check if there is an operation on this qubit at this moment
                      const op = circuit.operations.find(
                        (o) => o.moment === mIdx && o.targets.includes(qIdx)
                      );
                      const isControl = circuit.operations.some(
                        (o) => o.moment === mIdx && o.controls.includes(qIdx)
                      );

                      return (
                        <div
                          key={mIdx}
                          onClick={() => handleCellClick(qIdx, mIdx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const gate = e.dataTransfer.getData('text/plain') as GateType;
                            if (gate) {
                              if (gate === 'CX') {
                                setControlSelection({ targetQubit: qIdx, moment: mIdx });
                              } else {
                                addGate(gate, qIdx, mIdx);
                              }
                            }
                          }}
                          className={`w-16 h-12 flex items-center justify-center relative z-10 cursor-pointer transition-colors ${
                            controlSelection?.moment === mIdx
                              ? 'bg-sky-500/10'
                              : 'hover:bg-slate-800/30'
                          }`}
                        >
                          {/* Render Gate Chip if present */}
                          {op && (
                            <div
                              onMouseEnter={() => setHoveredOp(op.id)}
                              onMouseLeave={() => setHoveredOp(null)}
                              className="relative group/gate"
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs font-mono shadow-lg transition-transform hover:scale-105 border ${
                                  op.gate === 'H'
                                    ? 'bg-emerald-600 text-white border-emerald-400'
                                    : op.gate === 'X'
                                    ? 'bg-cyan-600 text-white border-cyan-400'
                                    : op.gate === 'CX'
                                    ? 'bg-sky-600 text-white border-sky-400 rounded-full'
                                    : op.gate === 'M'
                                    ? 'bg-rose-600 text-white border-rose-400'
                                    : op.gate === 'SWAP'
                                    ? 'bg-amber-600 text-white border-amber-400'
                                    : 'bg-purple-600 text-white border-purple-400'
                                }`}
                              >
                                {op.gate === 'CX' ? '⊕' : op.gate === 'SWAP' ? '✕' : op.gate}
                              </div>

                              {/* Delete gate button on hover */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeGate(op.id);
                                }}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] opacity-0 group-hover/gate:opacity-100 transition-opacity shadow"
                                title="Remove gate"
                              >
                                ×
                              </button>
                            </div>
                          )}

                          {/* Render Control Node if this qubit is a control for an op at this moment */}
                          {!op && isControl && (
                            <div className="w-4 h-4 rounded-full bg-cyan-400 border-2 border-slate-950 shadow-md z-20 flex items-center justify-center" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Vertical Connecting Lines for Multi-Qubit Gates (CNOT, SWAP) */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            >
              {circuit.operations.map((op) => {
                if (op.gate === 'CX' && op.controls.length > 0 && op.targets.length > 0) {
                  const ctrlQubit = op.controls[0];
                  const tgtQubit = op.targets[0];
                  // Calculate coordinates:
                  // X offset: header (112px) + momentIndex * 64px + 32px (center of slot)
                  const x = 112 + op.moment * 64 + 32;
                  // Y offset: each wire is roughly 48px height + 24px space (72px total) + 24px center
                  const yCtrl = ctrlQubit * 72 + 24;
                  const yTgt = tgtQubit * 72 + 24;

                  return (
                    <g key={op.id}>
                      <line
                        x1={x}
                        y1={yCtrl}
                        x2={x}
                        y2={yTgt}
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeDasharray="none"
                      />
                    </g>
                  );
                }

                if (op.gate === 'SWAP' && op.targets.length >= 2) {
                  const qA = op.targets[0];
                  const qB = op.targets[1];
                  const x = 112 + op.moment * 64 + 32;
                  const yA = qA * 72 + 24;
                  const yB = qB * 72 + 24;

                  return (
                    <line
                      key={op.id}
                      x1={x}
                      y1={yA}
                      x2={x}
                      y2={yB}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                    />
                  );
                }
                return null;
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
