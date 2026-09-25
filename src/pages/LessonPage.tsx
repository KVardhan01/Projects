import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { INITIAL_LESSONS } from '../data/initialCurriculum';
import { INITIAL_QUIZZES } from '../data/initialQuizzes';
import { LessonViewer } from '../components/learning/LessonViewer';
import { QuizRunner } from '../components/learning/QuizRunner';
import { AITutorDrawer } from '../components/ai/AITutorDrawer';

export const LessonPage: React.FC = () => {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  // Find lesson by lessonId or fallback to first
  const lesson =
    INITIAL_LESSONS.find((l) => l.id === lessonId) || INITIAL_LESSONS[0];

  // Associated quiz if any
  const quiz = INITIAL_QUIZZES.find((q) => q.id === lesson.quizId);

  const handleNextLesson = () => {
    const currentIdx = INITIAL_LESSONS.findIndex((l) => l.id === lesson.id);
    if (currentIdx < INITIAL_LESSONS.length - 1) {
      const next = INITIAL_LESSONS[currentIdx + 1];
      navigate(`/learn/${next.moduleId}/${next.id}`);
    } else {
      navigate('/learn');
    }
  };

  return (
    <div>
      {/* Lesson vs Quiz View Toggle if quiz exists */}
      {quiz && (
        <div className="max-w-6xl mx-auto mb-4 flex items-center justify-end">
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex gap-1 text-xs">
            <button
              onClick={() => setShowQuiz(false)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                !showQuiz
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interactive Lesson
            </button>
            <button
              onClick={() => setShowQuiz(true)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                showQuiz
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Lesson Assessment Quiz
            </button>
          </div>
        </div>
      )}

      {showQuiz && quiz ? (
        <QuizRunner quiz={quiz} onComplete={() => {}} />
      ) : (
        <LessonViewer
          lesson={lesson}
          onOpenAITutor={() => setIsAITutorOpen(true)}
          onNextLesson={handleNextLesson}
        />
      )}

      <AITutorDrawer
        isOpen={isAITutorOpen}
        onClose={() => setIsAITutorOpen(false)}
        lessonTitle={lesson.title}
        moduleTitle={lesson.moduleId}
        exerciseGoal={lesson.experimentGoal}
      />
    </div>
  );
};
