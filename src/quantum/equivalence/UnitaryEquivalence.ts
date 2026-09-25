import { CircuitModel } from '../../types/quantum';
import { Complex } from '../ComplexNumber';
import { QuantumCircuitSimulator } from '../QuantumCircuitSimulator';

export interface UnitaryEquivalenceResult {
  isEquivalent: boolean;
  fidelity: number;
  globalPhaseAngle?: number; // In radians
  details: string;
  hasMeasurements: boolean;
}

export class UnitaryEquivalence {
  /**
   * Reconstructs the complete 2^N x 2^N unitary matrix of a circuit by evolving each standard basis vector.
   */
  static getUnitaryMatrix(circuit: CircuitModel): Complex[][] {
    const n = circuit.numQubits;
    const dim = 1 << n;
    const unitary: Complex[][] = [];

    // Initialize 2^N x 2^N grid
    for (let r = 0; r < dim; r++) {
      unitary.push(new Array(dim).fill(Complex.ZERO));
    }

    // Filter out measurement gates to extract pure unitary evolution
    const unitaryCircuit: CircuitModel = {
      ...circuit,
      operations: circuit.operations.filter((op) => op.gate !== 'M'),
    };

    for (let col = 0; col < dim; col++) {
      // Set initial values corresponding to computational basis state |col>
      const initialValues: (0 | 1)[] = [];
      for (let q = 0; q < n; q++) {
        const bitPos = n - 1 - q;
        const bit = ((col >> bitPos) & 1) as 0 | 1;
        initialValues.push(bit);
      }

      const colCircuit: CircuitModel = {
        ...unitaryCircuit,
        qubits: unitaryCircuit.qubits.map((q, idx) => ({
          ...q,
          initialValue: initialValues[idx],
        })),
      };

      const sim = QuantumCircuitSimulator.simulate(colCircuit, 1);
      for (let row = 0; row < dim; row++) {
        unitary[row][col] = sim.stateVector[row];
      }
    }

    return unitary;
  }

  /**
   * Evaluates formal unitary equivalence up to an arbitrary global phase factor e^(i * phi).
   * Metric: |Tr(U_student† * U_ref)| / 2^n == 1.0 within tolerance.
   */
  static compare(
    studentCircuit: CircuitModel,
    referenceCircuit: CircuitModel,
    tolerance: number = 1e-4
  ): UnitaryEquivalenceResult {
    const hasMeasurements =
      studentCircuit.operations.some((op) => op.gate === 'M') ||
      referenceCircuit.operations.some((op) => op.gate === 'M');

    if (studentCircuit.numQubits !== referenceCircuit.numQubits) {
      return {
        isEquivalent: false,
        fidelity: 0,
        details: `Qubit count mismatch: student circuit has ${studentCircuit.numQubits}, reference circuit has ${referenceCircuit.numQubits}.`,
        hasMeasurements,
      };
    }

    const n = studentCircuit.numQubits;
    if (n > 6) {
      // For large circuits, fall back to randomized state evolution check
      return {
        isEquivalent: false,
        fidelity: 0,
        details: `Circuit too large (${n} qubits) for full 2^${n} unitary matrix computation. Use probability equivalence.`,
        hasMeasurements,
      };
    }

    const dim = 1 << n;
    const uStudent = this.getUnitaryMatrix(studentCircuit);
    const uRef = this.getUnitaryMatrix(referenceCircuit);

    // Compute Trace(U_student† * U_ref) = sum_{r, c} (U_student[r][c])* * U_ref[r][c]
    let traceSum = Complex.ZERO;
    for (let r = 0; r < dim; r++) {
      for (let c = 0; c < dim; c++) {
        const uS_conj = uStudent[r][c].conjugate();
        const uR = uRef[r][c];
        traceSum = traceSum.add(uS_conj.mul(uR));
      }
    }

    // Normalized fidelity = |Tr(U_student† U_ref)| / dim
    const normalizedOverlap = traceSum.magnitude() / dim;
    const globalPhaseAngle = traceSum.phase();
    const isEquivalent = Math.abs(1.0 - normalizedOverlap) <= tolerance;

    return {
      isEquivalent,
      fidelity: Math.min(1.0, normalizedOverlap),
      globalPhaseAngle,
      hasMeasurements,
      details: isEquivalent
        ? `Circuits are formally unitary equivalent (Fidelity: ${(normalizedOverlap * 100).toFixed(3)}%, Global phase offset: ${(globalPhaseAngle * (180 / Math.PI)).toFixed(1)}°).`
        : `Circuits produce distinct unitary transformations (Fidelity: ${(normalizedOverlap * 100).toFixed(3)}%, below threshold ${(100 - tolerance * 100).toFixed(1)}%).`,
    };
  }
}
