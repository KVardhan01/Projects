import { CircuitModel, CircuitOperation, SimulationResult, NoiseSettings, BlochVector } from '../types/quantum';
import { QuantumState } from './QuantumState';
import { QuantumGate } from './QuantumGate';
import { NoiseModel } from './NoiseModel';

export class QuantumCircuitSimulator {
  /**
   * Validates circuit operations and qubit configuration.
   */
  static validateCircuit(circuit: CircuitModel): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (circuit.numQubits < 1 || circuit.numQubits > 10) {
      errors.push(`Circuit qubit count (${circuit.numQubits}) must be between 1 and 10.`);
    }

    const occupiedSlots = new Set<string>();

    for (const op of circuit.operations) {
      for (const tgt of op.targets) {
        if (tgt < 0 || tgt >= circuit.numQubits) {
          errors.push(`Operation ${op.gate} has out-of-bounds target qubit ${tgt}.`);
        }
        const key = `${op.moment}-${tgt}`;
        if (occupiedSlots.has(key)) {
          errors.push(`Multiple gates placed on qubit ${tgt} at moment ${op.moment}.`);
        }
        occupiedSlots.add(key);
      }

      for (const ctrl of op.controls) {
        if (ctrl < 0 || ctrl >= circuit.numQubits) {
          errors.push(`Operation ${op.gate} has out-of-bounds control qubit ${ctrl}.`);
        }
        if (op.targets.includes(ctrl)) {
          errors.push(`Operation ${op.gate} cannot have the same qubit ${ctrl} as both control and target.`);
        }
        const key = `${op.moment}-${ctrl}`;
        if (occupiedSlots.has(key)) {
          errors.push(`Control node conflicts with another gate on qubit ${ctrl} at moment ${op.moment}.`);
        }
        occupiedSlots.add(key);
      }

      if (op.moment < 0) {
        errors.push(`Operation ${op.gate} has negative moment index: ${op.moment}.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Executes the circuit and returns the full simulation result.
   */
  static simulate(
    circuit: CircuitModel,
    shots: number = 1024,
    noiseSettings: NoiseSettings = NoiseModel.DEFAULT_SETTINGS
  ): SimulationResult {
    const startTime = performance.now();
    const validation = this.validateCircuit(circuit);
    if (!validation.isValid) {
      throw new Error(`Circuit validation failed: ${validation.errors.join(', ')}`);
    }

    // Initialize state to |00...0> or initial qubit values
    const initialValues = circuit.qubits.map((q) => q.initialValue ?? 0);
    const state = new QuantumState(circuit.numQubits, initialValues);

    // Group operations by moment for sequential execution
    const sortedOps = [...circuit.operations].sort((a, b) => a.moment - b.moment);

    for (const op of sortedOps) {
      this.applyOperation(state, op, noiseSettings);
    }

    state.normalize();

    // Calculate basis states, probabilities
    const basisStates = state.getBasisStates();
    const probabilities: Record<string, number> = {};
    for (const bs of basisStates) {
      probabilities[bs.binary] = bs.probability;
    }

    // Compute Bloch vectors for each qubit
    const blochSpheres: Record<number, BlochVector> = {};
    for (let q = 0; q < circuit.numQubits; q++) {
      blochSpheres[q] = state.getBlochVector(q);
    }

    // Probabilistic measurement sampling
    const readoutError = noiseSettings.enabled ? noiseSettings.readoutErrorRate : 0;
    const { counts, history } = state.sampleMeasurements(shots, readoutError);

    const executionTimeMs = performance.now() - startTime;

    return {
      stateVector: state.getVector(),
      basisStates,
      probabilities,
      shots,
      measurementCounts: counts,
      measurementHistory: history,
      sampledAt: Date.now(),
      noiseApplied: noiseSettings.enabled,
      executionTimeMs,
      blochSpheres,
    };
  }

  /**
   * Applies an individual circuit operation to the state vector.
   */
  private static applyOperation(
    state: QuantumState,
    op: CircuitOperation,
    noiseSettings: NoiseSettings
  ): void {
    switch (op.gate) {
      case 'H':
        QuantumGate.applySingleQubitGate(state, op.targets[0], QuantumGate.H.matrix);
        NoiseModel.applyNoise(state, op.targets[0], noiseSettings);
        break;
      case 'X':
        QuantumGate.applySingleQubitGate(state, op.targets[0], QuantumGate.X.matrix);
        NoiseModel.applyNoise(state, op.targets[0], noiseSettings);
        break;
      case 'Y':
        QuantumGate.applySingleQubitGate(state, op.targets[0], QuantumGate.Y.matrix);
        NoiseModel.applyNoise(state, op.targets[0], noiseSettings);
        break;
      case 'Z':
        QuantumGate.applySingleQubitGate(state, op.targets[0], QuantumGate.Z.matrix);
        NoiseModel.applyNoise(state, op.targets[0], noiseSettings);
        break;
      case 'S':
        QuantumGate.applySingleQubitGate(state, op.targets[0], QuantumGate.S.matrix);
        NoiseModel.applyNoise(state, op.targets[0], noiseSettings);
        break;
      case 'T':
        QuantumGate.applySingleQubitGate(state, op.targets[0], QuantumGate.T.matrix);
        NoiseModel.applyNoise(state, op.targets[0], noiseSettings);
        break;
      case 'CX':
        if (op.controls.length > 0 && op.targets.length > 0) {
          QuantumGate.applyControlledGate(state, op.controls[0], op.targets[0], QuantumGate.X.matrix);
          NoiseModel.applyNoise(state, op.targets[0], noiseSettings);
        }
        break;
      case 'SWAP':
        if (op.targets.length >= 2) {
          QuantumGate.applySwapGate(state, op.targets[0], op.targets[1]);
          NoiseModel.applyNoise(state, op.targets[0], noiseSettings);
          NoiseModel.applyNoise(state, op.targets[1], noiseSettings);
        }
        break;
      case 'U':
        if (op.customMatrix && op.targets.length > 0) {
          QuantumGate.applySingleQubitGate(state, op.targets[0], op.customMatrix);
          NoiseModel.applyNoise(state, op.targets[0], noiseSettings);
        }
        break;
      case 'M':
        // Measurement gate in visual diagram (simulation projects onto computational basis or samples)
        break;
    }
  }
}
