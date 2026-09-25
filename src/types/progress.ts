export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface LearningProgress {
  id: string;
  userId: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  status: ProgressStatus;
  progressPercent: number;
  completedAt?: string;
  updatedAt: string;
}

export type ActivityType =
  | 'login'
  | 'lesson_started'
  | 'lesson_completed'
  | 'circuit_created'
  | 'circuit_simulated'
  | 'exercise_started'
  | 'exercise_completed'
  | 'quiz_completed'
  | 'ai_tutor_used'
  | 'hint_used'
  | 'circuit_saved'
  | 'achievement_earned';

export interface LearningActivity {
  id: string;
  userId: string;
  activityType: ActivityType;
  referenceId: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'learning' | 'circuit' | 'simulation' | 'streak' | 'mastery';
  xpReward: number;
  requirement: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface WeeklyGoal {
  lessonsTarget: number;
  lessonsCompleted: number;
  exercisesTarget: number;
  exercisesCompleted: number;
  minutesTarget: number;
  minutesSpent: number;
  xpTarget: number;
  xpEarned: number;
}
