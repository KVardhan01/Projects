import { GoogleAuthService } from './googleAuth';

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

  private static async getAuthHeader(): Promise<{ Authorization: string }> {
    const token = await GoogleAuthService.requestAccessToken();
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Reads all rows from a spreadsheet tab. Returns headers and data array.
   */
  static async readSheet(
    tabName: SheetTabName | string
  ): Promise<{ headers: string[]; rows: string[][] }> {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets ID is not configured.');
    }

    const headers = await this.getAuthHeader();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetsId}/values/${encodeURIComponent(
      tabName
    )}!A1:ZZ5000`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Failed to read sheet tab "${tabName}".`);
    }

    const data = await res.json();
    const values: string[][] = data.values || [];

    if (values.length === 0) {
      return { headers: [], rows: [] };
    }

    const [headerRow, ...dataRows] = values;
    return { headers: headerRow, rows: dataRows };
  }

  /**
   * Appends a single row to a spreadsheet tab.
   */
  static async appendRow(
    tabName: SheetTabName | string,
    row: (string | number | boolean | null)[]
  ): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets ID is not configured.');
    }

    const headers = await this.getAuthHeader();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetsId}/values/${encodeURIComponent(
      tabName
    )}!A1:append?valueInputOption=USER_ENTERED`;

    const serializedRow = row.map((val) => (val === null || val === undefined ? '' : String(val)));

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [serializedRow],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Failed to append row to "${tabName}".`);
    }

    return await res.json();
  }

  /**
   * Updates an existing row (1-indexed based on Google Sheets row number).
   */
  static async updateRow(
    tabName: SheetTabName | string,
    rowNumber: number,
    row: (string | number | boolean | null)[]
  ): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets ID is not configured.');
    }

    const headers = await this.getAuthHeader();
    const range = `${tabName}!A${rowNumber}:ZZ${rowNumber}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetsId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`;

    const serializedRow = row.map((val) => (val === null || val === undefined ? '' : String(val)));

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [serializedRow],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Failed to update row ${rowNumber} in "${tabName}".`);
    }

    return await res.json();
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
        return { rowIndex: i + 2, row: rows[i] }; // row 1 is header
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
   * Updates a single cell (e.g. "B5").
   */
  static async updateCell(
    tabName: SheetTabName | string,
    cell: string,
    value: any
  ): Promise<any> {
    const headers = await this.getAuthHeader();
    const range = `${tabName}!${cell}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetsId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [[String(value)]],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Failed to update cell ${cell}.`);
    }

    return await res.json();
  }

  /**
   * Validates if spreadsheet exists and user has write permissions.
   */
  static async testConnection(): Promise<{ ok: boolean; title?: string; error?: string }> {
    try {
      const headers = await this.getAuthHeader();
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetsId}?fields=properties.title`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const err = await res.json();
        return { ok: false, error: err.error?.message || 'Access denied to spreadsheet.' };
      }
      const data = await res.json();
      return { ok: true, title: data.properties?.title || 'Connected Sheet' };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Unknown network error' };
    }
  }
}
