import React, { useState } from 'react';
import { useQuantum } from '../context/QuantumContext';
import { GatePalette } from '../components/circuit/GatePalette';
import { CircuitCanvas } from '../components/circuit/CircuitCanvas';
import { ProbabilityChart } from '../components/simulation/ProbabilityChart';
import { StateVectorPanel } from '../components/simulation/StateVectorPanel';
import { BlochSphere } from '../components/circuit/BlochSphere';
import { MeasurementTable } from '../components/simulation/MeasurementTable';
import { NoiseControls } from '../components/simulation/NoiseControls';
import { BackendSelector } from '../components/simulation/BackendSelector';
import { QiskitCodeEditor } from '../components/code/QiskitCodeEditor';
import { AITutorDrawer } from '../components/ai/AITutorDrawer';
import {
  FlaskConical,
  Sparkles,
  Layers,
  BarChart3,
  Sliders,
  Code2,
  FolderOpen,
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
    loadCircuit,
  } = useQuantum();

  const [activeBottomTab, setActiveBottomTab] = useState<
    'probabilities' | 'stateVector' | 'bloch' | 'measurements' | 'qiskit' | 'noise'
  >('probabilities');
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  const shotOptions = [10, 100, 512, 1024];

  const savedCircuits = LocalDatabase.getCircuits();

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12 animate-in fade-in">
      {/* Lab Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
            <FlaskConical className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono font-bold text-cyan-400 tracking-wider">
              Quantum Workbench
            </div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>{circuit.name}</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({circuit.numQubits} Qubits, {circuit.operations.length} Gates)
              </span>
            </h1>
          </div>
        </div>

        {/* Global Lab Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Shots Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-400 px-1.5 uppercase font-sans">Shots:</span>
            {shotOptions.map((s) => (
              <button
                key={s}
                onClick={() => setShots(s)}
                className={`px-2 py-0.5 rounded transition-colors ${
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

          {/* AI Tutor Button */}
          <button
            onClick={() => setIsAITutorOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition-all shadow-sm shadow-cyan-500/10 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Companion</span>
          </button>
        </div>
      </div>

      {/* Main Workbench Layout: Gate Toolkit (Left) + Canvas (Center) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[380px]">
        <GatePalette
          selectedGate={selectedGate}
          onSelectGate={(g) => setSelectedGate(g)}
        />
        <CircuitCanvas editable={true} onOpenAITutor={() => setIsAITutorOpen(true)} />
      </div>

      {/* Bottom Panel: Results, State Vector, Probabilities, Measurements, Qiskit Code */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 overflow-x-auto gap-2">
          <div className="flex items-center gap-2 text-xs font-mono">
            {[
              { id: 'probabilities', label: 'Probabilities', icon: BarChart3 },
              { id: 'stateVector', label: 'State Vector', icon: Layers },
              { id: 'bloch', label: 'Bloch Sphere', icon: FlaskConical },
              { id: 'measurements', label: 'Measurement Shots', icon: Layers },
              { id: 'qiskit', label: 'Qiskit Code Editor', icon: Code2 },
              { id: 'noise', label: 'NISQ Noise Model', icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveBottomTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    activeBottomTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab View */}
        <div className="pt-1">
          {activeBottomTab === 'probabilities' && <ProbabilityChart />}
          {activeBottomTab === 'stateVector' && <StateVectorPanel />}
          {activeBottomTab === 'bloch' && (
            <div className="max-w-md mx-auto">
              <BlochSphere />
            </div>
          )}
          {activeBottomTab === 'measurements' && <MeasurementTable />}
          {activeBottomTab === 'qiskit' && (
            <div className="h-72">
              <QiskitCodeEditor />
            </div>
          )}
          {activeBottomTab === 'noise' && <NoiseControls />}
        </div>
      </div>

      {/* Load Circuit Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100">Saved Quantum Circuits</h3>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {savedCircuits.map((c) => (
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
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Tutor Drawer */}
      <AITutorDrawer
        isOpen={isAITutorOpen}
        onClose={() => setIsAITutorOpen(false)}
        lessonTitle={circuit.name}
      />
    </div>
  );
};
