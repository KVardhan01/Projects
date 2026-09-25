import React from 'react';
import { useQuantum } from '../../context/QuantumContext';

export const MeasurementTable: React.FC = () => {
  const { circuit, simulation } = useQuantum();

  if (!simulation || !simulation.measurementHistory || simulation.measurementHistory.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
        No measurement shots sampled yet.
      </div>
    );
  }

  const initialInput = circuit.qubits.map((q) => q.initialValue).join('');
  const history = simulation.measurementHistory.slice(0, 50);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Displaying first {history.length} of {simulation.shots} measurement shots:</span>
        <span className="font-mono text-cyan-400">Initial Input: |{initialInput}⟩</span>
      </div>

      <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/70">
        <table className="w-full text-left text-xs font-mono">
          <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[10px] uppercase text-slate-400">
            <tr>
              <th className="py-2 px-3">Shot #</th>
              <th className="py-2 px-3">Input State</th>
              <th className="py-2 px-3">Measured Output</th>
              <th className="py-2 px-3">Decoded Decimal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {history.map((outcome, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-1.5 px-3 text-slate-400">{idx + 1}</td>
                <td className="py-1.5 px-3 text-slate-300">|{initialInput}⟩</td>
                <td className="py-1.5 px-3 text-cyan-300 font-bold">|{outcome}⟩</td>
                <td className="py-1.5 px-3 text-slate-400">{parseInt(outcome, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
