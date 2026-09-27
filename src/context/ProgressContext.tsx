import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { LearningProgress, LearningActivity, UserAchievement } from '../types/progress';
import { Exercise, CircuitAttempt, QuizAttempt } from '../types/exercise';
import { CircuitModel } from '../types/quantum';
import { LocalDatabase } from '../services/storage/localDatabase';
import { ProbabilityEquivalence } from '../quantum/equivalence/ProbabilityEquivalence';
import { UnitaryEquivalence } from '../quantum/equivalence/UnitaryEquivalence';
import { QuantumTutorService } from '../services/ai/quantumTutor';
import { ALL_ACHIEVEMENTS } from '../data/achievementsData';
import confetti from 'canvas-confetti';

interface AssessmentResult {
  isSuccess: boolean;
  score: number;
  xpEarned: number;
  behavioralMatch: boolean;
  unitaryFidelity?: number;
  feedback: string;
  attempt: CircuitAttempt;
  unlockedAchievements: string[];
}

interface ProgressContextType {
  progressList: LearningProgress[];
  activities: LearningActivity[];
  userAchievements: UserAchievement[];
  circuitAttempts: CircuitAttempt[];
  quizAttempts: QuizAttempt[];
  completeLesson: (lessonId: string, moduleId: string) => void;
  assessExercise: (exercise: Exercise, studentCircuit: CircuitModel, code: string, hintsUsedCount?: number) => AssessmentResult;
  submitQuiz: (quizId: string, answers: Record<string, number>, correctCount: number, totalQuestions: number) => QuizAttempt;
  logActivity: (type: any, refId: string, title: string, desc: string) => void;
  checkAndUnlockAchievements: () => string[];
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserStats } = useAuth();
  const userId = user?.id || '';

  const [progressList, setProgressList] = useState<LearningProgress[]>(() =>
    user ? LocalDatabase.getProgress(user.id) : []
  );
  const [activities, setActivities] = useState<LearningActivity[]>(() =>
    user ? LocalDatabase.getActivities(user.id) : []
  );
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>(() =>
    user ? LocalDatabase.getUserAchievements(user.id) : []
  );
  const [circuitAttempts, setCircuitAttempts] = useState<CircuitAttempt[]>(() =>
    user ? LocalDatabase.getCircuitAttempts(user.id) : []
  );
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() =>
    user ? LocalDatabase.getQuizAttempts(user.id) : []
  );

  useEffect(() => {
    if (user && user.id) {
      setProgressList(LocalDatabase.getProgress(user.id));
      setActivities(LocalDatabase.getActivities(user.id));
      setUserAchievements(LocalDatabase.getUserAchievements(user.id));
      setCircuitAttempts(LocalDatabase.getCircuitAttempts(user.id));
      setQuizAttempts(LocalDatabase.getQuizAttempts(user.id));
    } else {
      setProgressList([]);
      setActivities([]);
      setUserAchievements([]);
      setCircuitAttempts([]);
      setQuizAttempts([]);
    }
  }, [user]);

  const logActivity = (type: any, refId: string, title: string, desc: string) => {
    LocalDatabase.logActivity({
      userId,
      activityType: type,
      referenceId: refId,
      title,
      description: desc,
    });
    setActivities(LocalDatabase.getActivities(userId));
  };

  const checkAndUnlockAchievements = (): string[] => {
    const newlyUnlocked: string[] = [];

    // Helper
    const tryUnlock = (achId: string) => {
      const success = LocalDatabase.unlockAchievement(userId, achId);
      if (success) {
        newlyUnlocked.push(achId);
        const ach = ALL_ACHIEVEMENTS.find((a) => a.id === achId);
        if (ach) {
          updateUserStats(ach.xpReward);
          logActivity('achievement_earned', achId, `Unlocked: ${ach.title}`, ach.description);
        }
      }
    };

    if (progressList.some((p) => p.status === 'COMPLETED')) {
      tryUnlock('ach-first-lesson');
    }
    if (circuitAttempts.length > 0) {
      tryUnlock('ach-first-circuit');
      tryUnlock('ach-first-sim');
    }
    if (circuitAttempts.some((a) => a.completionStatus === 'SUCCESS')) {
      tryUnlock('ach-first-challenge');
    }
    if (circuitAttempts.some((a) => a.exerciseId.includes('bell') && a.completionStatus === 'SUCCESS')) {
      tryUnlock('ach-first-bell');
    }
    if (circuitAttempts.some((a) => a.exerciseId.includes('grover') && a.completionStatus === 'SUCCESS')) {
      tryUnlock('ach-grover');
    }
    if (circuitAttempts.some((a) => a.exerciseId.includes('qft') && a.completionStatus === 'SUCCESS')) {
      tryUnlock('ach-qft');
    }
    if ((user?.streak || 0) >= 7) {
      tryUnlock('ach-7-streak');
    }
    if ((user?.xp || 0) >= 2000 && (user?.confidence || 0) >= 80) {
      tryUnlock('ach-mastery');
    }

    if (newlyUnlocked.length > 0) {
      setUserAchievements(LocalDatabase.getUserAchievements(userId));
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      } catch {}
    }

    return newlyUnlocked;
  };

  const completeLesson = (lessonId: string, moduleId: string) => {
    LocalDatabase.updateLessonProgress(userId, lessonId, moduleId, 'COMPLETED', 100);
    setProgressList(LocalDatabase.getProgress(userId));

    // Award XP
    updateUserStats(50, 2);
    logActivity('lesson_completed', lessonId, 'Completed Lesson', `Completed lesson: ${lessonId}`);
    checkAndUnlockAchievements();
  };

  const assessExercise = (
    exercise: Exercise,
    studentCircuit: CircuitModel,
    code: string,
    hintsUsedCount: number = 0
  ): AssessmentResult => {
    // 1. Behavioral check
    const probResult = ProbabilityEquivalence.compare(studentCircuit, exercise.modelCircuit, exercise.tolerance);

    // 2. Formal Unitary check (if no measurement)
    const unitaryResult = UnitaryEquivalence.compare(studentCircuit, exercise.modelCircuit);

    const isSuccess = probResult.isEquivalent || unitaryResult.isEquivalent;

    // Score deduction for hints: -15 per hint, minimum 50
    let score = isSuccess ? Math.max(50, exercise.points - hintsUsedCount * 15) : 25;
    const xpEarned = isSuccess ? score : 10;

    let feedback = '';
    if (isSuccess) {
      if (unitaryResult.isEquivalent) {
        feedback = `Accepted via Formal Unitary Equivalence (${(unitaryResult.fidelity * 100).toFixed(1)}% operator fidelity)! ${exercise.feedback}`;
      } else {
        feedback = `Accepted via Probability Behavioral Equivalence! Output distribution matches within tolerance. ${exercise.feedback}`;
      }
    } else {
      feedback = probResult.details;
    }

    const previousAttempts = circuitAttempts.filter((a) => a.exerciseId === exercise.id);
    const attempt = LocalDatabase.saveCircuitAttempt({
      userId,
      exerciseId: exercise.id,
      circuitJson: JSON.stringify(studentCircuit),
      code,
      resultJson: JSON.stringify(probResult.studentProbabilities),
      score,
      attemptNumber: previousAttempts.length + 1,
      completionStatus: isSuccess ? 'SUCCESS' : 'FAILED',
      hintsUsedCount,
      unitaryFidelity: unitaryResult.fidelity,
      feedbackGiven: feedback,
    });

    setCircuitAttempts(LocalDatabase.getCircuitAttempts());

    if (isSuccess) {
      updateUserStats(xpEarned, 4);
      logActivity('exercise_completed', exercise.id, `Passed: ${exercise.title}`, `Earned ${score} points.`);
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch {}
    } else {
      updateUserStats(10, -1);
      logActivity('exercise_started', exercise.id, `Attempted: ${exercise.title}`, `Attempt ${attempt.attemptNumber}.`);
    }

    const unlocked = checkAndUnlockAchievements();

    return {
      isSuccess,
      score,
      xpEarned,
      behavioralMatch: probResult.isEquivalent,
      unitaryFidelity: unitaryResult.fidelity,
      feedback,
      attempt,
      unlockedAchievements: unlocked,
    };
  };

  const submitQuiz = (
    quizId: string,
    answers: Record<string, number>,
    correctCount: number,
    totalQuestions: number
  ): QuizAttempt => {
    const score = Math.round((correctCount / totalQuestions) * 100);
    const prevAttempts = quizAttempts.filter((q) => q.quizId === quizId);

    const attempt = LocalDatabase.saveQuizAttempt({
      userId,
      quizId,
      answers,
      score,
      maxScore: 100,
      attemptNumber: prevAttempts.length + 1,
    });

    setQuizAttempts(LocalDatabase.getQuizAttempts());

    const xp = score >= 70 ? 100 : 30;
    updateUserStats(xp, score >= 70 ? 3 : -1);
    logActivity('quiz_completed', quizId, 'Completed Quiz', `Scored ${score}% (${correctCount}/${totalQuestions}).`);

    checkAndUnlockAchievements();
    return attempt;
  };

  return (
    <ProgressContext.Provider
      value={{
        progressList,
        activities,
        userAchievements,
        circuitAttempts,
        quizAttempts,
        completeLesson,
        assessExercise,
        submitQuiz,
        logActivity,
        checkAndUnlockAchievements,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
