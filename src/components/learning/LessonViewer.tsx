import React, { useState } from 'react';
import { Lesson } from '../../types/curriculum';
import { useProgress } from '../../context/ProgressContext';
import { useQuantum } from '../../context/QuantumContext';
import { CircuitCanvas } from '../circuit/CircuitCanvas';
import { GatePalette } from '../circuit/GatePalette';
import { ProbabilityChart } from '../simulation/ProbabilityChart';
import { StateVectorPanel } from '../simulation/StateVectorPanel';
import { BlochSphere } from '../circuit/BlochSphere';
import { MeasurementTable } from '../simulation/MeasurementTable';
import { NoiseControls } from '../simulation/NoiseControls';
import { BackendSelector } from '../simulation/BackendSelector';
import { QiskitCodeEditor } from '../code/QiskitCodeEditor';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
  BookOpen,
  HelpCircle,
  FlaskConical,
} from 'lucide-react';

interface LessonViewerProps {
  lesson: Lesson;
  onOpenAITutor: () => void;
  onNextLesson?: () => void;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  lesson,
  onOpenAITutor,
  onNextLesson,
}) => {
  const { progressList, completeLesson } = useProgress();
  const { selectedGate, setSelectedGate, resetToModel, circuit } = useQuantum();

  const [activeTab, setActiveTab] = useState<'probabilities' | 'stateVector' | 'bloch' | 'measurements' | 'qiskit' | 'noise'>('probabilities');

  const isCompleted = progressList.some(
    (p) => p.lessonId === lesson.id && p.status === 'COMPLETED'
  );

  const handleMarkComplete = () => {
    completeLesson(lesson.id, lesson.moduleId);
    if (onNextLesson) onNextLesson();
  };

  const handleResetCircuit = () => {
    if (lesson.initialCircuit) {
      resetToModel(lesson.initialCircuit);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Prototype Lesson Top Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold uppercase tracking-wider">
              {lesson.difficulty}
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{lesson.estimatedMinutes} MIN</span>
            </span>
          </div>

          {/* Mark Complete Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkComplete}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'Completed (+50 XP)' : 'Mark Complete'}</span>
            </button>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mb-2">
          {lesson.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          {lesson.description}
        </p>

        {/* CORE IDEA Highlight Card */}
        <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 shadow-inner">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-cyan-400 tracking-wider mb-1.5 font-mono">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Core Intuition</span>
          </div>
          <p className="text-sm text-slate-200 font-medium leading-relaxed">
            {lesson.coreIdea}
          </p>
        </div>
      </div>

      {/* Theory & Detailed Explanation Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Lesson Content</span>
        </div>
        <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-3 whitespace-pre-line font-sans">
          {lesson.content}
        </div>
      </div>

      {/* EXPERIMENT: Shape the Circuit Interactive Workbench */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-teal-400 font-mono tracking-wider">
                Experiment
              </div>
              <h3 className="font-bold text-sm text-slate-100">Shape the Circuit</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BackendSelector />
            {lesson.initialCircuit && (
              <button
                onClick={handleResetCircuit}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                title="Reset to lesson starter circuit"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Circuit</span>
              </button>
            )}
            <button
              onClick={onOpenAITutor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Tutor</span>
            </button>
          </div>
        </div>

        {lesson.experimentGoal && (
          <div className="px-6 py-2.5 bg-cyan-950/30 border-b border-cyan-800/40 text-xs text-cyan-200 flex items-center gap-2">
            <span className="font-bold text-cyan-400 font-mono uppercase text-[10px]">Goal:</span>
            <span>{lesson.experimentGoal}</span>
          </div>
        )}

        {/* Workbench Layout: Gate Palette on Left + Canvas Center */}
        <div className="flex flex-col md:flex-row min-h-[340px]">
          <GatePalette
            selectedGate={selectedGate}
            onSelectGate={(g) => setSelectedGate(g)}
          />
          <CircuitCanvas editable={true} onOpenAITutor={onOpenAITutor} />
        </div>

        {/* Simulation Results Tabs & Panels */}
        <div className="border-t border-slate-800 bg-slate-950/60 p-4 sm:p-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4 overflow-x-auto text-xs font-mono">
            {[
              { id: 'probabilities', label: 'Probabilities' },
              { id: 'stateVector', label: 'State Vector' },
              { id: 'bloch', label: 'Bloch Sphere' },
              { id: 'measurements', label: 'Measurement Shots' },
              { id: 'qiskit', label: 'Qiskit Code' },
              { id: 'noise', label: 'NISQ Noise' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Result View */}
          <div>
            {activeTab === 'probabilities' && <ProbabilityChart />}
            {activeTab === 'stateVector' && <StateVectorPanel />}
            {activeTab === 'bloch' && (
              <div className="max-w-md mx-auto">
                <BlochSphere />
              </div>
            )}
            {activeTab === 'measurements' && <MeasurementTable />}
            {activeTab === 'qiskit' && (
              <div className="h-64">
                <QiskitCodeEditor />
              </div>
            )}
            {activeTab === 'noise' && <NoiseControls />}
          </div>
        </div>
      </div>
    </div>
  );
};
