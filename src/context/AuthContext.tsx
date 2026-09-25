import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/user';
import { GoogleAuthService } from '../services/google/googleAuth';
import { LocalDatabase } from '../services/storage/localDatabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginDemo: (role?: UserRole) => void;
  switchRole: (role: UserRole) => void;
  updateUserStats: (xpGain: number, confidenceDelta?: number) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    return LocalDatabase.getCurrentUser() || GoogleAuthService.createMockUser('STUDENT');
  });
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return !GoogleAuthService.isConfigured();
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GoogleAuthService.init();
    if (!user) {
      const defaultUser = GoogleAuthService.createMockUser('STUDENT');
      setUser(defaultUser);
      LocalDatabase.saveUser(defaultUser);
    }
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await GoogleAuthService.requestAccessToken();
      const profile = await GoogleAuthService.fetchUserProfile(token);

      const existingUsers = LocalDatabase.getUsers();
      let matchedUser = existingUsers.find((u) => u.googleId === profile.googleId);

      if (!matchedUser) {
        matchedUser = {
          id: `user-${Date.now()}`,
          googleId: profile.googleId || `g-${Date.now()}`,
          name: profile.name || 'Quantum Scholar',
          email: profile.email || 'user@example.com',
          photoUrl:
            profile.photoUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          role: 'STUDENT',
          xp: 0,
          streak: 0,
          confidence: 0,
          weeklyGoal: 60,
          weeklyGoalProgress: 0,
          currentCourseId: 'quantum-computing-mastery',
          currentModuleId: 'mod-foundations',
          currentLessonId: 'lesson-1-what-is-qubit',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
          isActive: true,
        };
      } else {
        matchedUser.lastLoginAt = new Date().toISOString();
      }

      setUser(matchedUser);
      LocalDatabase.saveUser(matchedUser);
      setIsDemoMode(false);
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setError(err.message || 'Google authentication was not completed.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = (role: UserRole = 'STUDENT') => {
    const demoUser = GoogleAuthService.createMockUser(role);
    setUser(demoUser);
    LocalDatabase.saveUser(demoUser);
    setIsDemoMode(true);
    setError(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated = {
      ...user,
      role: newRole,
      name:
        newRole === 'STUDENT'
          ? 'Alex Rivera (Student)'
          : newRole === 'INSTRUCTOR'
          ? 'Dr. Evelyn Vance (Instructor)'
          : 'Dr. Marcus Sterling (Admin)',
    };
    setUser(updated);
    LocalDatabase.saveUser(updated);
  };

  const updateUserStats = (xpGain: number, confidenceDelta: number = 0) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      xp: user.xp + xpGain,
      confidence: Math.max(10, Math.min(99, user.confidence + confidenceDelta)),
      lastActivityAt: new Date().toISOString(),
    };
    setUser(updated);
    LocalDatabase.saveUser(updated);
  };

  const logout = () => {
    GoogleAuthService.signOut();
    const studentDemo = GoogleAuthService.createMockUser('STUDENT');
    setUser(studentDemo);
    LocalDatabase.saveUser(studentDemo);
    setIsDemoMode(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'STUDENT',
        isAuthenticated: Boolean(user),
        isDemoMode,
        isLoading,
        error,
        loginWithGoogle,
        loginDemo,
        switchRole,
        updateUserStats,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
