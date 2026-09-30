import { UsersSheetService, SheetUserRow } from '../auth/usersSheetService';
import { logger } from '../logger';

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
  private static getStoredSpreadsheetId(): string {
    const fromStorage =
      typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SHEETS_ID) : null;
    if (fromStorage && fromStorage.trim().length > 5) {
      return fromStorage.trim();
    }
    const fromEnv =
      typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GOOGLE_SHEETS_ID as string) : '';
    if (fromEnv && fromEnv.trim().length > 5) {
      return fromEnv.trim();
    }
    return '1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U';
  }

  private static getStoredAppsScriptUrl(): string {
    const fromEnv =
      typeof import.meta !== 'undefined'
        ? (import.meta.env?.VITE_GOOGLE_APPS_SCRIPT_URL as string)
        : '';
    if (fromEnv && fromEnv.trim().length > 5) {
      return fromEnv.trim();
    }
    const fromStorage =
      typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.APPS_SCRIPT_URL) : null;
    if (fromStorage && fromStorage.trim().length > 5) {
      return fromStorage.trim();
    }
    return 'https://script.google.com/macros/s/AKfycbwvKXR90qNvHimyJPT1eddrT296sXP9cUfrrviA0xj8g5p3y8Bgsi6Owmgv4T7rwohU/exec';
  }

  private static sheetsId: string = GoogleSheetsService.getStoredSpreadsheetId();
  private static appsScriptUrl: string = GoogleSheetsService.getStoredAppsScriptUrl();

  private static accessToken: string =
    (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_ACCESS_TOKEN) ||
    '';

  private static apiKey: string =
    (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEYS.API_KEY)) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_API_KEY) ||
    '';

  static isConfigured(): boolean {
    return Boolean(this.getSpreadsheetId() && this.getSpreadsheetId().trim().length > 5);
  }

  static hasLiveConnection(): boolean {
    const scriptUrl = this.getAppsScriptUrl();
    const token = this.getAccessToken();
    return Boolean(
      this.isConfigured() &&
        ((scriptUrl && scriptUrl.trim().length > 10) || (token && token.trim().length > 10))
    );
  }

  static getSpreadsheetId(): string {
    if (!this.sheetsId || this.sheetsId.trim().length < 5) {
      this.sheetsId = this.getStoredSpreadsheetId();
    }
    return this.sheetsId;
  }

  static setSpreadsheetId(id: string): void {
    this.sheetsId = id.trim();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SHEETS_ID, this.sheetsId);
    }
  }

  static getAppsScriptUrl(): string {
    if (!this.appsScriptUrl || this.appsScriptUrl.trim().length < 5) {
      this.appsScriptUrl = this.getStoredAppsScriptUrl();
    }
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
   * Registers a new user directly through the Google Apps Script Web App.
   *
   * Flow:
   * 1. Posts registration payload to the Apps Script Web App URL.
   * 2. The Apps Script opens the Google Sheet (ID: 1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U),
   *    accesses the "Users" tab, checks for duplicate username.
   * 3. If duplicate exists, Apps Script returns: { status: 'error', error: 'User already exists' }
   * 4. If not, Apps Script generates the next UserId (e.g. U004), appends the new row:
   *    [nextUserId, name, username, password, 'STUDENT', 'Active', today]
   * 5. Returns confirmed user record to Qubify.
   */
  static async registerUserViaAppsScript(params: {
    username: string;
    password: string;
    name?: string;
  }): Promise<SheetUserRow> {
    const appsScriptUrl = this.getAppsScriptUrl();
    if (!appsScriptUrl || appsScriptUrl.trim().length < 10) {
      logger.error('Registration', 'Google Apps Script Web App URL is not configured');
      throw new Error(
        'Google Apps Script Web App URL is not configured. Please set VITE_GOOGLE_APPS_SCRIPT_URL.'
      );
    }

    const username = params.username.trim();
    const password = params.password;

    logger.info('Registration', `Apps Script request started for username: ${username}`);

    const browserOrigin =
      typeof window !== 'undefined' && window.location && window.location.origin
        ? window.location.origin
        : 'unknown';

    // Sanitize URL for logging: never expose sensitive tokens, passwords or secrets
    const sanitizedUrl = appsScriptUrl.replace(
      /([?&](?:password|token|key|secret|auth)=)[^&]*/gi,
      '$1[REDACTED]'
    );

    let res: Response | null = null;

    try {
      res = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });
    } catch (networkErr: any) {
      const errName = networkErr?.name || 'Error';
      const errMsg = networkErr?.message || String(networkErr);
      const errStack = networkErr?.stack
        ? ` | ErrorStack: ${networkErr.stack.replace(/\r?\n/g, ' -> ')}`
        : '';

      logger.error(
        'Registration',
        `Apps Script request failed | ErrorName: ${errName} | ErrorMessage: ${errMsg} | RequestURL: ${sanitizedUrl} | BrowserOrigin: ${browserOrigin} | ResponseStatus: None | ResponseBody: None${errStack}`
      );
      throw new Error('Unable to create account. Please try again.');
    }

    // Response object was received from server
    const httpStatus = res.status;
    const httpStatusText = res.statusText || 'N/A';

    let rawText = '';
    try {
      rawText = await res.text();
    } catch (readErr: any) {
      logger.error(
        'Registration',
        `Apps Script request failed reading response body | ErrorName: ${readErr?.name || 'Error'} | ErrorMessage: ${readErr?.message || 'Failed to read response body'} | RequestURL: ${sanitizedUrl} | BrowserOrigin: ${browserOrigin} | ResponseStatus: ${httpStatus} ${httpStatusText} | ResponseBody: None`
      );
      throw new Error('Unable to create account. Please try again.');
    }

    // Sanitize response body: ensure passwords and tokens are never logged
    const sanitizedBody = rawText
      .replace(/password[:=]\s*["']?[^"'\s,;]+["']?/gi, 'password: [REDACTED]')
      .replace(/confirmPassword[:=]\s*["']?[^"'\s,;]+["']?/gi, 'confirmPassword: [REDACTED]')
      .replace(/ya29\.[a-zA-Z0-9_-]+/g, '[REDACTED_TOKEN]')
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]')
      .slice(0, 1000);

    if (!res.ok) {
      logger.error(
        'Registration',
        `Apps Script request failed with HTTP ${httpStatus} ${httpStatusText} | ErrorName: HTTPError | ErrorMessage: HTTP ${httpStatus} ${httpStatusText} | RequestURL: ${sanitizedUrl} | BrowserOrigin: ${browserOrigin} | ResponseStatus: ${httpStatus} | ResponseBody: ${sanitizedBody || '[empty]'}`
      );
      throw new Error('Unable to create account. Please try again.');
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr: any) {
      const errName = parseErr?.name || 'SyntaxError';
      const errMsg = parseErr?.message || 'Invalid JSON';
      const errStack = parseErr?.stack
        ? ` | ErrorStack: ${parseErr.stack.replace(/\r?\n/g, ' -> ')}`
        : '';

      logger.error(
        'Registration',
        `Apps Script request failed: Invalid JSON response | ErrorName: ${errName} | ErrorMessage: ${errMsg} | RequestURL: ${sanitizedUrl} | BrowserOrigin: ${browserOrigin} | ResponseStatus: ${httpStatus} | ResponseBody: ${sanitizedBody || '[empty]'}${errStack}`
      );
      throw new Error('Unable to create account. Please try again.');
    }

    // 1. When username already exists, it returns:
    // { "success": false, "message": "User already exists" }
    if (
      (data.success === false &&
        (data.message === 'User already exists' || data.error === 'User already exists')) ||
      data.error === 'User already exists' ||
      data.message === 'User already exists' ||
      (data.status === 'error' &&
        String(data.message || data.error).toLowerCase().includes('already exists'))
    ) {
      logger.warning('Registration', `Duplicate username: ${username}`);
      throw new Error('User already exists');
    }

    // 2. When there is another error, show the returned error message
    if (data.success === false || data.status === 'error') {
      const errorMsg = data.message || data.error || 'Unable to create account. Please try again.';
      logger.error(
        'Registration',
        `Apps Script request returned failure | ErrorName: AppsScriptError | ErrorMessage: ${errorMsg} | RequestURL: ${sanitizedUrl} | BrowserOrigin: ${browserOrigin} | ResponseStatus: ${httpStatus} | ResponseBody: ${sanitizedBody || '[empty]'}`
      );
      throw new Error(errorMsg);
    }

    // 3. When registration succeeds, Google Apps Script returns:
    // { "success": true, "message": "Account created successfully", "userId": "U004" }
    if (data.success !== true && data.status !== 'success') {
      logger.error(
        'Registration',
        `Google Sheet write failed: ${data.message || 'Unknown response'} | ErrorName: WriteError | ErrorMessage: ${data.message || 'Unknown response'} | RequestURL: ${sanitizedUrl} | BrowserOrigin: ${browserOrigin} | ResponseStatus: ${httpStatus} | ResponseBody: ${sanitizedBody || '[empty]'}`
      );
      throw new Error(data.message || 'Unable to create account. Please try again.');
    }

    // Apps Script confirmed write success to the Users sheet
    const userData = data.user || {};
    const assignedUserId = data.userId || userData.userId || 'U004';
    const confirmedUser: SheetUserRow = {
      userId: assignedUserId,
      name: userData.name || params.name || username,
      username: userData.username || username,
      password: password,
      role: 'STUDENT',
      status: 'Active',
      createdAt: userData.createdAt || new Date().toISOString().split('T')[0],
    };

    logger.success(
      'Registration',
      `Apps Script request successful - Google Sheet write successful for user ${confirmedUser.userId}`
    );

    return confirmedUser;
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
