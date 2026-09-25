import React, { useState } from 'react';
import { Exercise } from '../types/exercise';
import { GateType } from '../types/quantum';
import { LocalDatabase } from '../services/storage/localDatabase';
import { CheckSquare, Plus, Check, Trash2, Award } from 'lucide-react';

export const InstructorExercisesPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>(() => LocalDatabase.getAllExercises());

  // New Exercise Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [numQubits, setNumQubits] = useState(2);
  const [numMoments, setNumMoments] = useState(4);
  const [allowedGates, setAllowedGates] = useState<GateType[]>(['H', 'X', 'CX']);
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [points, setPoints] = useState(150);
  const [hints, setHints] = useState<string>('Think about superposition.\nApply CNOT to create entanglement.');
  const [notice, setNotice] = useState<string | null>(null);

  const availableGates: GateType[] = ['H', 'X', 'Y', 'Z', 'S', 'T', 'CX', 'SWAP', 'M'];

  const toggleGate = (g: GateType) => {
    if (allowedGates.includes(g)) {
      setAllowedGates(allowedGates.filter((gate) => gate !== g));
    } else {
      setAllowedGates([...allowedGates, g]);
    }
  };

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !expectedBehavior.trim()) return;

    const newEx: Exercise = {
      id: `custom-ex-${Date.now()}`,
      title,
      description,
      type: 'construction',
      difficulty,
      numQubits,
      numMoments,
      allowedGates,
      initialState: Array.from({ length: numQubits }, () => 0 as 0 | 1),
      modelCircuit: {
        id: `model-${Date.now()}`,
        name: title,
        numQubits,
        numMoments,
        qubits: Array.from({ length: numQubits }, (_, i) => ({ index: i, name: `q${i}`, initialValue: 0 })),
        operations: [],
      },
      expectedBehavior,
      tolerance: 0.05,
      points,
      hints: hints.split('\n').filter(Boolean),
      feedback: 'Great job completing this instructor-assigned challenge!',
      isPublished: true,
    };

    LocalDatabase.saveCustomExercise(newEx);
    setExercises(LocalDatabase.getAllExercises());

    setTitle('');
    setDescription('');
    setExpectedBehavior('');
    setNotice('New challenge published to curriculum!');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-indigo-400 mb-1">
          <CheckSquare className="w-4 h-4" />
          <span>Exercise Authoring Studio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
          Circuit Exercise & Challenge Builder
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Design custom quantum challenges with constrained gate sets, tolerance thresholds, and progressive educational hints.
        </p>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Creation Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Create New Challenge</span>
        </h3>

        <form onSubmit={handleCreateExercise} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Challenge Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Synthesis of GHZ Tripartite Entanglement"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Difficulty:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the background physics or algorithm purpose..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Number of Qubits (1 - 6):</label>
              <input
                type="number"
                min={1}
                max={6}
                value={numQubits}
                onChange={(e) => setNumQubits(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Max Moments / Columns:</label>
              <input
                type="number"
                min={2}
                max={12}
                value={numMoments}
                onChange={(e) => setNumMoments(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">XP Points:</label>
              <input
                type="number"
                min={50}
                max={500}
                step={25}
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Allowed Gates Picker */}
          <div>
            <label className="block text-slate-400 mb-1.5">Allowed Gates in Palette:</label>
            <div className="flex flex-wrap gap-2">
              {availableGates.map((g) => {
                const isSelected = allowedGates.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleGate(g)}
                    className={`px-3 py-1 rounded-xl border text-xs font-mono font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Target Expected Output / Behavior:</label>
            <input
              type="text"
              value={expectedBehavior}
              onChange={(e) => setExpectedBehavior(e.target.value)}
              placeholder="e.g. State (|000⟩ + |111⟩)/√2 with zero correlation outside 000 and 111."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Progressive Hints (one per line):</label>
            <textarea
              value={hints}
              onChange={(e) => setHints(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            Publish Custom Challenge
          </button>
        </form>
      </div>

      {/* Existing Exercises Listing */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
        <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider mb-2">
          Configured Exercises ({exercises.length})
        </h3>
        <div className="space-y-2">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-bold text-slate-200">{ex.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {ex.numQubits} Qubits • Allowed: {ex.allowedGates.join(', ')} • Points: +{ex.points} XP
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                {ex.difficulty}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
