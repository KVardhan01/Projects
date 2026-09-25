import { CircuitModel } from '../../types/quantum';

export class QiskitGenerator {
  /**
   * Generates standard Python Qiskit code from the internal CircuitModel.
   */
  static generate(circuit: CircuitModel): string {
    const lines: string[] = [];

    lines.push('# ========================================================');
    lines.push('# QUBIFY - QISKIT CODE GENERATOR');
    lines.push(`# Circuit: ${circuit.name || 'Untitled Circuit'}`);
    lines.push(`# Qubits: ${circuit.numQubits}, Moments: ${circuit.numMoments}`);
    lines.push('# ========================================================');
    lines.push('');
    lines.push('from qiskit import QuantumCircuit');
    lines.push('');

    // Check if measurement gates exist
    const hasMeasurements = circuit.operations.some((op) => op.gate === 'M');
    if (hasMeasurements) {
      lines.push(`qc = QuantumCircuit(${circuit.numQubits}, ${circuit.numQubits})`);
    } else {
      lines.push(`qc = QuantumCircuit(${circuit.numQubits})`);
    }
    lines.push('');

    // Handle initial state preparation if any qubit is initialized to |1>
    let hasInitialized = false;
    for (const q of circuit.qubits) {
      if (q.initialValue === 1) {
        if (!hasInitialized) {
          lines.push('# Initial state preparation');
          hasInitialized = true;
        }
        lines.push(`qc.x(${q.index})  # initialize ${q.name} to |1>`);
      }
    }
    if (hasInitialized) lines.push('');

    // Sort operations by moment
    const sortedOps = [...circuit.operations].sort((a, b) => a.moment - b.moment);

    // Group by moment for clean commenting
    let currentMoment = -1;

    for (const op of sortedOps) {
      if (op.moment !== currentMoment) {
        currentMoment = op.moment;
        lines.push(`# Moment ${currentMoment}`);
      }

      switch (op.gate) {
        case 'H':
          lines.push(`qc.h(${op.targets[0]})`);
          break;
        case 'X':
          lines.push(`qc.x(${op.targets[0]})`);
          break;
        case 'Y':
          lines.push(`qc.y(${op.targets[0]})`);
          break;
        case 'Z':
          lines.push(`qc.z(${op.targets[0]})`);
          break;
        case 'S':
          lines.push(`qc.s(${op.targets[0]})`);
          break;
        case 'T':
          lines.push(`qc.t(${op.targets[0]})`);
          break;
        case 'CX':
          if (op.controls.length > 0 && op.targets.length > 0) {
            lines.push(`qc.cx(${op.controls[0]}, ${op.targets[0]})`);
          }
          break;
        case 'SWAP':
          if (op.targets.length >= 2) {
            lines.push(`qc.swap(${op.targets[0]}, ${op.targets[1]})`);
          }
          break;
        case 'M':
          lines.push(`qc.measure(${op.targets[0]}, ${op.targets[0]})`);
          break;
        case 'U':
          lines.push(`# Custom Unitary U on qubit ${op.targets[0]}`);
          break;
      }
    }

    if (!hasMeasurements && circuit.operations.length > 0) {
      lines.push('');
      lines.push('# Measurement across all computational wires');
      lines.push('qc.measure_all()');
    }

    return lines.join('\n');
  }
}
