import { AIRecommendation } from '../../types/ai';
import { UserProfile } from '../../types/user';
import { CircuitAttempt, QuizAttempt } from '../../types/exercise';
import { LearningProgress } from '../../types/progress';

export class QuantumTutorService {
  /**
   * Generates dynamic, explainable recommendations using actual student performance data.
   */
  static generateRecommendations(
    user: UserProfile,
    progress: LearningProgress[],
    circuitAttempts: CircuitAttempt[],
    quizAttempts: QuizAttempt[]
  ): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];

    // Analyze failed attempts or high attempt count
    const cnotAttempts = circuitAttempts.filter((a) => a.exerciseId.includes('bell') || a.exerciseId.includes('cnot'));
    const failedCnot = cnotAttempts.filter((a) => a.completionStatus === 'FAILED' || a.score < 70);

    if (failedCnot.length >= 2) {
      recommendations.push({
        id: 'rec-cnot-review',
        title: 'Reinforce Multi-Qubit Controlled Gates',
        reason: `Recommended because you attempted the Bell State & CNOT challenges ${cnotAttempts.length} times with difficulty.`,
        actionType: 'lesson',
        targetId: 'lesson-15-cnot',
        targetName: '15. The CNOT Gate & Truth Table',
        urgency: 'high',
      });
    }

    // Check superposition mastery
    const hAttempts = circuitAttempts.filter((a) => a.exerciseId.includes('probabilistic'));
    const failedH = hAttempts.filter((a) => a.completionStatus === 'FAILED');
    if (failedH.length > 0) {
      recommendations.push({
        id: 'rec-superposition-lab',
        title: 'Master Quantum Superposition & Probabilities',
        reason: 'Recommended because of sampling variance discrepancies in your probabilistic gate attempts.',
        actionType: 'experiment',
        targetId: 'lesson-3-superposition',
        targetName: 'Superposition Lab & Hadamard Rotation',
        urgency: 'medium',
      });
    }

    // Progressive linear lesson recommendation based on actual completion
    const completedLessonIds = new Set(
      progress.filter((p) => p.status === 'COMPLETED').map((p) => p.lessonId)
    );

    if (completedLessonIds.size === 0) {
      recommendations.push({
        id: 'rec-qubit-intro',
        title: 'Begin Foundations: What is a Qubit?',
        reason: 'Welcome to Qubify! Start by exploring quantum states, Dirac notation, and superposition fundamentals.',
        actionType: 'lesson',
        targetId: 'lesson-1-what-is-qubit',
        targetName: '1. What is a Qubit?',
        urgency: 'high',
      });
      recommendations.push({
        id: 'rec-superposition-first',
        title: 'Explore Equal Superposition in Lab',
        reason: 'Put your first qubit in a 50/50 superposition state using the Hadamard (H) gate in the Circuit Lab.',
        actionType: 'experiment',
        targetId: 'superposition-demo',
        targetName: 'Hadamard Superposition Experiment',
        urgency: 'medium',
      });
    } else if (!completedLessonIds.has('lesson-18-bell-states') && completedLessonIds.size >= 5) {
      recommendations.push({
        id: 'rec-bell-state',
        title: 'Construct Entangled Bell State |Φ+⟩',
        reason: 'Key milestone: combine superposition and CNOT to create correlated Einstein-Podolsky-Rosen pairs.',
        actionType: 'experiment',
        targetId: 'lesson-18-bell-states',
        targetName: 'Bell State |Φ+⟩ Experiment',
        urgency: 'high',
      });
    } else if (!completedLessonIds.has('lesson-19-grover') && completedLessonIds.size >= 8) {
      recommendations.push({
        id: 'rec-grover-next',
        title: "Dive into Grover's Search Algorithm",
        reason: 'You have mastered two-qubit entanglement; next step is quadratic speedup via amplitude amplification.',
        actionType: 'lesson',
        targetId: 'lesson-19-grover',
        targetName: "19. Grover's Algorithm",
        urgency: 'medium',
      });
    } else {
      recommendations.push({
        id: 'rec-curriculum-next',
        title: 'Continue Along the Learning Path',
        reason: 'Advance your quantum intuition through structured lesson modules and progressive interactive challenges.',
        actionType: 'lesson',
        targetId: 'lesson-1-what-is-qubit',
        targetName: 'Next Curriculum Module',
        urgency: 'medium',
      });
    }

    // Low confidence recommendation (only when assessments have actually occurred)
    if (user.confidence > 0 && user.confidence < 70) {
      recommendations.push({
        id: 'rec-boost-confidence',
        title: 'Review Single-Qubit Pauli Rotations',
        reason: 'Confidence score is currently below 70%. Solidifying single-qubit intuition will accelerate multi-qubit mastery.',
        actionType: 'review',
        targetId: 'lesson-7-x-gate',
        targetName: '7. Pauli-X (Quantum NOT) Deep Dive',
        urgency: 'low',
      });
    }

    return recommendations.slice(0, 4);
  }

  /**
   * Computes dynamic confidence score (0-100) based on quiz performance, exercise success, and hint usage.
   * Returns 0 for a new student with no completed lessons or evaluations.
   */
  static calculateConfidence(
    circuitAttempts: CircuitAttempt[],
    quizAttempts: QuizAttempt[],
    completedLessonsCount: number
  ): number {
    if (circuitAttempts.length === 0 && quizAttempts.length === 0 && completedLessonsCount === 0) {
      return 0;
    }

    let score = 20;

    // Lesson completion factor (+2.5 per lesson, up to 35)
    score += Math.min(35, completedLessonsCount * 2.5);

    // Exercise success factor
    if (circuitAttempts.length > 0) {
      const successfulAttempts = circuitAttempts.filter((a) => a.completionStatus === 'SUCCESS').length;
      const passRate = successfulAttempts / circuitAttempts.length;
      score += (passRate - 0.5) * 25; // -12.5 to +12.5
    }

    // Quiz score factor
    if (quizAttempts.length > 0) {
      const avgQuizScore =
        quizAttempts.reduce((sum, q) => sum + (q.score / (q.maxScore || 100)), 0) /
        quizAttempts.length;
      score += (avgQuizScore - 0.5) * 20; // -10 to +10
    }

    return Math.max(0, Math.min(99, Math.round(score)));
  }
}
