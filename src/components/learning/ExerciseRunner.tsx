import React, { useState } from 'react';
import { Exercise } from '../../types/exercise';
import { useProgress } from '../../context/ProgressContext';
import { useQuantum } from '../../context/QuantumContext';
import { CircuitCanvas } from '../circuit/CircuitCanvas';
import { GatePalette } from '../circuit/GatePalette';
import { ProbabilityChart } from '../simulation/ProbabilityChart';
import { StateVectorPanel } from '../simulation/StateVectorPanel';
import { BlochSphere } from '../circuit/BlochSphere';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ExerciseRunnerProps {
  exercise: Exercise;
  onOpenAITutor: () => void;
}

export const ExerciseRunner: React.FC<ExerciseRunnerProps> = ({
  exercise,
  onOpenAITutor,
}) => {
  const { assessExercise } = useProgress();
  const { circuit, qiskitCode, selectedGate, setSelectedGate, resetToModel } = useQuantum();

  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [assessmentResult, setAssessmentResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'probabilities' | 'stateVector' | 'bloch'>('probabilities');

  const handleRevealNextHint = () => {
    if (hintsRevealed < exercise.hints.length) {
      setHintsRevealed((prev) => prev + 1);
    }
  };

  const handleAssess = () => {
    const result = assessExercise(exercise, circuit, qiskitCode, hintsRevealed);
    setAssessmentResult(result);
  };

  const handleReset = () => {
    if (exercise.initialCircuit) {
      resetToModel(exercise.initialCircuit);
    } else {
      resetToModel({
        id: `ex-${exercise.id}-start`,
        name: exercise.title,
        numQubits: exercise.numQubits,
        numMoments: exercise.numMoments,
        qubits: Array.from({ length: exercise.numQubits }, (_, i) => ({
          index: i,
          name: `q${i}`,
          initialValue: (exercise.initialState?.[i] ?? 0) as 0 | 1,
        })),
        operations: [],
      });
    }
    setAssessmentResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Exercise Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold text-xs uppercase font-mono">
              {exercise.difficulty}
            </span>
            <span className="text-amber-400 font-bold text-xs font-mono flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
              <Award className="w-3.5 h-3.5" />
              <span>+{exercise.points} XP</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Challenge</span>
            </button>
            <button
              onClick={onOpenAITutor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Tutor</span>
            </button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
          {exercise.title}
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed mb-4 max-w-3xl">
          {exercise.description}
        </p>

        {/* Expected Behavior Requirement */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
          <div>
            <span className="font-bold text-cyan-400 uppercase font-mono mr-1.5">
              Target Behavior:
            </span>
            <span>{exercise.expectedBehavior}</span>
          </div>
        </div>

        {/* Progressive Hints Section */}
        {exercise.hints && exercise.hints.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                Progressive Hints ({hintsRevealed} of {exercise.hints.length} unlocked)
              </span>
              {hintsRevealed < exercise.hints.length && (
                <button
                  onClick={handleRevealNextHint}
                  className="text-cyan-400 hover:text-cyan-300 text-xs underline cursor-pointer"
                >
                  Reveal Hint {hintsRevealed + 1} (-15 XP penalty)
                </button>
              )}
            </div>

            {hintsRevealed > 0 && (
              <div className="space-y-1.5 pt-1">
                {exercise.hints.slice(0, hintsRevealed).map((hint, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200"
                  >
                    <span className="font-bold text-cyan-400 mr-1.5">Hint {idx + 1}:</span>
                    {hint}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Circuit Builder */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Design Your Solution
          </span>
          <div className="text-[11px] text-slate-400">
            Allowed Gates: {exercise.allowedGates.join(', ')}
          </div>
        </div>

        <div className="flex flex-col md:flex-row min-h-[320px]">
          <GatePalette
            selectedGate={selectedGate}
            onSelectGate={(g) => setSelectedGate(g)}
            allowedGates={exercise.allowedGates}
          />
          <CircuitCanvas editable={true} onOpenAITutor={onOpenAITutor} />
        </div>

        {/* Action Bar for Assessment */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            {[
              { id: 'probabilities', label: 'Probabilities' },
              { id: 'stateVector', label: 'State Vector' },
              { id: 'bloch', label: 'Bloch Sphere' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleAssess}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verify Circuit & Submit</span>
          </button>
        </div>

        {/* Live Simulation preview */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800">
          {activeTab === 'probabilities' && <ProbabilityChart />}
          {activeTab === 'stateVector' && <StateVectorPanel />}
          {activeTab === 'bloch' && (
            <div className="max-w-md mx-auto">
              <BlochSphere />
            </div>
          )}
        </div>
      </div>

      {/* Assessment Feedback Modal / Card */}
      {assessmentResult && (
        <div
          className={`p-6 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-150 ${
            assessmentResult.isSuccess
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100 shadow-emerald-500/10'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-100 shadow-rose-500/10'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            {assessmentResult.isSuccess ? (
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400 text-rose-300 flex items-center justify-center font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg">
                {assessmentResult.isSuccess ? 'Challenge Solved!' : 'Output Discrepancy Detected'}
              </h3>
              <div className="text-xs font-mono opacity-80">
                Score: {assessmentResult.score} / {exercise.points} (+{assessmentResult.xpEarned} XP)
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed mb-4">{assessmentResult.feedback}</p>

          {assessmentResult.isSuccess && (
            <div className="flex items-center gap-2 text-xs font-mono bg-emerald-900/40 p-3 rounded-xl border border-emerald-700/60">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Assessment Engine: Validated through formal unitary invariant check & statistical distribution analysis. Multiple valid circuits accepted!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
