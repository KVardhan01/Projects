import { CircuitModel, GateType } from './quantum';

export type ExerciseType =
  | 'probabilistic'
  | 'construction'
  | 'equivalence'
  | 'optimization'
  | 'unknown_gate'
  | 'qiskit_code'
  | 'bell_state'
  | 'grover'
  | 'qft'
  | 'measurement'
  | 'state_vector'
  | 'gate_identification';

export interface Exercise {
  id: string;
  lessonId?: string;
  title: string;
  description: string;
  type: ExerciseType;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  numQubits: number;
  numMoments: number;
  allowedGates: GateType[];
  initialState?: (0 | 1)[];
  editableQubits?: number[];
  initialCircuit?: CircuitModel;
  modelCircuit: CircuitModel;
  expectedBehavior: string;
  tolerance: number; // e.g. 0.05
  points: number;
  hints: string[];
  feedback: string;
  attemptLimit?: number;
  isPublished: boolean;
  unknownGateMatrix?: number[][]; // For unknown gate exploration
}

export interface CircuitAttempt {
  id: string;
  userId: string;
  exerciseId: string;
  circuitJson: string;
  code: string;
  resultJson: string;
  score: number;
  attemptNumber: number;
  completionStatus: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  hintsUsedCount: number;
  unitaryFidelity?: number;
  feedbackGiven: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  type: 'multiple_choice' | 'true_false' | 'probability' | 'circuit_reading';
}

export interface Quiz {
  id: string;
  lessonId?: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  points: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  answers: Record<string, number>;
  score: number;
  maxScore: number;
  attemptNumber: number;
  createdAt: string;
}
