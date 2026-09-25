import React from 'react';
import { useQuantum } from '../../context/QuantumContext';

export const StateVectorPanel: React.FC = () => {
  const { simulation } = useQuantum();

  if (!simulation || !simulation.basisStates) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
        No state vector computed yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs font-mono border-collapse">
        <thead>
          <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60">
            <th className="py-2.5 px-3">State |x⟩</th>
            <th className="py-2.5 px-3">Amplitude (Re + i·Im)</th>
            <th className="py-2.5 px-3">Magnitude |α|</th>
            <th className="py-2.5 px-3">Phase φ (rad)</th>
            <th className="py-2.5 px-3">Probability |α|²</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {simulation.basisStates.map((st) => {
            const hasAmplitude = st.probability > 0.0001;
            const re = Math.abs(st.amplitude.re) < 1e-6 ? 0 : st.amplitude.re;
            const im = Math.abs(st.amplitude.im) < 1e-6 ? 0 : st.amplitude.im;
            const mag = st.amplitude.magnitude();
            const phaseDeg = (st.phase * (180 / Math.PI)).toFixed(1);

            return (
              <tr
                key={st.binary}
                className={`hover:bg-slate-800/40 transition-colors ${
                  hasAmplitude ? 'text-slate-100 font-medium' : 'text-slate-400'
                }`}
              >
                <td className="py-2 px-3 text-cyan-300 font-bold">|{st.binary}⟩</td>
                <td className="py-2 px-3">
                  {re.toFixed(3)} {im >= 0 ? '+' : '-'} {Math.abs(im).toFixed(3)}i
                </td>
                <td className="py-2 px-3">{mag.toFixed(3)}</td>
                <td className="py-2 px-3">
                  {st.phase.toFixed(3)} ({phaseDeg}°)
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400 w-12">
                      {(st.probability * 100).toFixed(1)}%
                    </span>
                    <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full"
                        style={{ width: `${st.probability * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
