import React, { useState } from 'react';
import { BlochVector } from '../../types/quantum';
import { useQuantum } from '../../context/QuantumContext';

interface BlochSphereProps {
  qubitIndex?: number;
  onQubitChange?: (idx: number) => void;
}

export const BlochSphere: React.FC<BlochSphereProps> = ({
  qubitIndex = 0,
  onQubitChange,
}) => {
  const { circuit, simulation } = useQuantum();
  const [selectedQubit, setSelectedQubit] = useState(qubitIndex);

  const activeQubit = onQubitChange ? qubitIndex : selectedQubit;
  const bloch: BlochVector = simulation?.blochSpheres?.[activeQubit] || {
    theta: 0,
    phi: 0,
    x: 0,
    y: 0,
    z: 1,
    p0: 1,
    p1: 0,
  };

  const handleSelectQubit = (idx: number) => {
    setSelectedQubit(idx);
    if (onQubitChange) onQubitChange(idx);
  };

  // Center of SVG canvas
  const cx = 140;
  const cy = 135;
  const R = 85;

  // 3D Oblique/Isometric Projection onto 2D plane:
  // Z axis: (0, -1) [straight up]
  // X axis: (-cos(30°), sin(30°)*0.5) [forward-left]
  // Y axis: (cos(30°), sin(30°)*0.5) [forward-right]
  const angleIso = Math.PI / 6; // 30 deg
  const cosIso = Math.cos(angleIso);
  const sinIso = Math.sin(angleIso) * 0.45;

  const project3D = (x: number, y: number, z: number) => {
    // 3D point (x, y, z) on unit sphere
    const screenX = cx + R * (y * cosIso - x * cosIso);
    const screenY = cy - R * z + R * (x * sinIso + y * sinIso);
    return { screenX, screenY };
  };

  // Project state vector tip
  const tip = project3D(bloch.x, bloch.y, bloch.z);
  // Project XY projection point
  const shadow = project3D(bloch.x, bloch.y, 0);

  // Axis end points
  const zPlus = project3D(0, 0, 1.25);
  const zMinus = project3D(0, 0, -1.25);
  const xPlus = project3D(1.25, 0, 0);
  const xMinus = project3D(-1.25, 0, 0);
  const yPlus = project3D(0, 1.25, 0);
  const yMinus = project3D(0, -1.25, 0);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex flex-col shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            Bloch Sphere
          </h4>
        </div>

        {/* Qubit Selector */}
        {circuit.numQubits > 1 && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {circuit.qubits.map((q) => (
              <button
                key={q.index}
                onClick={() => handleSelectQubit(q.index)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                  activeQubit === q.index
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                q{q.index}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3D SVG Bloch Sphere Canvas */}
      <div className="relative flex justify-center py-1 select-none">
        <svg width="280" height="260" className="overflow-visible">
          <defs>
            <radialGradient id="sphereGlow" cx="45%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#0f172a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
            </radialGradient>
            <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <marker
              id="arrowHead"
              markerWidth="7"
              markerHeight="7"
              refX="5"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="#22d3ee" />
            </marker>
          </defs>

          {/* Sphere Body */}
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill="url(#sphereGlow)"
            stroke="#1e293b"
            strokeWidth="1.5"
          />

          {/* Equator Ellipse (XY Plane) */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={R}
            ry={R * sinIso * 1.8}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Meridian Ellipse (YZ Plane) */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={R * cosIso * 0.4}
            ry={R}
            fill="none"
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Coordinate Axes */}
          {/* Z Axis (-Z to +Z) */}
          <line
            x1={zMinus.screenX}
            y1={zMinus.screenY}
            x2={zPlus.screenX}
            y2={zPlus.screenY}
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* X Axis */}
          <line
            x1={xMinus.screenX}
            y1={xMinus.screenY}
            x2={xPlus.screenX}
            y2={xPlus.screenY}
            stroke="#334155"
            strokeWidth="1.2"
            strokeDasharray="3 2"
          />
          {/* Y Axis */}
          <line
            x1={yMinus.screenX}
            y1={yMinus.screenY}
            x2={yPlus.screenX}
            y2={yPlus.screenY}
            stroke="#334155"
            strokeWidth="1.2"
            strokeDasharray="3 2"
          />

          {/* Basis State Labels */}
          {/* |0> North Pole */}
          <text
            x={zPlus.screenX}
            y={zPlus.screenY - 6}
            textAnchor="middle"
            fill="#38bdf8"
            className="text-[11px] font-mono font-bold"
          >
            |0⟩ (+Z)
          </text>
          {/* |1> South Pole */}
          <text
            x={zMinus.screenX}
            y={zMinus.screenY + 14}
            textAnchor="middle"
            fill="#94a3b8"
            className="text-[11px] font-mono font-bold"
          >
            |1⟩ (-Z)
          </text>
          {/* |+> Axis Label */}
          <text
            x={xPlus.screenX - 8}
            y={xPlus.screenY + 12}
            textAnchor="end"
            fill="#64748b"
            className="text-[9px] font-mono"
          >
            |+⟩ (+X)
          </text>
          {/* |+i> Axis Label */}
          <text
            x={yPlus.screenX + 8}
            y={yPlus.screenY + 12}
            textAnchor="start"
            fill="#64748b"
            className="text-[9px] font-mono"
          >
            |+i⟩ (+Y)
          </text>

          {/* Projection Line to Equatorial Plane */}
          <line
            x1={tip.screenX}
            y1={tip.screenY}
            x2={shadow.screenX}
            y2={shadow.screenY}
            stroke="#0e7490"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <line
            x1={cx}
            y1={cy}
            x2={shadow.screenX}
            y2={shadow.screenY}
            stroke="#0e7490"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* State Vector Arrow |ψ> */}
          <line
            x1={cx}
            y1={cy}
            x2={tip.screenX}
            y2={tip.screenY}
            stroke="#22d3ee"
            strokeWidth="3"
            filter="url(#vectorGlow)"
            markerEnd="url(#arrowHead)"
          />

          {/* Vector Tip Sphere Dot */}
          <circle
            cx={tip.screenX}
            cy={tip.screenY}
            r="4.5"
            fill="#38bdf8"
            stroke="#020617"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Coordinate & Measurement Readouts */}
      <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] font-mono bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <div>
          <span className="text-slate-400">θ (polar):</span>{' '}
          <span className="text-cyan-300 font-bold">
            {(bloch.theta * (180 / Math.PI)).toFixed(1)}°
          </span>
        </div>
        <div>
          <span className="text-slate-400">φ (azimuth):</span>{' '}
          <span className="text-cyan-300 font-bold">
            {(bloch.phi * (180 / Math.PI)).toFixed(1)}°
          </span>
        </div>
        <div>
          <span className="text-slate-400">⟨X, Y, Z⟩:</span>{' '}
          <span className="text-slate-200">
            [{bloch.x.toFixed(2)}, {bloch.y.toFixed(2)}, {bloch.z.toFixed(2)}]
          </span>
        </div>
        <div>
          <span className="text-slate-400">P(0) / P(1):</span>{' '}
          <span className="text-emerald-400 font-bold">
            {(bloch.p0 * 100).toFixed(0)}% / {(bloch.p1 * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};
