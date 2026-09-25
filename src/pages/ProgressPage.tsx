import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { INITIAL_MODULES, INITIAL_LESSONS } from '../data/initialCurriculum';
import { ALL_ACHIEVEMENTS } from '../data/achievementsData';
import {
  BarChart3,
  Award,
  Flame,
  Zap,
  CheckCircle2,
  Clock,
  Target,
  Layers,
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const { progressList, circuitAttempts, quizAttempts, activities, userAchievements } = useProgress();

  const totalLessons = INITIAL_LESSONS.length;
  const completedLessons = progressList.filter((p) => p.status === 'COMPLETED').length;
  const pathPercent = Math.round((completedLessons / totalLessons) * 100);

  const successfulExercises = circuitAttempts.filter((a) => a.completionStatus === 'SUCCESS').length;
  const totalExerciseAttempts = circuitAttempts.length;

  const avgQuizScore =
    quizAttempts.length > 0
      ? Math.round(
          quizAttempts.reduce((sum, q) => sum + q.score, 0) / quizAttempts.length
        )
      : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-cyan-400 mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>Learning Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
          Your Quantum Mastery Analytics
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Comprehensive breakdown of your curriculum progression, challenge verification scores, confidence telemetry, and achievement milestones.
        </p>
      </div>

      {/* Top 4 Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono mb-1">OVERALL CURRICULUM</div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">
            {completedLessons} / {totalLessons} Lessons
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full"
              style={{ width: `${pathPercent}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono mb-1">EXERCISES SOLVED</div>
          <div className="text-2xl font-bold text-emerald-300 font-mono">
            {successfulExercises} Passed
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {totalExerciseAttempts} total attempt(s)
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono mb-1">AVERAGE QUIZ SCORE</div>
          <div className="text-2xl font-bold text-indigo-300 font-mono">
            {avgQuizScore}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {quizAttempts.length} quiz attempt(s) evaluated
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono mb-1">ACHIEVEMENTS UNLOCKED</div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {userAchievements.length} / {ALL_ACHIEVEMENTS.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {Math.round((userAchievements.length / ALL_ACHIEVEMENTS.length) * 100)}% of badges
          </div>
        </div>
      </div>

      {/* Module by Module Progress Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
          Module-by-Module Breakdown
        </h3>
        <div className="space-y-4">
          {INITIAL_MODULES.map((mod) => {
            const modLessons = INITIAL_LESSONS.filter((l) => l.moduleId === mod.id);
            const done = modLessons.filter((l) =>
              progressList.some((p) => p.lessonId === l.id && p.status === 'COMPLETED')
            ).length;
            const pct = Math.round((done / Math.max(1, modLessons.length)) * 100);

            return (
              <div key={mod.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200">{mod.title}</span>
                    <span className="text-[10px] text-cyan-400 font-mono ml-2 uppercase">
                      ({mod.category})
                    </span>
                  </div>
                  <span className="font-mono text-slate-300 font-bold">
                    {done} / {modLessons.length} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
          Learning Activity History
        </h3>
        <div className="divide-y divide-slate-800/80">
          {activities.map((act) => (
            <div key={act.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">{act.title}</div>
                  <div className="text-[11px] text-slate-400">{act.description}</div>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {new Date(act.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
