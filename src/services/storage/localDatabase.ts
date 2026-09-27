import { UserProfile } from '../../types/user';
import { CircuitModel } from '../../types/quantum';
import { CircuitAttempt, QuizAttempt, Exercise } from '../../types/exercise';
import { LearningProgress, LearningActivity, UserAchievement } from '../../types/progress';
import { FeedbackItem, AIMessage } from '../../types/ai';
import { INITIAL_LESSONS } from '../../data/initialCurriculum';
import { INITIAL_EXERCISES } from '../../data/initialExercises';

const STORAGE_KEYS = {
  USERS: 'qll_users_v1',
  CURRENT_USER: 'qll_current_user_v1',
  CIRCUITS: 'qll_circuits_v1',
  PROGRESS: 'qll_progress_v1',
  ACTIVITIES: 'qll_activities_v1',
  ATTEMPTS: 'qll_attempts_v1',
  QUIZ_ATTEMPTS: 'qll_quiz_attempts_v1',
  USER_ACHIEVEMENTS: 'qll_user_achievements_v1',
  FEEDBACK: 'qll_feedback_v1',
  AI_CHAT: 'qll_ai_chat_v1',
  CUSTOM_EXERCISES: 'qll_custom_exercises_v1',
};

export class LocalDatabase {
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage quota or write error:', e);
    }
  }

  static purgeLegacyDemoData(): void {
    try {
      localStorage.removeItem('qll_demo_role');
      localStorage.removeItem('qubify_demo_mode');
      localStorage.removeItem('qubify_role');
      localStorage.removeItem('demo_role');
      localStorage.removeItem('qll_users_v1');
      localStorage.removeItem('qll_demo_user');
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch {
      // ignore
    }
  }

  // --- Users (Source of truth is Google Sheets Users tab) ---
  static getUsers(): UserProfile[] {
    return this.getItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
  }

  static findUserByEmailOrId(query: string): UserProfile | null {
    const clean = query.trim().toLowerCase();
    const users = this.getUsers();
    return (
      users.find(
        (u) =>
          u.email.toLowerCase() === clean ||
          u.googleId.toLowerCase() === clean ||
          u.id.toLowerCase() === clean
      ) || null
    );
  }

  static saveUser(user: UserProfile): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id || u.googleId === user.googleId || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.setItem(STORAGE_KEYS.USERS, users);
    const currentUser = this.getCurrentUser();
    if (currentUser && (currentUser.id === user.id || currentUser.email.toLowerCase() === user.email.toLowerCase())) {
      this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    }
  }

  static getCurrentUser(): UserProfile | null {
    const user = this.getItem<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!user) return null;
    // Reject any fake demo user, inactive user, or user without email
    if (
      !user.email ||
      !user.isActive ||
      user.id?.toLowerCase().includes('alex') ||
      user.id?.toLowerCase().includes('demo') ||
      user.email?.toLowerCase().includes('example.edu') ||
      user.email?.toLowerCase().includes('quantumlab') ||
      user.name?.toLowerCase().includes('alex') ||
      user.name?.toLowerCase().includes('demo') ||
      user.name?.toLowerCase().includes('sterling') ||
      user.name?.toLowerCase().includes('marcus') ||
      user.name?.toLowerCase().includes('vance') ||
      user.name?.toLowerCase().includes('professor')
    ) {
      this.setCurrentUser(null);
      return null;
    }
    return user;
  }

  static setCurrentUser(user: UserProfile | null): void {
    if (user === null) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    }
  }

  // --- Circuits ---
  static getCircuits(userId?: string): CircuitModel[] {
    const circuits = this.getItem<CircuitModel[]>(STORAGE_KEYS.CIRCUITS, [
      {
        id: 'circuit-bell-default',
        name: 'Bell State |Φ+⟩',
        description: 'Canonical entangled pair prepared with H and CNOT.',
        numQubits: 2,
        numMoments: 3,
        qubits: [
          { index: 0, name: 'q0', initialValue: 0 },
          { index: 1, name: 'q1', initialValue: 0 },
        ],
        operations: [
          { id: 'op1', gate: 'H', targets: [0], controls: [], moment: 0 },
          { id: 'op2', gate: 'CX', targets: [1], controls: [0], moment: 1 },
        ],
      },
      {
        id: 'circuit-ghz-default',
        name: '3-Qubit GHZ State',
        description: 'Greenberger-Horne-Zeilinger tri-partite entanglement: (|000⟩ + |111⟩)/√2.',
        numQubits: 3,
        numMoments: 4,
        qubits: [
          { index: 0, name: 'q0', initialValue: 0 },
          { index: 1, name: 'q1', initialValue: 0 },
          { index: 2, name: 'q2', initialValue: 0 },
        ],
        operations: [
          { id: 'ghz_h', gate: 'H', targets: [0], controls: [], moment: 0 },
          { id: 'ghz_cx1', gate: 'CX', targets: [1], controls: [0], moment: 1 },
          { id: 'ghz_cx2', gate: 'CX', targets: [2], controls: [1], moment: 2 },
        ],
      },
    ]);
    return circuits;
  }

  static saveCircuit(circuit: CircuitModel): void {
    const circuits = this.getCircuits();
    const idx = circuits.findIndex((c) => c.id === circuit.id);
    if (idx >= 0) {
      circuits[idx] = { ...circuit, updatedAt: new Date().toISOString() };
    } else {
      circuits.push({ ...circuit, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.setItem(STORAGE_KEYS.CIRCUITS, circuits);
  }

  static deleteCircuit(id: string): void {
    const circuits = this.getCircuits().filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.CIRCUITS, circuits);
  }

  // --- Progress ---
  static getProgress(userId: string): LearningProgress[] {
    const all = this.getItem<LearningProgress[]>(STORAGE_KEYS.PROGRESS, []);
    return all.filter((p) => p.userId === userId);
  }

  static updateLessonProgress(
    userId: string,
    lessonId: string,
    moduleId: string,
    status: 'IN_PROGRESS' | 'COMPLETED',
    progressPercent: number = 100
  ): void {
    const all = this.getItem<LearningProgress[]>(STORAGE_KEYS.PROGRESS, []);
    const idx = all.findIndex((p) => p.userId === userId && p.lessonId === lessonId);
    const now = new Date().toISOString();

    if (idx >= 0) {
      all[idx] = {
        ...all[idx],
        status,
        progressPercent,
        completedAt: status === 'COMPLETED' ? now : all[idx].completedAt,
        updatedAt: now,
      };
    } else {
      all.push({
        id: `prog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId,
        courseId: 'quantum-computing-mastery',
        moduleId,
        lessonId,
        status,
        progressPercent,
        completedAt: status === 'COMPLETED' ? now : undefined,
        updatedAt: now,
      });
    }
    this.setItem(STORAGE_KEYS.PROGRESS, all);
  }

  // --- Activities ---
  static getActivities(userId: string): LearningActivity[] {
    const all = this.getItem<LearningActivity[]>(STORAGE_KEYS.ACTIVITIES, []);
    return all
      .filter((a) => a.userId === userId && !a.id.startsWith('act-init-'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static logActivity(activity: Omit<LearningActivity, 'id' | 'createdAt'>): void {
    const all = this.getItem<LearningActivity[]>(STORAGE_KEYS.ACTIVITIES, []);
    const newAct: LearningActivity = {
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    all.unshift(newAct);
    // Keep last 150
    this.setItem(STORAGE_KEYS.ACTIVITIES, all.slice(0, 150));
  }

  // --- Attempts ---
  static getCircuitAttempts(filterId?: string): CircuitAttempt[] {
    const attempts = this.getItem<CircuitAttempt[]>(STORAGE_KEYS.ATTEMPTS, []);
    if (filterId) {
      return attempts.filter((a) => a.userId === filterId || a.exerciseId === filterId);
    }
    return attempts;
  }

  static saveCircuitAttempt(attempt: Omit<CircuitAttempt, 'id' | 'createdAt'>): CircuitAttempt {
    const attempts = this.getItem<CircuitAttempt[]>(STORAGE_KEYS.ATTEMPTS, []);
    const newAttempt: CircuitAttempt = {
      ...attempt,
      id: `att-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    attempts.unshift(newAttempt);
    this.setItem(STORAGE_KEYS.ATTEMPTS, attempts);
    return newAttempt;
  }

  // --- Quiz Attempts ---
  static getQuizAttempts(filterId?: string): QuizAttempt[] {
    const attempts = this.getItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
    if (filterId) {
      return attempts.filter((a) => a.userId === filterId || a.quizId === filterId);
    }
    return attempts;
  }

  static saveQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'createdAt'>): QuizAttempt {
    const attempts = this.getItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: `quiz-att-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    attempts.unshift(newAttempt);
    this.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, attempts);
    return newAttempt;
  }

  // --- Achievements ---
  static getUserAchievements(userId: string): UserAchievement[] {
    const all = this.getItem<UserAchievement[]>(STORAGE_KEYS.USER_ACHIEVEMENTS, []);
    return all.filter((ua) => ua.userId === userId && !['ua-1', 'ua-2', 'ua-3'].includes(ua.id));
  }

  static unlockAchievement(userId: string, achievementId: string): boolean {
    const all = this.getItem<UserAchievement[]>(STORAGE_KEYS.USER_ACHIEVEMENTS, []);
    if (all.some((ua) => ua.userId === userId && ua.achievementId === achievementId)) {
      return false; // already unlocked
    }
    all.push({
      id: `ua-${Date.now()}`,
      userId,
      achievementId,
      unlockedAt: new Date().toISOString(),
    });
    this.setItem(STORAGE_KEYS.USER_ACHIEVEMENTS, all);
    return true;
  }

  // --- Feedback ---
  static getFeedback(studentId: string): FeedbackItem[] {
    const all = this.getItem<FeedbackItem[]>(STORAGE_KEYS.FEEDBACK, []);
    return all.filter((f) => f.studentId === studentId && f.id !== 'fb-1');
  }

  static addFeedback(fb: Omit<FeedbackItem, 'id' | 'createdAt'>): void {
    const all = this.getItem<FeedbackItem[]>(STORAGE_KEYS.FEEDBACK, []);
    all.unshift({
      ...fb,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    this.setItem(STORAGE_KEYS.FEEDBACK, all);
  }

  // --- Custom Exercises created by Instructor ---
  static getCustomExercises(): Exercise[] {
    return this.getItem<Exercise[]>(STORAGE_KEYS.CUSTOM_EXERCISES, []);
  }

  static saveCustomExercise(ex: Exercise): void {
    const list = this.getCustomExercises();
    const idx = list.findIndex((e) => e.id === ex.id);
    if (idx >= 0) {
      list[idx] = ex;
    } else {
      list.push(ex);
    }
    this.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, list);
  }

  static getAllExercises(): Exercise[] {
    return [...INITIAL_EXERCISES, ...this.getCustomExercises()];
  }
}
