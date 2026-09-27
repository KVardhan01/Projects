import { UserProfile } from '../../types/user';

declare global {
  interface Window {
    google?: any;
  }
}

export class GoogleAuthService {
  private static clientId: string =
    import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  private static cachedToken: string | null = null;
  private static tokenExpiresAt: number = 0;

  static getClientId(): string {
    if (this.clientId && this.clientId.trim().length > 5) {
      return this.clientId.trim();
    }
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('qubify_google_client_id');
      if (stored && stored.trim().length > 5) {
        return stored.trim();
      }
    }
    return '';
  }

  static setClientId(id: string): void {
    this.clientId = id.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('qubify_google_client_id', id.trim());
    }
  }

  static isConfigured(): boolean {
    return Boolean(this.getClientId().length > 5);
  }

  static init(): void {
    // Client initialization deferred to request time
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
      throw new Error('Google Identity Services SDK is loading. Please try again in a moment.');
    }

    const activeClientId = this.getClientId();
    if (!activeClientId) {
      throw new Error(
        'Google OAuth Client ID is not configured yet. Please configure your Client ID or use the development authentication below.'
      );
    }

    return new Promise((resolve, reject) => {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope:
            'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            this.cachedToken = response.access_token;
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

  static signOut(): void {
    if (this.cachedToken && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(this.cachedToken, () => {});
      } catch {
        // ignore
      }
    }
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }
}
