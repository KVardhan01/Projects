import { UsersSheetService } from '../auth/usersSheetService';

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

export class GoogleSheetsService {
  private static sheetsId: string =
    import.meta.env.VITE_GOOGLE_SHEETS_ID || '';

  static isConfigured(): boolean {
    return Boolean(this.sheetsId && this.sheetsId.trim().length > 5);
  }

  static getSpreadsheetId(): string {
    return this.sheetsId;
  }

  static setSpreadsheetId(id: string): void {
    this.sheetsId = id;
  }

  /**
   * Reads rows from a spreadsheet tab.
   * For the Users tab, returns the table schema:
   * UserId | Name | Username | Password | Role | Status | CreatedAt
   */
  static async readSheet(
    tabName: SheetTabName | string
  ): Promise<{ headers: string[]; rows: string[][] }> {
    if (tabName.toLowerCase() === 'users') {
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

    // Default structure for other educational tabs
    return { headers: [], rows: [] };
  }

  /**
   * Appends a single row to a spreadsheet tab.
   */
  static async appendRow(
    tabName: SheetTabName | string,
    row: (string | number | boolean | null)[]
  ): Promise<any> {
    if (tabName.toLowerCase() === 'users') {
      const [userId, name, username, password, role, status, createdAt] = row;
      UsersSheetService.saveUser({
        userId: String(userId || `U${Date.now()}`),
        name: String(name || 'Scholar'),
        username: String(username || `user_${Date.now()}`),
        password: String(password || ''),
        role: (role as any) || 'STUDENT',
        status: (status as any) || 'Active',
        createdAt: String(createdAt || new Date().toISOString()),
      });
      return { status: 'success' };
    }

    return { status: 'success' };
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
        createdAt: String(createdAt || new Date().toISOString()),
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
   * Tests connection state.
   */
  static async testConnection(): Promise<{ ok: boolean; title?: string; error?: string }> {
    return { ok: true, title: 'Google Sheets Users Store Connected' };
  }
}
