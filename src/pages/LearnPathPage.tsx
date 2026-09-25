import React from 'react';
import { Link } from 'react-router-dom';
import { INITIAL_MODULES, INITIAL_LESSONS } from '../data/initialCurriculum';
import { useProgress } from '../context/ProgressContext';
import { BookOpen, CheckCircle2, Clock, ChevronRight, Sparkles } from 'lucide-react';

export const LearnPathPage: React.FC = () => {
  const { progressList } = useProgress();

  const isLessonCompleted = (lessonId: string) => {
    return progressList.some((p) => p.lessonId === lessonId && p.status === 'COMPLETED');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-cyan-400 mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Curriculum Roadmap</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
          Structured Learning Path
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Progress from basic quantum intuition to multi-qubit entanglement, amplitude amplification, and the Quantum Fourier Transform.
        </p>
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        {INITIAL_MODULES.map((module, mIdx) => {
          const moduleLessons = INITIAL_LESSONS.filter((l) => l.moduleId === module.id);
          const completedInModule = moduleLessons.filter((l) => isLessonCompleted(l.id)).length;
          const progressPercent = Math.round(
            (completedInModule / Math.max(1, moduleLessons.length)) * 100
          );

          return (
            <div
              key={module.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
            >
              {/* Module Header */}
              <div className="p-5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold font-mono text-sm flex items-center justify-center">
                    0{mIdx + 1}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono font-bold text-slate-400">
                      Module {mIdx + 1} • {module.category}
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{module.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{module.estimatedMinutes} mins</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">
                      {completedInModule}/{moduleLessons.length}
                    </span>
                    <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lessons within this module */}
              <div className="divide-y divide-slate-800/60 p-2">
                {moduleLessons.map((lesson) => {
                  const completed = isLessonCompleted(lesson.id);
                  return (
                    <Link
                      key={lesson.id}
                      to={`/learn/${module.id}/${lesson.id}`}
                      className="p-3 sm:px-4 rounded-xl hover:bg-slate-850/60 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            completed
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                          }`}
                        >
                          {completed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-mono">{lesson.order}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                            {lesson.title}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xl">
                            {lesson.coreIdea}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
                          {lesson.estimatedMinutes}m
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
