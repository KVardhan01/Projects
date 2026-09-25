import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { LocalDatabase } from '../services/storage/localDatabase';
import {
  CheckSquare,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const ExercisesPage: React.FC = () => {
  const { circuitAttempts } = useProgress();
  const [filterType, setFilterType] = useState<string>('all');

  const exercises = LocalDatabase.getAllExercises();

  const isExerciseSolved = (id: string) => {
    return circuitAttempts.some(
      (a) => a.exerciseId === id && a.completionStatus === 'SUCCESS'
    );
  };

  const filtered = exercises.filter((ex) => {
    if (filterType === 'all') return true;
    if (filterType === 'solved') return isExerciseSolved(ex.id);
    if (filterType === 'unsolved') return !isExerciseSolved(ex.id);
    return ex.difficulty.toLowerCase() === filterType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-cyan-400 mb-1">
          <CheckSquare className="w-4 h-4" />
          <span>Automated Assessment Workbench</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
          Quantum Algorithm Challenges
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          Solve interactive challenges evaluated by the formal unitary equivalence engine and statistical probability verification. Multiple valid circuit solutions are supported and accepted.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          {[
            { id: 'all', label: 'All Challenges' },
            { id: 'beginner', label: 'Beginner' },
            { id: 'intermediate', label: 'Intermediate' },
            { id: 'advanced', label: 'Advanced' },
            { id: 'solved', label: 'Solved' },
            { id: 'unsolved', label: 'Unsolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ex) => {
          const solved = isExerciseSolved(ex.id);
          const attempts = circuitAttempts.filter((a) => a.exerciseId === ex.id);

          return (
            <div
              key={ex.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-150 ${
                solved
                  ? 'bg-slate-900/60 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {ex.difficulty}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-amber-300">+{ex.points} XP</span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-100 mb-1.5">{ex.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-3">
                  {ex.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="text-[11px] font-mono text-slate-400">
                  {solved ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Solved</span>
                    </span>
                  ) : attempts.length > 0 ? (
                    <span>{attempts.length} Attempt(s)</span>
                  ) : (
                    <span>Unattempted</span>
                  )}
                </div>

                <Link
                  to={`/exercises/${ex.id}`}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-medium text-xs flex items-center gap-1 transition-colors"
                >
                  <span>{solved ? 'Review' : 'Start'}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
