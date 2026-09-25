import { UserProfile, UserRole } from '../../types/user';

declare global {
  interface Window {
    google?: any;
  }
}

export interface GoogleAuthConfig {
  clientId: string;
  sheetsId?: string;
}

export class GoogleAuthService {
  private static clientId: string =
    import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  private static tokenClient: any = null;
  private static cachedToken: string | null = null;
  private static tokenExpiresAt: number = 0;

  static init(): void {
    if (typeof window === 'undefined') return;
    if (this.clientId && window.google?.accounts?.oauth2) {
      try {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: () => {}, // overridden per request
        });
      } catch (err) {
        console.warn('Google Identity Services init deferred:', err);
      }
    }
  }

  static isConfigured(): boolean {
    return Boolean(this.clientId && this.clientId.trim().length > 5);
  }

  static getCachedAccessToken(): string | null {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken;
    }
    return null;
  }

  static async requestAccessToken(): Promise<string> {
    if (this.getCachedAccessToken()) {
      return this.cachedToken!;
    }

    if (!window.google?.accounts?.oauth2) {
      throw new Error('Google Identity Services SDK is not loaded. Please check your network or use Demo Mode.');
    }

    if (!this.clientId) {
      throw new Error(
        'Google authentication is not configured yet because the final deployment URL has not been decided. Keep authentication in development/demo mode and allow the application to run without VITE_GOOGLE_CLIENT_ID.'
      );
    }

    return new Promise((resolve, reject) => {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            this.cachedToken = response.access_token;
            // Token usually expires in 3600 seconds, add buffer of 60 seconds
            this.tokenExpiresAt = Date.now() + (parseInt(response.expires_in, 10) - 60) * 1000;
            resolve(response.access_token);
          },
        });
        client.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  }

  static async fetchUserProfile(token: string): Promise<Partial<UserProfile>> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error('Failed to retrieve Google user profile.');
    }
    const data = await res.json();
    return {
      googleId: data.sub,
      email: data.email,
      name: data.name,
      photoUrl: data.picture,
    };
  }

  static createMockUser(role: UserRole = 'STUDENT'): UserProfile {
    const roleTitles: Record<UserRole, { name: string; email: string }> = {
      STUDENT: { name: 'Alex Rivera (Demo Student)', email: 'alex.quantum@example.edu' },
      INSTRUCTOR: { name: 'Dr. Evelyn Vance (Demo Instructor)', email: 'e.vance@quantumlab.edu' },
      ADMIN: { name: 'Dr. Marcus Sterling (Demo Admin)', email: 'admin@quantumlab.io' },
    };

    const details = roleTitles[role];
    return {
      id: `user-demo-${role.toLowerCase()}`,
      googleId: `google-mock-${role.toLowerCase()}`,
      name: details.name,
      email: details.email,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      role,
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
  }

  static signOut(): void {
    if (this.cachedToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(this.cachedToken, () => {});
    }
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }
}
