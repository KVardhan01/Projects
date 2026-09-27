import React, { useState } from 'react';
import { useQuantum } from '../context/QuantumContext';
import { GatePalette } from '../components/circuit/GatePalette';
import { CircuitCanvas } from '../components/circuit/CircuitCanvas';
import { QiskitCodeEditor } from '../components/code/QiskitCodeEditor';
import { SimulationResultsPanel } from '../components/simulation/SimulationResultsPanel';
import { AITutorPanel } from '../components/ai/AITutorPanel';
import { BackendSelector } from '../components/simulation/BackendSelector';
import {
  FlaskConical,
  FolderOpen,
  Play,
} from 'lucide-react';
import { LocalDatabase } from '../services/storage/localDatabase';

export const LabPage: React.FC = () => {
  const {
    circuit,
    shots,
    setShots,
    selectedGate,
    setSelectedGate,
    runSimulation,
    isSimulating,
    loadCircuit,
  } = useQuantum();

  const [showLoadModal, setShowLoadModal] = useState(false);

  const shotOptions = [10, 100, 512, 1024];
  const savedCircuits = LocalDatabase.getCircuits();

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 pb-12 animate-in fade-in">
      {/* Workbench Global Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
            <FlaskConical className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-mono font-bold text-cyan-400 tracking-wider">
              QUBIFY • QUANTUM LEARNING WORKBENCH
            </div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>{circuit.name}</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({circuit.numQubits} Qubits, {circuit.operations.length} Gates)
              </span>
            </h1>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Simulate Action */}
          <button
            onClick={() => runSimulation()}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : 'Simulate Circuit'}</span>
          </button>

          {/* Shots Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-400 px-1.5 uppercase font-sans">Shots:</span>
            {shotOptions.map((s) => (
              <button
                key={s}
                onClick={() => setShots(s)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  shots === s
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Backend Selector */}
          <BackendSelector />

          {/* Load Circuit Button */}
          <button
            onClick={() => setShowLoadModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Saved ({savedCircuits.length})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left/Center (Circuit, Code, Simulation) + Right Side (AI TUTOR ONLY) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left & Center Workbench Column (xl:col-span-8) */}
        <div className="xl:col-span-8 space-y-5">
          {/* Row 1: Gate Palette + Visual Quantum Circuit */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[380px]">
            <GatePalette
              selectedGate={selectedGate}
              onSelectGate={(g) => setSelectedGate(g)}
            />
            <CircuitCanvas editable={true} onSimulate={runSimulation} />
          </div>

          {/* Row 2: Python / Qiskit Code Editor */}
          <div className="h-[280px]">
            <QiskitCodeEditor />
          </div>

          {/* Row 3: Simulation Results */}
          <SimulationResultsPanel />
        </div>

        {/* Right Side Column (xl:col-span-4): AI TUTOR ONLY */}
        <div className="xl:col-span-4 sticky top-4">
          <AITutorPanel lessonTitle={circuit.name} />
        </div>
      </div>

      {/* Load Circuit Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100">Saved Quantum Circuits</h3>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1 rounded-lg bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {savedCircuits.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-mono">
                  No saved circuits yet. Click 'Save' in the canvas action bar to store circuits.
                </div>
              ) : (
                savedCircuits.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      loadCircuit(c.id);
                      setShowLoadModal(false);
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <h5 className="font-bold text-xs text-slate-200 group-hover:text-cyan-300">
                        {c.name}
                      </h5>
                      <div className="text-[11px] text-slate-400">
                        {c.numQubits} Qubits • {c.operations.length} Gates
                      </div>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono">Load</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
