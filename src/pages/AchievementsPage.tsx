import React from 'react';
import { ALL_ACHIEVEMENTS } from '../data/achievementsData';
import { useProgress } from '../context/ProgressContext';
import {
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  BookOpen,
  Cpu,
  Play,
  Zap,
  Flame,
  Compass,
  Search,
  Activity,
  Layers,
  BarChart3,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Cpu,
  Play,
  Zap,
  CheckCircle2,
  Flame,
  Compass,
  Search,
  Activity,
  Layers,
  BarChart3,
  Sparkles,
  Award,
};

export const AchievementsPage: React.FC = () => {
  const { userAchievements } = useProgress();

  const isUnlocked = (id: string) => {
    return userAchievements.some((ua) => ua.achievementId === id);
  };

  const unlockedCount = userAchievements.length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-400 mb-1">
          <Award className="w-4 h-4" />
          <span>Milestones & Badges</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
          Quantum Achievements Showcase
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Earn XP and quantum credentials by achieving scientific, algorithmic, and circuit construction breakthroughs.
        </p>

        <div className="mt-4 flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-amber-300 font-bold">
            {unlockedCount} of {ALL_ACHIEVEMENTS.length} Badges Unlocked
          </div>
          <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${(unlockedCount / ALL_ACHIEVEMENTS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_ACHIEVEMENTS.map((ach) => {
          const unlocked = isUnlocked(ach.id);
          const Icon = ICON_MAP[ach.iconName] || Award;
          const userRecord = userAchievements.find((ua) => ua.achievementId === ach.id);

          return (
            <div
              key={ach.id}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                unlocked
                  ? 'bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-slate-950/50 border-slate-800/80 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      unlocked
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      unlocked
                        ? 'bg-amber-950/50 text-amber-300 border border-amber-800/80'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    +{ach.xpReward} XP
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-100 mb-1">{ach.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {ach.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Requirement: {ach.requirement}</span>
                {unlocked ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Unlocked</span>
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
