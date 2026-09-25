import { CircuitModel } from './quantum';

export type LessonType =
  | 'theory'
  | 'interactive'
  | 'quiz'
  | 'exercise'
  | 'algorithm'
  | 'coding'
  | 'experiment';

export interface Course {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  category: string;
  order: number;
  estimatedMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  isPublished: boolean;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  content: string; // Markdown or rich educational text
  coreIdea: string;
  order: number;
  estimatedMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  lessonType: LessonType;
  initialCircuit?: CircuitModel;
  experimentGoal?: string;
  isPublished: boolean;
  exerciseId?: string;
  quizId?: string;
}
