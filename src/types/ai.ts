import { CircuitModel, SimulationResult, NoiseSettings } from './quantum';

export type AIUserIntent =
  | 'error_diagnosis'
  | 'debug_circuit'
  | 'generate_circuit'
  | 'modify_circuit'
  | 'explain_circuit'
  | 'analyze_simulation'
  | 'concept_question';

export interface StructuredGate {
  type: string;
  qubits: number[];
  parameters?: any[];
}

export interface StructuredCircuitData {
  intent: AIUserIntent;
  action?: 'apply_to_visual_circuit' | 'explain_limitation' | 'none';
  request?: string;
  explanation?: string;
  qiskitCode?: string;
  qubits?: number;
  requiredQubits?: number;
  gates?: Array<StructuredGate | string>;
  noiseSettings?: Partial<NoiseSettings>;
  canModifyCurrentCircuit?: boolean;
  isSupportedBySimulator?: boolean;
  unsupportedReason?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  codeSnippet?: string;
  intent?: AIUserIntent;
  structuredData?: StructuredCircuitData;
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
  simulationError?: string;
  validationErrors?: string[];
  exerciseGoal?: string;
  studentLevel?: 'beginner' | 'intermediate' | 'advanced';
  recentMistakes?: string[];
  numClassicalBits?: number;
  gateDetails?: string;
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
