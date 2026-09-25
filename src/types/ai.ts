import { CircuitModel, SimulationResult } from './quantum';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  codeSnippet?: string;
  suggestedAction?: {
    type: 'apply_circuit' | 'load_lesson' | 'try_exercise';
    payload: any;
    label: string;
  };
}

export interface AIContext {
  lessonTitle?: string;
  moduleTitle?: string;
  circuit?: CircuitModel;
  code?: string;
  simulation?: Partial<SimulationResult>;
  exerciseGoal?: string;
  studentLevel?: 'beginner' | 'intermediate' | 'advanced';
  recentMistakes?: string[];
}

export interface AIRecommendation {
  id: string;
  title: string;
  reason: string;
  actionType: 'lesson' | 'experiment' | 'exercise' | 'review';
  targetId: string;
  targetName: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface FeedbackItem {
  id: string;
  studentId: string;
  studentName?: string;
  instructorId: string;
  instructorName?: string;
  referenceType: 'lesson' | 'exercise' | 'circuit_attempt' | 'quiz_attempt';
  referenceId: string;
  referenceTitle: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}
