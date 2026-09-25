import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  CheckSquare,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';
import { LocalDatabase } from '../services/storage/localDatabase';
import { useAuth } from '../context/AuthContext';
import { FeedbackItem } from '../types/ai';

export const InstructorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const attempts = LocalDatabase.getCircuitAttempts();
  const users = LocalDatabase.getUsers();
  const exercises = LocalDatabase.getAllExercises();

  const enrolledStudents = users.filter((u) => u.role === 'STUDENT');
  const totalEnrolled = enrolledStudents.length;

  // Real course completion across enrolled students
  let totalCompletedLessons = 0;
  enrolledStudents.forEach((st) => {
    const prog = LocalDatabase.getProgress(st.id);
    totalCompletedLessons += prog.filter((p) => p.status === 'COMPLETED').length;
  });
  const totalPossibleLessons = Math.max(1, totalEnrolled * 20);
  const avgCourseCompletion = totalEnrolled > 0 ? Math.round((totalCompletedLessons / totalPossibleLessons) * 100) : 0;

  // Real average challenge score
  const avgChallengeScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
    : 0;

  const [feedbackStudentId, setFeedbackStudentId] = useState(enrolledStudents[0]?.id || 'demo-student');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSentNotice, setFeedbackSentNotice] = useState(false);

  // Dynamic students needing attention from real attempts
  const studentsNeedingAttention = enrolledStudents.filter((st) => {
    const studentAttempts = attempts.filter((a) => a.userId === st.id);
    const failed = studentAttempts.filter((a) => a.completionStatus === 'FAILED');
    return failed.length > 0;
  }).map((st) => {
    const studentAttempts = attempts.filter((a) => a.userId === st.id);
    const failed = studentAttempts.filter((a) => a.completionStatus === 'FAILED');
    return {
      id: st.id,
      name: st.name,
      email: st.email,
      issue: `${failed.length} failed challenge attempt(s) requiring review`,
      confidence: `${st.confidence || 0}%`,
    };
  });

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    LocalDatabase.addFeedback({
      studentId: feedbackStudentId,
      studentName: 'Alex Rivera',
      instructorId: user?.id || 'inst-1',
      instructorName: user?.name || 'Dr. Evelyn Vance',
      referenceType: 'exercise',
      referenceId: 'ex-bell-state',
      referenceTitle: 'Bell State |Φ+⟩ Challenge',
      message: feedbackText,
      isRead: false,
    });

    setFeedbackText('');
    setFeedbackSentNotice(true);
    setTimeout(() => setFeedbackSentNotice(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-indigo-400 mb-1">
          <GraduationCap className="w-4 h-4" />
          <span>Instructor Management Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
          Class Analytics & Curriculum Control
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Monitor real-time cohort performance, review circuit AST submissions, dispatch targeted educational feedback, and configure new quantum lab exercises.
        </p>
      </div>

      {/* Top Instructor KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono mb-1">TOTAL ENROLLED</div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {totalEnrolled} {totalEnrolled === 1 ? 'Student' : 'Students'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalEnrolled === 0 ? '0 students enrolled' : `${totalEnrolled} registered learner(s)`}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono mb-1">COURSE COMPLETION</div>
          <div className="text-2xl font-bold text-indigo-300 font-mono">{avgCourseCompletion}%</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalCompletedLessons} lessons completed across cohort
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono mb-1">AVG CHALLENGE SCORE</div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">{avgChallengeScore}%</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {attempts.length === 0 ? '0 challenge attempts recorded' : `Across ${attempts.length} evaluated attempt(s)`}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono mb-1">PUBLISHED LAB EXERCISES</div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {exercises.length} Challenges
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across curriculum modules</div>
        </div>
      </div>

      {/* 2-Column: Students Needing Attention + Direct Feedback Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students Needing Attention */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
              Students Needing Attention
            </h3>
          </div>

          <div className="space-y-3">
            {studentsNeedingAttention.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No struggling students flagged. All registered learners are on track or have zero unresolved failures.
              </div>
            ) : (
              studentsNeedingAttention.map((student) => (
                <div
                  key={student.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">{student.name}</h4>
                    <div className="text-[11px] text-amber-300/90 mt-0.5">{student.issue}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Confidence: {student.confidence}
                    </div>
                  </div>

                  <Link
                    to="/instructor/students"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-medium transition-colors"
                  >
                    Inspect
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Send Instructor Feedback Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
              Send Student Feedback
            </h3>
            {feedbackSentNotice && (
              <span className="text-xs font-mono text-emerald-400 font-bold">
                ✓ Feedback delivered!
              </span>
            )}
          </div>

          <form onSubmit={handleSendFeedback} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Select Student:</label>
              <select
                value={feedbackStudentId}
                onChange={(e) => setFeedbackStudentId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
              >
                <option value="demo-student">Alex Rivera (alex.quantum@example.edu)</option>
                <option value="student-2">Jordan Lee (jordan.lee@example.edu)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Feedback Note:</label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Write actionable advice, explain a gate misconception, or suggest review material..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={!feedbackText.trim()}
              className="w-full py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-slate-950 font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Instructor Feedback</span>
            </button>
          </form>
        </div>
      </div>

      {/* Quick Links to Instructor Subpages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/instructor/students"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-colors flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300">
              Student Submissions & Attempt Inspector
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Review circuit AST, Qiskit code, and unitary fidelity for each student attempt.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/instructor/exercises"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-colors flex items-center justify-between group"
        >
          <div>
            <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300">
              Custom Exercise Builder
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Configure new exercises with custom allowed gates, qubit constraints, and model circuits.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
};
