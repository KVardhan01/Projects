import React, { useState } from 'react';
import { LocalDatabase } from '../services/storage/localDatabase';
import { UsersSheetService } from '../services/auth/usersSheetService';
import { CircuitAttempt } from '../types/exercise';
import { Users, Eye, CheckCircle2, AlertCircle, Award, Code2, Layers } from 'lucide-react';

export const InstructorStudentsPage: React.FC = () => {
  const attempts = LocalDatabase.getCircuitAttempts();
  const [selectedAttempt, setSelectedAttempt] = useState<CircuitAttempt | null>(null);

  const registeredUsers = UsersSheetService.getUsers();
  const studentUsers = registeredUsers.filter((u) => u.role === 'STUDENT');
  const students = studentUsers.map((u) => {
    const userProgress = LocalDatabase.getProgress(u.userId);
    const completed = userProgress.filter((p) => p.status === 'COMPLETED').length;
    const userAttempts = attempts.filter((a) => a.userId === u.userId);
    return {
      id: u.userId,
      name: u.name,
      email: `${u.username}@qubify.edu`,
      xp: 0,
      streak: 0,
      confidence: 0,
      completedLessons: completed,
      attemptsCount: userAttempts.length,
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-indigo-400 mb-1">
          <Users className="w-4 h-4" />
          <span>Cohort Telemetry</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
          Student Progress & Submission Inspector
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Detailed inspection of individual student state-vectors, AST models, Qiskit scripts, and historical exercise scores.
        </p>
      </div>

      {/* Students List Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 bg-slate-950/70 border-b border-slate-800">
          <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
            Enrolled Student Directory
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">XP</th>
                <th className="py-3 px-4">Streak</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Completed Lessons</th>
                <th className="py-3 px-4">Submissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No enrolled students with activity records found. When students complete lessons or submit circuit challenges, their telemetry will appear here.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200">{st.name}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{st.email}</div>
                    </td>
                    <td className="py-3 px-4 text-amber-300 font-bold">{st.xp.toLocaleString()} XP</td>
                    <td className="py-3 px-4 text-orange-400">{st.streak} Days</td>
                    <td className="py-3 px-4 text-cyan-300 font-bold">{st.confidence}%</td>
                    <td className="py-3 px-4 text-slate-300">{st.completedLessons} Lessons</td>
                    <td className="py-3 px-4 text-indigo-300">{st.attemptsCount} attempts</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submissions & Attempts Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 bg-slate-950/70 border-b border-slate-800">
          <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">
            Recent Circuit Challenge Submissions ({attempts.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-800/60">
          {attempts.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No exercise submissions logged yet. Have students solve challenges in the Exercises section!
            </div>
          ) : (
            attempts.map((att) => (
              <div
                key={att.id}
                className="p-4 flex items-center justify-between hover:bg-slate-850/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {att.completionStatus === 'SUCCESS' ? (
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-xs text-slate-200">
                      Exercise ID: {att.exerciseId} (Attempt #{att.attemptNumber})
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Score: {att.score} pts • Hints Used: {att.hintsUsedCount} • Time: {new Date(att.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAttempt(att)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Attempt</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Attempt Inspector Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-100">
                  Attempt #{selectedAttempt.attemptNumber} Inspector
                </h3>
                <div className="text-xs text-slate-400 font-mono">
                  Challenge: {selectedAttempt.exerciseId}
                </div>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* Score & Evaluation */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div>Status: <span className="font-bold text-emerald-400">{selectedAttempt.completionStatus}</span></div>
              <div>Score: <span className="text-cyan-300">{selectedAttempt.score} pts</span></div>
              <div>Hints Used: <span className="text-slate-300">{selectedAttempt.hintsUsedCount}</span></div>
              {selectedAttempt.unitaryFidelity !== undefined && (
                <div>Unitary Fidelity: <span className="text-cyan-300 font-bold">{(selectedAttempt.unitaryFidelity * 100).toFixed(1)}%</span></div>
              )}
            </div>

            {/* Generated Qiskit Code */}
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase font-mono text-slate-400 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                Submitted Qiskit Code
              </span>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-cyan-300 text-xs font-mono overflow-x-auto">
                {selectedAttempt.code || '# No code'}
              </pre>
            </div>

            {/* Feedback Given */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
              <span className="font-bold text-cyan-400 mr-1 uppercase font-mono">Feedback:</span>
              {selectedAttempt.feedbackGiven}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
