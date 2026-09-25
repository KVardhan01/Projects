import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LocalDatabase } from '../services/storage/localDatabase';
import { ExerciseRunner } from '../components/learning/ExerciseRunner';
import { AITutorDrawer } from '../components/ai/AITutorDrawer';
import { ChevronLeft } from 'lucide-react';

export const ExerciseDetailPage: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);

  const exercises = LocalDatabase.getAllExercises();
  const exercise = exercises.find((e) => e.id === exerciseId) || exercises[0];

  return (
    <div className="space-y-4">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/exercises"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to All Challenges</span>
        </Link>
      </div>

      <ExerciseRunner
        exercise={exercise}
        onOpenAITutor={() => setIsAITutorOpen(true)}
      />

      <AITutorDrawer
        isOpen={isAITutorOpen}
        onClose={() => setIsAITutorOpen(false)}
        lessonTitle={exercise.title}
        exerciseGoal={exercise.expectedBehavior}
      />
    </div>
  );
};
