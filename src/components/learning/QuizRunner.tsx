import React, { useState } from 'react';
import { Quiz } from '../../types/exercise';
import { useProgress } from '../../context/ProgressContext';
import { CheckCircle2, AlertCircle, Award, RotateCcw } from 'lucide-react';

interface QuizRunnerProps {
  quiz: Quiz;
  onComplete?: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({ quiz, onComplete }) => {
  const { submitQuiz } = useProgress();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [attemptResult, setAttemptResult] = useState<any | null>(null);

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const res = submitQuiz(quiz.id, selectedAnswers, correctCount, quiz.questions.length);
    setAttemptResult(res);
    setSubmitted(true);
    if (onComplete) onComplete();
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setAttemptResult(null);
  };

  const allAnswered = quiz.questions.every((q) => selectedAnswers[q.id] !== undefined);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase text-cyan-400">
            Assessment Quiz
          </span>
          <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>+{quiz.points} XP Available</span>
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">{quiz.title}</h2>
        <p className="text-sm text-slate-300 leading-relaxed">{quiz.description}</p>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {quiz.questions.map((q, idx) => {
          const userChoice = selectedAnswers[q.id];
          const isAnswered = userChoice !== undefined;
          const isCorrect = userChoice === q.correctIndex;

          return (
            <div
              key={q.id}
              className={`p-6 rounded-2xl border transition-all ${
                submitted
                  ? isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold font-mono flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="font-semibold text-sm text-slate-100">{q.question}</h3>
                </div>
                {submitted && (
                  <div>
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = userChoice === optIdx;
                  const isCorrectOption = q.correctIndex === optIdx;

                  let optionStyle =
                    'bg-slate-850 hover:bg-slate-800 border-slate-700/80 text-slate-300';
                  if (submitted) {
                    if (isCorrectOption) {
                      optionStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold';
                    } else if (isSelected && !isCorrectOption) {
                      optionStyle = 'bg-rose-500/20 border-rose-400 text-rose-200 line-through';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-medium';
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={submitted}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`w-full p-3 rounded-xl border text-xs text-left transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                    >
                      <span>{opt}</span>
                      <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation upon submission */}
              {submitted && (
                <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
                  <span className="font-bold text-cyan-400 mr-1 font-mono uppercase">Explanation:</span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submission Footer */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        {!submitted ? (
          <>
            <span className="text-xs text-slate-400">
              {Object.keys(selectedAnswers).length} of {quiz.questions.length} answered
            </span>
            <button
              disabled={!allAnswered}
              onClick={handleSubmit}
              className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              Submit Quiz
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <div className="text-sm font-bold text-slate-100">
              Your Score: <span className="text-cyan-400">{attemptResult?.score}%</span>
            </div>
            <button
              onClick={handleRetake}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
