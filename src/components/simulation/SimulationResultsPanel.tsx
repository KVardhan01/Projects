import React, { useState } from 'react';
import {
  BarChart3,
  Layers,
  FlaskConical,
  Sliders,
  AlertTriangle,
  Play,
  RotateCw,
} from 'lucide-react';
import { useQuantum } from '../../context/QuantumContext';
import { ProbabilityChart } from './ProbabilityChart';
import { StateVectorPanel } from './StateVectorPanel';
import { BlochSphere } from '../circuit/BlochSphere';
import { MeasurementTable } from './MeasurementTable';
import { NoiseControls } from './NoiseControls';

export const SimulationResultsPanel: React.FC = () => {
  const {
    simulation,
    isSimulating,
    runSimulation,
    simulationError,
    shots,
    circuit,
  } = useQuantum();

  const [activeTab, setActiveTab] = useState<
    'probabilities' | 'stateVector' | 'bloch' | 'measurements' | 'noise'
  >('probabilities');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
      {/* Simulation Header with Run button & Status */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider font-mono">
            Simulation Results
          </h3>
          {simulation && (
            <span className="text-[11px] text-slate-400 font-mono">
              ({shots} Shots • {simulation.executionTimeMs.toFixed(1)}ms)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => runSimulation()}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-cyan-500/10"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : 'Simulate Circuit'}</span>
          </button>
        </div>
      </div>

      {/* Prominent Simulation Error Banner if present */}
      {simulationError && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Simulation Error</span>
          </div>
          <div className="whitespace-pre-wrap font-mono text-[11px] text-rose-200 pl-6">
            {simulationError}
          </div>
          <div className="text-[11px] text-slate-400 pl-6 pt-1">
            The error context has been sent to the AI Tutor on the right. You can ask the AI Tutor to diagnose or fix the circuit.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs font-mono overflow-x-auto pb-1">
        {[
          { id: 'probabilities', label: 'Probabilities', icon: BarChart3 },
          { id: 'stateVector', label: 'State Vector & Amplitudes', icon: Layers },
          { id: 'bloch', label: 'Bloch Sphere', icon: FlaskConical },
          { id: 'measurements', label: 'Measurement Counts', icon: RotateCw },
          { id: 'noise', label: 'Noise Model', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                activeTab === tab.id
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

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'probabilities' && <ProbabilityChart />}
        {activeTab === 'stateVector' && <StateVectorPanel />}
        {activeTab === 'bloch' && (
          <div className="max-w-md mx-auto py-2">
            <BlochSphere />
          </div>
        )}
        {activeTab === 'measurements' && <MeasurementTable />}
        {activeTab === 'noise' && <NoiseControls />}
      </div>
    </div>
  );
};
