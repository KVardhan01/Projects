import { UserRole, UserProfile } from '../../types/user';

export interface SheetUserRow {
  userId: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

const STORAGE_USERS_KEY = 'qubify_sheets_users_v2';
const STORAGE_SESSION_KEY = 'qubify_active_session_v2';

export class UsersSheetService {
  /**
   * Default development accounts defined in the Users sheet requirement:
   * U001 | Maya | maya | maya123 | STUDENT | Active
   * U002 | Instructor | instructor | instructor123 | INSTRUCTOR | Active
   * U003 | Admin | admin | admin123 | ADMIN | Active
   */
  private static initialDevUsers: SheetUserRow[] = [
    {
      userId: 'U001',
      name: 'Maya',
      username: 'maya',
      password: 'maya123',
      role: 'STUDENT',
      status: 'Active',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      userId: 'U002',
      name: 'Instructor',
      username: 'instructor',
      password: 'instructor123',
      role: 'INSTRUCTOR',
      status: 'Active',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      userId: 'U003',
      name: 'Admin',
      username: 'admin',
      password: 'admin123',
      role: 'ADMIN',
      status: 'Active',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
  ];

  /**
   * Reads all Users from the Users table, ensuring the required test users exist
   * without creating duplicates.
   */
  static getUsers(): SheetUserRow[] {
    try {
      const raw = localStorage.getItem(STORAGE_USERS_KEY);
      let users: SheetUserRow[] = raw ? JSON.parse(raw) : [];

      let modified = false;
      for (const devUser of this.initialDevUsers) {
        const exists = users.some(
          (u) =>
            u.userId.toLowerCase() === devUser.userId.toLowerCase() ||
            u.username.toLowerCase() === devUser.username.toLowerCase()
        );
        if (!exists) {
          users.push({ ...devUser });
          modified = true;
        }
      }

      if (modified || !raw) {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
      }

      return users;
    } catch {
      return [...this.initialDevUsers];
    }
  }

  /**
   * Generates a new unique UserId following the U001, U002, U003... convention.
   */
  static generateNextUserId(): string {
    const users = this.getUsers();
    let maxNum = 0;
    for (const u of users) {
      const match = u.userId.match(/^U(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `U${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Case-insensitive check whether a username exists in the Users sheet.
   */
  static usernameExists(usernameInput: string): boolean {
    const clean = usernameInput.trim().toLowerCase();
    if (!clean) return false;
    const users = this.getUsers();
    return users.some((u) => u.username.trim().toLowerCase() === clean);
  }

  /**
   * Registers a new user into the Users Google Sheet integration.
   *
   * Username requirements:
   * - Normal free-text username. NO conditions on length, casing, numbers, or special chars.
   * - ONLY validation: Check whether username already exists (case-insensitive).
   *
   * Password requirements:
   * 1. Minimum 8 characters ("Password must be at least 8 characters")
   * 2. At least one uppercase letter ("Password must contain at least one uppercase letter")
   * 3. At least one lowercase letter ("Password must contain at least one lowercase letter")
   * 4. At least one number ("Password must contain at least one number")
   * 5. At least one special character ("Password must contain at least one special character")
   *
   * Confirm password:
   * - Must exactly match Password ("Confirm password is different")
   *
   * Validation Order:
   * 1. Check Username is entered -> "Username is required"
   * 2. Check whether username already exists -> "User already exists"
   * 3. Validate Password (min 8 chars, uppercase, lowercase, number, special char)
   * 4. Validate Confirm Password (entered -> match)
   * 5. Only if ALL pass -> Create new user with role 'STUDENT' and status 'Active'
   */
  static async registerUser(params: {
    username: string;
    password: string;
    confirmPassword?: string;
    name?: string;
  }): Promise<SheetUserRow> {
    const rawUsername = params.username ?? '';
    const cleanUsername = rawUsername.trim();
    const rawPassword = params.password ?? '';
    const rawConfirm = params.confirmPassword ?? '';

    // 1. Check Username is entered
    if (!cleanUsername) {
      throw new Error('Username is required');
    }

    // 2. Check whether the username already exists (case-insensitive)
    if (this.usernameExists(cleanUsername)) {
      throw new Error('User already exists');
    }

    // 3. Validate Password
    if (!rawPassword) {
      throw new Error('Password is required');
    }
    if (rawPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(rawPassword)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(rawPassword)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(rawPassword)) {
      throw new Error('Password must contain at least one number');
    }
    // Special character check: any character that is not a letter, digit, or whitespace
    if (!/[^A-Za-z0-9\s]/.test(rawPassword)) {
      throw new Error('Password must contain at least one special character');
    }

    // 4. Validate Confirm Password
    if (params.confirmPassword !== undefined) {
      if (!rawConfirm) {
        throw new Error('Confirm password is required');
      }
      if (rawPassword !== rawConfirm) {
        throw new Error('Confirm password is different');
      }
    }

    try {
      const nextUserId = this.generateNextUserId();
      const newRow: SheetUserRow = {
        userId: nextUserId,
        name: params.name?.trim() || cleanUsername,
        username: cleanUsername,
        password: rawPassword,
        role: 'STUDENT',
        status: 'Active',
        createdAt: new Date().toISOString(),
      };

      // Save user to Users sheet storage
      this.saveUser(newRow);

      return newRow;
    } catch (e: any) {
      throw new Error('Unable to create account. Please try again.');
    }
  }

  /**
   * Save or update a user record in the Users table.
   */
  static saveUser(user: SheetUserRow): void {
    try {
      const users = this.getUsers();
      const idx = users.findIndex(
        (u) =>
          u.userId.toLowerCase() === user.userId.toLowerCase() ||
          u.username.toLowerCase() === user.username.toLowerCase()
      );
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...user };
      } else {
        users.push(user);
      }
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save user to Users table:', e);
    }
  }

  /**
   * Authenticates user against the Users sheet table columns:
   * UserId | Name | Username | Password | Role | Status | CreatedAt
   */
  static async authenticate(
    usernameInput: string,
    passwordInput: string
  ): Promise<UserProfile> {
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      throw new Error('Please enter both username and password.');
    }

    const users = this.getUsers();

    // 1. Find the matching user in the Users sheet
    const matching = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUser ||
        (u.userId && u.userId.toLowerCase() === cleanUser)
    );

    if (!matching) {
      throw new Error('Invalid username or password.');
    }

    // 2. Verify the username and password
    if (matching.password !== cleanPass) {
      throw new Error('Invalid username or password.');
    }

    // 3. Check Status
    if (matching.status !== 'Active') {
      throw new Error('Your Qubify account is inactive. Please contact the administrator.');
    }

    // 4. Read the Role column and return profile
    const role: UserRole =
      matching.role === 'ADMIN'
        ? 'ADMIN'
        : matching.role === 'INSTRUCTOR'
        ? 'INSTRUCTOR'
        : 'STUDENT';

    const profile: UserProfile = {
      id: matching.userId,
      username: matching.username,
      name: matching.name,
      email: `${matching.username}@qubify.edu`,
      photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        matching.name
      )}&background=0891b2&color=fff`,
      role,
      status: matching.status,
      xp: 0,
      streak: 0,
      confidence: 0,
      weeklyGoal: 0,
      weeklyGoalProgress: 0,
      currentCourseId: 'quantum-computing-mastery',
      currentModuleId: 'mod-foundations',
      currentLessonId: 'lesson-1-what-is-qubit',
      createdAt: matching.createdAt,
      lastLoginAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      isActive: true,
    };

    // Store active session
    this.setCurrentSession(profile);

    return profile;
  }

  /**
   * Retrieves active authenticated user session if present.
   */
  static getCurrentSession(): UserProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      if (!raw) return null;
      const user: UserProfile = JSON.parse(raw);
      if (!user || !user.id || !user.role || !user.isActive) {
        this.clearSession();
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Sets current active user session.
   */
  static setCurrentSession(user: UserProfile | null): void {
    try {
      if (!user) {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      } else {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
      }
    } catch {
      // ignore
    }
  }

  /**
   * Clears active session upon logout.
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      localStorage.removeItem('qll_current_user_v1');
    } catch {
      // ignore
    }
  }
}
