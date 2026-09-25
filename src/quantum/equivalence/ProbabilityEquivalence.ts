import { CircuitModel } from '../../types/quantum';
import { QuantumCircuitSimulator } from '../QuantumCircuitSimulator';

export interface ProbabilityEquivalenceResult {
  isEquivalent: boolean;
  maxDifference: number;
  meanDifference: number;
  studentProbabilities: Record<string, number>;
  referenceProbabilities: Record<string, number>;
  details: string;
}

export class ProbabilityEquivalence {
  /**
   * Compares the output probability distributions of two circuits across all computational basis states.
   * Behavioral equivalence evaluation.
   */
  static compare(
    studentCircuit: CircuitModel,
    referenceCircuit: CircuitModel,
    tolerance: number = 0.05
  ): ProbabilityEquivalenceResult {
    if (studentCircuit.numQubits !== referenceCircuit.numQubits) {
      return {
        isEquivalent: false,
        maxDifference: 1.0,
        meanDifference: 1.0,
        studentProbabilities: {},
        referenceProbabilities: {},
        details: `Qubit count mismatch: student has ${studentCircuit.numQubits}, reference has ${referenceCircuit.numQubits}.`,
      };
    }

    const studentSim = QuantumCircuitSimulator.simulate(studentCircuit, 2048);
    const refSim = QuantumCircuitSimulator.simulate(referenceCircuit, 2048);

    const numStates = 1 << studentCircuit.numQubits;
    let maxDiff = 0;
    let sumDiff = 0;

    for (let i = 0; i < numStates; i++) {
      const bitStr = i.toString(2).padStart(studentCircuit.numQubits, '0');
      const pStudent = studentSim.probabilities[bitStr] || 0;
      const pRef = refSim.probabilities[bitStr] || 0;
      const diff = Math.abs(pStudent - pRef);

      if (diff > maxDiff) maxDiff = diff;
      sumDiff += diff;
    }

    const meanDiff = sumDiff / numStates;
    const isEquivalent = maxDiff <= tolerance;

    return {
      isEquivalent,
      maxDifference: maxDiff,
      meanDifference: meanDiff,
      studentProbabilities: studentSim.probabilities,
      referenceProbabilities: refSim.probabilities,
      details: isEquivalent
        ? `Probabilities match reference within tolerance (Max diff: ${(maxDiff * 100).toFixed(2)}% <= ${(tolerance * 100).toFixed(1)}%).`
        : `Probability discrepancy detected! Max deviation is ${(maxDiff * 100).toFixed(2)}% (allowed: ${(tolerance * 100).toFixed(1)}%).`,
    };
  }
}
