import { UsersSheetService, SheetUserRow } from '../auth/usersSheetService';

export const SHEET_TABS = [
  'Users',
  'Courses',
  'Modules',
  'Lessons',
  'Exercises',
  'Questions',
  'Circuits',
  'CircuitAttempts',
  'QuizAttempts',
  'LearningProgress',
  'LearningActivities',
  'Achievements',
  'UserAchievements',
  'AIConversations',
  'AIRecommendations',
  'Simulations',
  'Goals',
  'Feedback',
  'Notifications',
] as const;

export type SheetTabName = typeof SHEET_TABS[number];

const STORAGE_KEYS = {
  SHEETS_ID: 'qubify_sheets_id',
  APPS_SCRIPT_URL: 'qubify_apps_script_url',
  ACCESS_TOKEN: 'qubify_google_access_token',
  API_KEY: 'qubify_google_api_key',
};

export class GoogleSheetsService {
  private static sheetsId: string =
    (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEYS.SHEETS_ID)) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_SHEETS_ID) ||
    '1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U';

  private static appsScriptUrl: string =
    (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEYS.APPS_SCRIPT_URL)) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_APPS_SCRIPT_URL) ||
    '';

  private static accessToken: string =
    (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_ACCESS_TOKEN) ||
    '';

  private static apiKey: string =
    (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEYS.API_KEY)) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_API_KEY) ||
    '';

  static isConfigured(): boolean {
    return Boolean(this.sheetsId && this.sheetsId.trim().length > 5);
  }

  static hasLiveConnection(): boolean {
    return Boolean(
      this.isConfigured() &&
        ((this.appsScriptUrl && this.appsScriptUrl.trim().length > 10) ||
          (this.accessToken && this.accessToken.trim().length > 10))
    );
  }

  static getSpreadsheetId(): string {
    return this.sheetsId;
  }

  static setSpreadsheetId(id: string): void {
    this.sheetsId = id.trim();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SHEETS_ID, this.sheetsId);
    }
  }

  static getAppsScriptUrl(): string {
    return this.appsScriptUrl;
  }

  static setAppsScriptUrl(url: string): void {
    this.appsScriptUrl = url.trim();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.APPS_SCRIPT_URL, this.appsScriptUrl);
    }
  }

  static getAccessToken(): string {
    return this.accessToken;
  }

  static setAccessToken(token: string): void {
    this.accessToken = token.trim();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, this.accessToken);
    }
  }

  static getApiKey(): string {
    return this.apiKey;
  }

  static setApiKey(key: string): void {
    this.apiKey = key.trim();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.API_KEY, this.apiKey);
    }
  }

  /**
   * Reads rows from a spreadsheet tab.
   * For the Users tab, expects:
   * UserId | Name | Username | Password | Role | Status | CreatedAt
   */
  static async readSheet(
    tabName: SheetTabName | string
  ): Promise<{ headers: string[]; rows: string[][] }> {
    const cleanTab = tabName.trim();

    // 1. Try Google Apps Script Web App if configured
    if (this.appsScriptUrl) {
      try {
        const queryUrl = `${this.appsScriptUrl}${
          this.appsScriptUrl.includes('?') ? '&' : '?'
        }action=read&tab=${encodeURIComponent(cleanTab)}&sheetId=${encodeURIComponent(this.sheetsId)}`;
        const res = await fetch(queryUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.rows)) {
            const headers = data.headers || [
              'UserId',
              'Name',
              'Username',
              'Password',
              'Role',
              'Status',
              'CreatedAt',
            ];
            const rows: string[][] = data.rows.map((r: any) =>
              Array.isArray(r) ? r.map(String) : []
            );

            // Sync Users table into local cache if tab is Users
            if (cleanTab.toLowerCase() === 'users' && rows.length > 0) {
              this.syncUsersToCache(headers, rows);
            }

            return { headers, rows };
          }
        }
      } catch (err) {
        console.warn('Google Apps Script readSheet error:', err);
      }
    }

    // 2. Try Google Sheets API v4 with OAuth Access Token
    if (this.accessToken) {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
          this.sheetsId
        )}/values/${encodeURIComponent(cleanTab)}!A1:Z?valueRenderOption=UNFORMATTED_VALUE`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const allRows: any[][] = data.values || [];
          if (allRows.length > 0) {
            const headers = allRows[0].map(String);
            const rows = allRows.slice(1).map((r) => r.map(String));

            if (cleanTab.toLowerCase() === 'users') {
              this.syncUsersToCache(headers, rows);
            }

            return { headers, rows };
          }
        }
      } catch (err) {
        console.warn('Google Sheets API readSheet error:', err);
      }
    }

    // 3. Fallback to cached Users data
    if (cleanTab.toLowerCase() === 'users') {
      const users = UsersSheetService.getUsers();
      const headers = ['UserId', 'Name', 'Username', 'Password', 'Role', 'Status', 'CreatedAt'];
      const rows = users.map((u) => [
        u.userId,
        u.name,
        u.username,
        u.password || '',
        u.role,
        u.status,
        u.createdAt,
      ]);
      return { headers, rows };
    }

    return { headers: [], rows: [] };
  }

  /**
   * Helper to sync live sheet rows into UsersSheetService cache.
   */
  private static syncUsersToCache(headers: string[], rows: string[][]): void {
    try {
      const headerMap: Record<string, number> = {};
      headers.forEach((h, idx) => {
        headerMap[h.trim().toLowerCase()] = idx;
      });

      const userIdIdx = headerMap['userid'] ?? 0;
      const nameIdx = headerMap['name'] ?? 1;
      const usernameIdx = headerMap['username'] ?? 2;
      const passwordIdx = headerMap['password'] ?? 3;
      const roleIdx = headerMap['role'] ?? 4;
      const statusIdx = headerMap['status'] ?? 5;
      const createdAtIdx = headerMap['createdat'] ?? 6;

      const sheetUsers: SheetUserRow[] = rows
        .filter((r) => r && r[usernameIdx] && String(r[usernameIdx]).trim().length > 0)
        .map((r) => {
          const rawRole = (r[roleIdx] || '').trim().toUpperCase();
          const role =
            rawRole === 'ADMIN' ? 'ADMIN' : rawRole === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';
          const rawStatus = (r[statusIdx] || '').trim();
          const status = rawStatus.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';

          return {
            userId: String(r[userIdIdx] || '').trim(),
            name: String(r[nameIdx] || r[usernameIdx] || 'Scholar').trim(),
            username: String(r[usernameIdx] || '').trim(),
            password: String(r[passwordIdx] || ''),
            role,
            status,
            createdAt: String(r[createdAtIdx] || new Date().toISOString().split('T')[0]),
          };
        });

      if (sheetUsers.length > 0) {
        UsersSheetService.overrideUsers(sheetUsers);
      }
    } catch (e) {
      console.warn('Failed to sync users to cache:', e);
    }
  }

  /**
   * Appends a single row to a spreadsheet tab.
   * Throws an error if the append to Google Sheets does not succeed.
   */
  static async appendRow(
    tabName: SheetTabName | string,
    row: (string | number | boolean | null)[]
  ): Promise<{ status: string; result?: any }> {
    const cleanTab = tabName.trim();
    let lastError: Error | null = null;

    // 1. Try Google Apps Script Web App
    if (this.appsScriptUrl) {
      try {
        const res = await fetch(this.appsScriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: 'appendRow',
            sheetId: this.sheetsId,
            tab: cleanTab,
            row,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success' || json.result === 'success' || json.success) {
            return { status: 'success', result: json };
          }
          if (json.error || json.message) {
            throw new Error(json.error || json.message);
          }
        } else {
          throw new Error(`Google Apps Script responded with HTTP ${res.status}`);
        }
      } catch (err: any) {
        lastError = err;
        console.error('Apps Script appendRow error:', err);
      }
    }

    // 2. Try Google Sheets API v4 with OAuth Access Token
    if (this.accessToken) {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
          this.sheetsId
        )}/values/${encodeURIComponent(cleanTab)}!A:G:append?valueInputOption=USER_ENTERED`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: `${cleanTab}!A:G`,
            majorDimension: 'ROWS',
            values: [row],
          }),
        });

        if (res.ok) {
          const json = await res.json();
          return { status: 'success', result: json };
        } else {
          const errBody = await res.text();
          let msg = `Google Sheets API returned status ${res.status}`;
          try {
            const parsed = JSON.parse(errBody);
            if (parsed.error?.message) msg = parsed.error.message;
          } catch {}
          throw new Error(msg);
        }
      } catch (err: any) {
        lastError = err;
        console.error('Google Sheets API appendRow error:', err);
      }
    }

    // If neither authorization method succeeded or is configured:
    if (lastError) {
      throw new Error(lastError.message || 'Unable to create account. Please try again.');
    }

    throw new Error(
      `Unable to write to Google Sheets spreadsheet "${this.sheetsId}". Authorization is required. Please configure your Google Apps Script Web App URL or Google Access Token in Admin Settings.`
    );
  }

  /**
   * Updates an existing row.
   */
  static async updateRow(
    tabName: SheetTabName | string,
    rowNumber: number,
    row: (string | number | boolean | null)[]
  ): Promise<any> {
    if (tabName.toLowerCase() === 'users') {
      const [userId, name, username, password, role, status, createdAt] = row;
      UsersSheetService.saveUser({
        userId: String(userId),
        name: String(name),
        username: String(username),
        password: String(password || ''),
        role: (role as any) || 'STUDENT',
        status: (status as any) || 'Active',
        createdAt: String(createdAt || new Date().toISOString().split('T')[0]),
      });
      return { status: 'success' };
    }

    return { status: 'success' };
  }

  /**
   * Finds the first row matching value in colIndex (0-indexed).
   */
  static async findRow(
    tabName: SheetTabName | string,
    colIndex: number,
    value: string
  ): Promise<{ rowIndex: number; row: string[] } | null> {
    const { rows } = await this.readSheet(tabName);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][colIndex] === value) {
        return { rowIndex: i + 2, row: rows[i] };
      }
    }
    return null;
  }

  /**
   * Finds all rows matching value in colIndex (0-indexed).
   */
  static async findRows(
    tabName: SheetTabName | string,
    colIndex: number,
    value: string
  ): Promise<{ rowIndex: number; row: string[] }[]> {
    const { rows } = await this.readSheet(tabName);
    const matches: { rowIndex: number; row: string[] }[] = [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][colIndex] === value) {
        matches.push({ rowIndex: i + 2, row: rows[i] });
      }
    }
    return matches;
  }

  /**
   * Tests connection state against the Users tab.
   */
  static async testConnection(): Promise<{ ok: boolean; title?: string; error?: string }> {
    try {
      if (!this.hasLiveConnection()) {
        return {
          ok: false,
          error:
            'No live database connection configured. Please provide a Google Apps Script Web App URL or Google OAuth Access Token in the fields below.',
        };
      }

      const { headers, rows } = await this.readSheet('Users');
      if (headers.length > 0) {
        return {
          ok: true,
          title: `Google Sheet Connected (${rows.length} records found in Users tab)`,
        };
      }
      return {
        ok: false,
        error:
          'Connected to spreadsheet but the Users tab returned no columns. Ensure the "Users" tab exists with header columns: UserId, Name, Username, Password, Role, Status, CreatedAt.',
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err.message || 'Connection test failed',
      };
    }
  }
}
