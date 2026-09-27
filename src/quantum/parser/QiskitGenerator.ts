import { CircuitModel } from '../../types/quantum';

export class QiskitGenerator {
  /**
   * Generates standard Python Qiskit code from the internal CircuitModel.
   * User-facing quantum code must be clean Python + Qiskit only.
   */
  static generate(circuit: CircuitModel): string {
    const lines: string[] = [];

    lines.push('from qiskit import QuantumCircuit');
    lines.push('');

    // Check if measurement gates exist
    const measurementOps = circuit.operations.filter((op) => op.gate === 'M');
    const hasMeasurements = measurementOps.length > 0;
    const isMeasureAll =
      hasMeasurements &&
      circuit.numQubits > 1 &&
      measurementOps.length === circuit.numQubits &&
      measurementOps.every((op, idx) => op.targets[0] === idx);

    if (hasMeasurements && !isMeasureAll) {
      lines.push(`qc = QuantumCircuit(${circuit.numQubits}, ${circuit.numQubits})`);
    } else {
      lines.push(`qc = QuantumCircuit(${circuit.numQubits})`);
    }
    lines.push('');

    // Handle initial state preparation if any qubit is initialized to |1>
    for (const q of circuit.qubits) {
      if (q.initialValue === 1) {
        lines.push(`qc.x(${q.index})`);
      }
    }

    // Sort operations by moment, then by target qubit
    const sortedOps = [...circuit.operations].sort((a, b) => {
      if (a.moment !== b.moment) return a.moment - b.moment;
      const targetA = a.targets[0] ?? 0;
      const targetB = b.targets[0] ?? 0;
      return targetA - targetB;
    });

    for (const op of sortedOps) {
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
          if (!isMeasureAll) {
            lines.push(`qc.measure(${op.targets[0]}, ${op.targets[0]})`);
          }
          break;
        case 'U':
          lines.push(`# Custom Unitary U on qubit ${op.targets[0]}`);
          break;
      }
    }

    if (isMeasureAll) {
      lines.push('qc.measure_all()');
    }

    return lines.join('\n');
  }
}
