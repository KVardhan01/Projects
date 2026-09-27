export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface UserProfile {
  id: string;
  googleId: string;
  name: string;
  email: string;
  photoUrl: string;
  role: UserRole;
  xp: number;
  streak: number;
  confidence: number; // 0 - 100
  weeklyGoal: number; // in minutes or lessons
  weeklyGoalProgress: number;
  currentCourseId: string;
  currentModuleId: string;
  currentLessonId: string;
  createdAt: string;
  lastLoginAt: string;
  lastActivityAt: string;
  isActive: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  error: string | null;
}
