import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/user';
import { GoogleAuthService } from '../services/google/googleAuth';
import { GoogleSheetsService } from '../services/google/googleSheets';
import { LocalDatabase } from '../services/storage/localDatabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<UserProfile>;
  updateUserStats: (xpGain: number, confidenceDelta?: number) => void;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Purge any legacy demo/mock data upon script execution
LocalDatabase.purgeLegacyDemoData();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GoogleAuthService.init();
  }, []);

  const loginWithGoogle = async (): Promise<UserProfile> => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await GoogleAuthService.requestAccessToken();
      const profile = await GoogleAuthService.fetchUserProfile(token);

      if (!profile.email) {
        throw new Error('Could not retrieve email from Google Account.');
      }

      // Query the Google Sheets "Users" tab
      // Columns: UserId, Name, Email, GoogleId, Role, Status, CreatedAt
      const { headers, rows } = await GoogleSheetsService.readSheet('Users');

      const headerMap: Record<string, number> = {};
      headers.forEach((h, idx) => {
        headerMap[h.trim().toLowerCase()] = idx;
      });

      const userIdIdx = headerMap['userid'] ?? 0;
      const nameIdx = headerMap['name'] ?? 1;
      const emailIdx = headerMap['email'] ?? 2;
      const googleIdIdx = headerMap['googleid'] ?? 3;
      const roleIdx = headerMap['role'] ?? 4;
      const statusIdx = headerMap['status'] ?? 5;
      const createdAtIndex = headerMap['createdat'] ?? 6;

      const userEmail = profile.email.toLowerCase().trim();
      const userGoogleId = (profile.googleId || '').trim();

      const matchedRow = rows.find((r) => {
        const rowEmail = (r[emailIdx] || '').toLowerCase().trim();
        const rowGoogleId = (r[googleIdIdx] || '').trim();
        return (rowEmail && rowEmail === userEmail) || (userGoogleId && rowGoogleId === userGoogleId);
      });

      // Requirement 12: If the Google account is authenticated but does not exist in the Users sheet, show:
      // "Your account is not registered for Qubify. Please contact the administrator."
      // Do not allow access.
      if (!matchedRow) {
        GoogleAuthService.signOut();
        setUser(null);
        LocalDatabase.setCurrentUser(null);
        throw new Error('Your account is not registered for Qubify. Please contact the administrator.');
      }

      // Requirement 13: If the user exists but Status is not Active, show:
      // "Your Qubify account is inactive. Please contact the administrator."
      // Do not allow access.
      const status = (matchedRow[statusIdx] || '').trim();
      if (status.toLowerCase() !== 'active') {
        GoogleAuthService.signOut();
        setUser(null);
        LocalDatabase.setCurrentUser(null);
        throw new Error('Your Qubify account is inactive. Please contact the administrator.');
      }

      // Requirement 9: Read the Role column from Google Sheets.
      const rawRole = (matchedRow[roleIdx] || '').trim().toUpperCase();
      let role: UserRole;
      if (rawRole === 'ADMIN') {
        role = 'ADMIN';
      } else if (rawRole === 'INSTRUCTOR') {
        role = 'INSTRUCTOR';
      } else if (rawRole === 'STUDENT') {
        role = 'STUDENT';
      } else {
        GoogleAuthService.signOut();
        setUser(null);
        LocalDatabase.setCurrentUser(null);
        throw new Error('Your account is not registered for Qubify. Please contact the administrator.');
      }

      const authenticatedUser: UserProfile = {
        id: matchedRow[userIdIdx] || profile.googleId || `user-${Date.now()}`,
        googleId: profile.googleId || matchedRow[googleIdIdx] || '',
        name: matchedRow[nameIdx] || profile.name || 'Scholar',
        email: profile.email,
        photoUrl: profile.photoUrl || '',
        role,
        xp: 0,
        streak: 0,
        confidence: 0,
        weeklyGoal: 0,
        weeklyGoalProgress: 0,
        currentCourseId: 'quantum-computing-mastery',
        currentModuleId: 'mod-foundations',
        currentLessonId: 'lesson-1-what-is-qubit',
        createdAt: matchedRow[createdAtIndex] || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        isActive: true,
      };

      setUser(authenticatedUser);
      LocalDatabase.setCurrentUser(authenticatedUser);
      LocalDatabase.saveUser(authenticatedUser);
      return authenticatedUser;
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      const msg = err.message || 'Google authentication was not completed.';
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
    LocalDatabase.saveUser(updated);
    LocalDatabase.setCurrentUser(updated);
  };

  const logout = () => {
    GoogleAuthService.signOut();
    setUser(null);
    LocalDatabase.setCurrentUser(null);
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
        loginWithGoogle,
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
