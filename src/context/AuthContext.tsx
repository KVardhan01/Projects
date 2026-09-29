import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/user';
import { UsersSheetService } from '../services/auth/usersSheetService';
import { LocalDatabase } from '../services/storage/localDatabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<UserProfile>;
  register: (username: string, password: string, confirmPassword?: string) => Promise<void>;
  updateUserStats: (xpGain: number, confidenceDelta?: number) => void;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Purge any legacy demo or test session keys
LocalDatabase.purgeLegacyDemoData();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    return UsersSheetService.getCurrentSession();
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sync active session if available
    const active = UsersSheetService.getCurrentSession();
    if (active) {
      setUser(active);
      LocalDatabase.setCurrentUser(active);
    }
  }, []);

  const login = async (usernameInput: string, passwordInput: string): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      // Authenticates user against the Users sheet table columns:
      // UserId | Name | Username | Password | Role | Status | CreatedAt
      const authenticatedUser = await UsersSheetService.authenticate(usernameInput, passwordInput);
      setUser(authenticatedUser);
      LocalDatabase.setCurrentUser(authenticatedUser);
      LocalDatabase.saveUser(authenticatedUser);
      return authenticatedUser;
    } catch (err: any) {
      const msg = err.message || 'Authentication failed.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    usernameInput: string,
    passwordInput: string,
    confirmPasswordInput?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const newRow = await UsersSheetService.registerUser({
        username: usernameInput,
        password: passwordInput,
        confirmPassword: confirmPasswordInput,
      });

      // Synchronize into LocalDatabase user list as well for administration views
      LocalDatabase.saveUser({
        id: newRow.userId,
        username: newRow.username,
        name: newRow.name,
        email: `${newRow.username}@qubify.edu`,
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          newRow.name
        )}&background=0891b2&color=fff`,
        role: 'STUDENT',
        status: 'Active',
        xp: 0,
        streak: 0,
        confidence: 0,
        weeklyGoal: 0,
        weeklyGoalProgress: 0,
        currentCourseId: 'quantum-computing-mastery',
        currentModuleId: 'mod-foundations',
        currentLessonId: 'lesson-1-what-is-qubit',
        createdAt: newRow.createdAt,
        lastLoginAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        isActive: true,
      });
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStats = (xpGain: number, confidenceDelta: number = 0) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      xp: user.xp + xpGain,
      confidence: Math.max(0, Math.min(99, user.confidence + confidenceDelta)),
      lastActivityAt: new Date().toISOString(),
    };
    setUser(updated);
    UsersSheetService.setCurrentSession(updated);
    LocalDatabase.saveUser(updated);
    LocalDatabase.setCurrentUser(updated);
  };

  const logout = () => {
    UsersSheetService.clearSession();
    LocalDatabase.setCurrentUser(null);
    setUser(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'STUDENT',
        isAuthenticated: Boolean(user && user.isActive),
        isLoading,
        error,
        login,
        register,
        updateUserStats,
        logout,
        clearError,
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
