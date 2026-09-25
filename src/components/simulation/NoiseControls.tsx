import React from 'react';
import { useQuantum } from '../../context/QuantumContext';
import { AlertTriangle, Power } from 'lucide-react';

export const NoiseControls: React.FC = () => {
  const { noiseSettings, setNoiseSettings } = useQuantum();

  const presets = [0.01, 0.05, 0.1];

  const handleToggle = () => {
    setNoiseSettings({ enabled: !noiseSettings.enabled });
  };

  const handleApplyPreset = (val: number) => {
    setNoiseSettings({
      enabled: true,
      bitFlipRate: val,
      phaseFlipRate: val,
      depolarizingRate: val,
      readoutErrorRate: val,
    });
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            NISQ Decoherence & Noise
          </h4>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/50 border border-amber-800/80 text-[10px] text-amber-300 font-mono font-bold">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>SIMULATED NOISE MODEL</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Simulates environmental dissipation, thermal relaxation, and readout error. (Note: This is an empirical open-system model and does not claim to represent physical hardware calibration).
      </p>

      {/* Main Switch & Presets */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800">
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
            noiseSettings.enabled
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{noiseSettings.enabled ? 'Noise: ON' : 'Noise: OFF'}</span>
        </button>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-[10px] text-slate-400 mr-1 uppercase">Presets:</span>
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => handleApplyPreset(p)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors ${
                noiseSettings.enabled && noiseSettings.depolarizingRate === p
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {(p * 100).toFixed(0)}%
            </button>
          ))}
        </div>
      </div>

      {/* Sliders for Channels */}
      {noiseSettings.enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
          <div>
            <div className="flex justify-between text-slate-300 text-[11px] mb-1">
              <span>Bit-Flip (X):</span>
              <span className="text-cyan-400 font-bold">
                {(noiseSettings.bitFlipRate * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.25"
              step="0.01"
              value={noiseSettings.bitFlipRate}
              onChange={(e) =>
                setNoiseSettings({ bitFlipRate: parseFloat(e.target.value) })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 text-[11px] mb-1">
              <span>Phase-Flip (Z):</span>
              <span className="text-cyan-400 font-bold">
                {(noiseSettings.phaseFlipRate * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.25"
              step="0.01"
              value={noiseSettings.phaseFlipRate}
              onChange={(e) =>
                setNoiseSettings({ phaseFlipRate: parseFloat(e.target.value) })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 text-[11px] mb-1">
              <span>Depolarizing:</span>
              <span className="text-cyan-400 font-bold">
                {(noiseSettings.depolarizingRate * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.25"
              step="0.01"
              value={noiseSettings.depolarizingRate}
              onChange={(e) =>
                setNoiseSettings({ depolarizingRate: parseFloat(e.target.value) })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 text-[11px] mb-1">
              <span>Readout Error:</span>
              <span className="text-cyan-400 font-bold">
                {(noiseSettings.readoutErrorRate * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.25"
              step="0.01"
              value={noiseSettings.readoutErrorRate}
              onChange={(e) =>
                setNoiseSettings({ readoutErrorRate: parseFloat(e.target.value) })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
