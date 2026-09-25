import React from 'react';
import { useQuantum } from '../../context/QuantumContext';

export const ProbabilityChart: React.FC = () => {
  const { simulation, shots } = useQuantum();

  if (!simulation || !simulation.basisStates || simulation.basisStates.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
        <span>Click "Simulate Circuit" to view real state probabilities</span>
      </div>
    );
  }

  // Filter or show basis states with non-zero probability, or up to 16 states
  const states = simulation.basisStates.slice(0, 16);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono uppercase font-semibold">Basis State |x⟩</span>
        <span className="font-mono">Probability (Sampling: {shots} shots)</span>
      </div>

      <div className="space-y-2">
        {states.map((st) => {
          const count = simulation.measurementCounts[st.binary] || 0;
          const percent = (st.probability * 100).toFixed(1);
          const isDominant = st.probability >= 0.2;

          return (
            <div key={st.binary} className="group">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-200 font-bold group-hover:text-cyan-300 transition-colors">
                  |{st.binary}⟩
                </span>
                <span className="text-slate-300">
                  <span className="font-bold text-cyan-400">{percent}%</span>{' '}
                  <span className="text-slate-400 text-[10px]">({count} shots)</span>
                </span>
              </div>

              {/* Probability Bar */}
              <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isDominant
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-400 shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-600'
                  }`}
                  style={{ width: `${Math.max(st.probability * 100, st.probability > 0 ? 2 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
