import React from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Flame,
  Zap,
  CheckCircle2,
  Play,
  ArrowRight,
  Sparkles,
  FlaskConical,
  Target,
  Clock,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { useQuantum } from '../context/QuantumContext';
import { INITIAL_LESSONS } from '../data/initialCurriculum';
import { ALL_ACHIEVEMENTS } from '../data/achievementsData';
import { QuantumTutorService } from '../services/ai/quantumTutor';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { progressList, activities, userAchievements, circuitAttempts, quizAttempts } = useProgress();
  const { resetToModel } = useQuantum();

  const completedCount = progressList.filter((p) => p.status === 'COMPLETED').length;
  const totalLessons = INITIAL_LESSONS.length;
  const pathProgressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const completedExercisesCount = circuitAttempts.filter((a) => a.completionStatus === 'SUCCESS').length;
  const circuitAttemptsCount = circuitAttempts.length;
  const quizAttemptsCount = quizAttempts.length;
  const achievementsCount = userAchievements.length;

  const totalAssessments = quizAttemptsCount + circuitAttemptsCount;
  const learningConfidencePercent =
    totalAssessments === 0 && completedCount === 0
      ? 0
      : QuantumTutorService.calculateConfidence(circuitAttempts, quizAttempts, completedCount);

  const totalXp = user?.xp ?? 0;
  const dailyStreak = user?.streak ?? 0;
  const weeklyGoalMinutes = user?.weeklyGoal || 60;
  const weeklyGoalProgress = user?.weeklyGoalProgress ?? 0;
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyGoalProgress / weeklyGoalMinutes) * 100));

  // Determine actual next lesson milestone based on real completion state
  const nextLesson =
    INITIAL_LESSONS.find((l) => {
      const prog = progressList.find((p) => p.lessonId === l.id);
      return !prog || prog.status !== 'COMPLETED';
    }) || INITIAL_LESSONS[0];

  // Dynamic recommendations generated from real student attempt data
  const recommendations = user
    ? QuantumTutorService.generateRecommendations(user, progressList, circuitAttempts, quizAttempts)
    : [];

  // Recommended experiments
  const experimentPresets = [
    {
      id: 'bell-state',
      title: 'Bell State |Φ+⟩',
      category: 'Entanglement',
      description: 'Prepare correlated Einstein-Podolsky-Rosen pair with H and CNOT.',
      circuit: {
        id: 'bell-exp',
        name: 'Bell State |Φ+⟩',
        numQubits: 2,
        numMoments: 3,
        qubits: [
          { index: 0, name: 'q0', initialValue: 0 as const },
          { index: 1, name: 'q1', initialValue: 0 as const },
        ],
        operations: [
          { id: 'b1', gate: 'H' as const, targets: [0], controls: [], moment: 0 },
          { id: 'b2', gate: 'CX' as const, targets: [1], controls: [0], moment: 1 },
        ],
      },
    },
    {
      id: 'superposition-demo',
      title: 'Equal Superposition',
      category: 'Foundations',
      description: 'Test Hadamard 50/50 probability distribution across 1024 shots.',
      circuit: {
        id: 'h-exp',
        name: 'Hadamard Superposition',
        numQubits: 1,
        numMoments: 2,
        qubits: [{ index: 0, name: 'q0', initialValue: 0 as const }],
        operations: [{ id: 'h1', gate: 'H' as const, targets: [0], controls: [], moment: 0 }],
      },
    },
    {
      id: 'ghz-state',
      title: '3-Qubit GHZ State',
      category: 'Multi-Qubit',
      description: 'Tri-partite maximal entanglement: (|000⟩ + |111⟩)/√2.',
      circuit: {
        id: 'ghz-exp',
        name: '3-Qubit GHZ State',
        numQubits: 3,
        numMoments: 4,
        qubits: [
          { index: 0, name: 'q0', initialValue: 0 as const },
          { index: 1, name: 'q1', initialValue: 0 as const },
          { index: 2, name: 'q2', initialValue: 0 as const },
        ],
        operations: [
          { id: 'g1', gate: 'H' as const, targets: [0], controls: [], moment: 0 },
          { id: 'g2', gate: 'CX' as const, targets: [1], controls: [0], moment: 1 },
          { id: 'g3', gate: 'CX' as const, targets: [2], controls: [1], moment: 2 },
        ],
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-1">
              Qubify
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              Welcome back, {user?.name.split(' ')[0] || 'Scholar'}!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Continue your journey through quantum states, reversible logic, and algorithm synthesis.
            </p>
          </div>

          <Link
            to="/lab"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer self-start sm:self-center"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Launch Circuit Lab</span>
          </Link>
        </div>
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* XP Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>TOTAL XP</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
            {totalXp.toLocaleString()} XP
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            {totalXp > 0 ? (
              <span className="text-emerald-400 font-bold">{totalXp} XP earned</span>
            ) : (
              <span className="text-slate-500">0 XP · Complete lessons & challenges to earn XP</span>
            )}
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>DAILY STREAK</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-orange-400 font-mono">
            {dailyStreak} {dailyStreak === 1 ? 'day' : 'days'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            {dailyStreak > 0 ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
                <span>Active today</span>
              </>
            ) : (
              <span className="text-slate-500">0 days · Start your first study session today</span>
            )}
          </div>
        </div>

        {/* Path Progress Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>PATH PROGRESS</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono">
            {pathProgressPercent}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${pathProgressPercent}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            {completedCount === 0 ? (
              <span className="text-slate-500">0 of {totalLessons} lessons completed</span>
            ) : (
              <span>{completedCount} of {totalLessons} lessons completed</span>
            )}
          </div>
        </div>

        {/* Confidence Metric Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>LEARNING CONFIDENCE</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-300 font-mono">
            {learningConfidencePercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            {totalAssessments === 0 ? (
              <span className="text-slate-500">0% · Complete quizzes & challenges to build confidence</span>
            ) : (
              <span>Computed from {totalAssessments} assessment{totalAssessments === 1 ? '' : 's'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Student Activity Telemetry Grid (Zero-initialized for new students) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
              Completed Lessons
            </div>
            <div className="text-lg font-bold font-mono text-slate-100">
              {completedCount}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {completedCount === 0 ? '0 completed · Start Lesson 1' : `${completedCount} of ${totalLessons} finished`}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
              Completed Exercises
            </div>
            <div className="text-lg font-bold font-mono text-slate-100">
              {completedExercisesCount}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {completedExercisesCount === 0 ? '0 completed · Try Circuit Lab' : `${completedExercisesCount} challenges passed`}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
              Quiz Attempts
            </div>
            <div className="text-lg font-bold font-mono text-slate-100">
              {quizAttemptsCount}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {quizAttemptsCount === 0 ? '0 attempts · Test knowledge' : `${quizAttemptsCount} quizzes taken`}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
              Circuit Attempts
            </div>
            <div className="text-lg font-bold font-mono text-slate-100">
              {circuitAttemptsCount}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {circuitAttemptsCount === 0 ? '0 attempts · Run simulations' : `${circuitAttemptsCount} circuits tested`}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
              Achievements
            </div>
            <div className="text-lg font-bold font-mono text-slate-100">
              {achievementsCount}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {achievementsCount === 0 ? '0 unlocked · Badges await' : `${achievementsCount} of ${ALL_ACHIEVEMENTS.length}`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Continue Learning & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Continue Learning & Experiments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning Featured Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
                Continue Learning
              </h3>
              <Link
                to="/learn"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                <span>View Full Path</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/60">
                  {completedCount === 0 ? 'First Milestone' : 'Next Milestone'}
                </span>
                <h4 className="text-lg font-bold text-slate-100">
                  {nextLesson.title}
                </h4>
                <p className="text-xs text-slate-400 max-w-xl">
                  {nextLesson.description}
                </p>
              </div>

              <Link
                to={`/learn/${nextLesson.moduleId}/${nextLesson.id}`}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow"
              >
                <span>{completedCount === 0 ? 'Start First Lesson' : 'Resume Lesson'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Recommended Experiments */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider mb-4">
              Recommended Experiments
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {experimentPresets.map((exp) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 transition-colors group"
                >
                  <div>
                    <span className="text-[9px] uppercase font-mono text-cyan-400 font-bold">
                      {exp.category}
                    </span>
                    <h5 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors mt-0.5">
                      {exp.title}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>

                  <Link
                    to="/lab"
                    onClick={() => resetToModel(exp.circuit as any)}
                    className="mt-4 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-medium text-center transition-all flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run in Lab</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider mb-3">
              Recent Activity
            </h3>
            {activities.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-medium text-slate-300">No activity recorded yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Your lesson completions, quiz submissions, and circuit experiments will be recorded here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                      <div>
                        <div className="font-medium text-slate-200">{act.title}</div>
                        <div className="text-[11px] text-slate-400">{act.description}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(act.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Weekly Goal & AI Recommendations */}
        <div className="space-y-6">
          {/* Weekly Goal Progress Widget */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
                Weekly Learning Goal
              </span>
              <Target className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-300 font-medium">Study Target</span>
                <span className="text-cyan-300 font-bold font-mono">
                  {weeklyGoalProgress} / {weeklyGoalMinutes} mins
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-400 to-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${weeklyGoalPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>{Math.max(0, weeklyGoalMinutes - weeklyGoalProgress)} mins remaining</span>
                <span>{weeklyGoalPercent}% reached</span>
              </div>
              {weeklyGoalProgress === 0 && (
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                  Weekly Learning Goal: 0 minutes · Complete lessons or simulate circuits to record study time.
                </div>
              )}
            </div>
          </div>

          {/* AI Tutor Dynamic Recommendations */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold font-mono uppercase text-slate-200 tracking-wider">
                AI Tutor Recommendations
              </h3>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">
                      {rec.actionType}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        rec.urgency === 'high'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rec.urgency} priority
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-200">{rec.title}</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{rec.reason}</p>
                  <Link
                    to={rec.actionType === 'exercise' ? '/exercises' : '/learn'}
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium pt-1"
                  >
                    <span>Start: {rec.targetName}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements Sneak Peek */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold font-mono uppercase text-slate-300 tracking-wider">
                Achievements ({achievementsCount} / {ALL_ACHIEVEMENTS.length})
              </span>
              <Link to="/achievements" className="text-xs text-cyan-400 hover:text-cyan-300">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ALL_ACHIEVEMENTS.slice(0, 3).map((ach) => {
                const isUnlocked = userAchievements.some((u) => u.achievementId === ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 ${
                      isUnlocked
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <Award className="w-5 h-5 mb-0.5 opacity-60" />
                    <span className="text-[10px] font-bold line-clamp-1">{ach.title}</span>
                  </div>
                );
              })}
            </div>
            {achievementsCount === 0 && (
              <div className="text-[11px] text-slate-500 text-center pt-2">
                Achievements: 0 unlocked · Complete your first lesson or circuit to earn badges.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
