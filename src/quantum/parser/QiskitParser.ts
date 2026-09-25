import { CircuitModel, GateType, CircuitOperation, QubitDefinition } from '../../types/quantum';
import { CircuitAST, ASTGateCallNode, ASTMeasurementNode, ASTUnsupportedNode } from './CircuitAST';

export interface ParseResult {
  circuit: CircuitModel;
  ast: CircuitAST;
  warnings: string[];
  errors: string[];
}

export class QiskitParser {
  /**
   * Parses Python Qiskit code safely into a CircuitAST and CircuitModel.
   */
  static parse(code: string): ParseResult {
    const lines = code.split('\n');
    const warnings: string[] = [];
    const errors: string[] = [];

    let numQubits = 2;
    let circuitVarName = 'qc';
    const operations: CircuitOperation[] = [];
    const astNodes: (ASTGateCallNode | ASTMeasurementNode | ASTUnsupportedNode)[] = [];
    const qubitCurrentMoment: Record<number, number> = {};

    let opCounter = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const rawLine = lines[lineIdx].trim();
      if (!rawLine || rawLine.startsWith('#')) {
        continue;
      }

      // Check imports
      if (rawLine.startsWith('from qiskit') || rawLine.startsWith('import qiskit')) {
        continue;
      }

      // Detect QuantumCircuit instantiation: e.g. qc = QuantumCircuit(2) or qc = QuantumCircuit(2, 2)
      const qcInitMatch = rawLine.match(/([a-zA-Z_]\w*)\s*=\s*QuantumCircuit\((\d+)(?:,\s*(\d+))?\)/);
      if (qcInitMatch) {
        circuitVarName = qcInitMatch[1];
        numQubits = parseInt(qcInitMatch[2], 10);
        continue;
      }

      // Must start with circuit variable, e.g. qc.
      if (!rawLine.startsWith(`${circuitVarName}.`)) {
        warnings.push(`Line ${lineIdx + 1}: Ignored non-circuit line: "${rawLine}"`);
        continue;
      }

      const methodCall = rawLine.substring(circuitVarName.length + 1);

      // qc.measure_all()
      if (methodCall.startsWith('measure_all(')) {
        let maxMom = 0;
        for (let q = 0; q < numQubits; q++) {
          maxMom = Math.max(maxMom, qubitCurrentMoment[q] || 0);
        }
        for (let q = 0; q < numQubits; q++) {
          operations.push({
            id: `op-${opCounter++}`,
            gate: 'M',
            targets: [q],
            controls: [],
            moment: maxMom,
          });
          qubitCurrentMoment[q] = maxMom + 1;
        }
        astNodes.push({
          type: 'Measurement',
          targets: Array.from({ length: numQubits }, (_, i) => i),
          isMeasureAll: true,
          moment: maxMom,
        });
        continue;
      }

      // Single-qubit gates: qc.h(0), qc.x(0), qc.y(0), qc.z(0), qc.s(0), qc.t(0)
      const singleGateMatch = methodCall.match(/^([hxyzst])\((\d+)\)/i);
      if (singleGateMatch) {
        const gate = singleGateMatch[1].toUpperCase() as GateType;
        const target = parseInt(singleGateMatch[2], 10);

        if (target >= numQubits) {
          errors.push(`Line ${lineIdx + 1}: Target qubit index ${target} exceeds circuit width (${numQubits}).`);
          continue;
        }

        const moment = qubitCurrentMoment[target] || 0;
        qubitCurrentMoment[target] = moment + 1;

        operations.push({
          id: `op-${opCounter++}`,
          gate,
          targets: [target],
          controls: [],
          moment,
        });

        astNodes.push({
          type: 'GateCall',
          gate,
          targets: [target],
          controls: [],
          moment,
        });
        continue;
      }

      // CX / CNOT: qc.cx(control, target)
      const cxMatch = methodCall.match(/^cx\((\d+),\s*(\d+)\)/);
      if (cxMatch) {
        const ctrl = parseInt(cxMatch[1], 10);
        const tgt = parseInt(cxMatch[2], 10);

        if (ctrl >= numQubits || tgt >= numQubits) {
          errors.push(`Line ${lineIdx + 1}: Qubit index out of range in cx(${ctrl}, ${tgt}).`);
          continue;
        }

        const moment = Math.max(qubitCurrentMoment[ctrl] || 0, qubitCurrentMoment[tgt] || 0);
        qubitCurrentMoment[ctrl] = moment + 1;
        qubitCurrentMoment[tgt] = moment + 1;

        operations.push({
          id: `op-${opCounter++}`,
          gate: 'CX',
          targets: [tgt],
          controls: [ctrl],
          moment,
        });

        astNodes.push({
          type: 'GateCall',
          gate: 'CX',
          targets: [tgt],
          controls: [ctrl],
          moment,
        });
        continue;
      }

      // SWAP: qc.swap(a, b)
      const swapMatch = methodCall.match(/^swap\((\d+),\s*(\d+)\)/);
      if (swapMatch) {
        const qA = parseInt(swapMatch[1], 10);
        const qB = parseInt(swapMatch[2], 10);

        if (qA >= numQubits || qB >= numQubits) {
          errors.push(`Line ${lineIdx + 1}: Qubit index out of range in swap(${qA}, ${qB}).`);
          continue;
        }

        const moment = Math.max(qubitCurrentMoment[qA] || 0, qubitCurrentMoment[qB] || 0);
        qubitCurrentMoment[qA] = moment + 1;
        qubitCurrentMoment[qB] = moment + 1;

        operations.push({
          id: `op-${opCounter++}`,
          gate: 'SWAP',
          targets: [qA, qB],
          controls: [],
          moment,
        });

        astNodes.push({
          type: 'GateCall',
          gate: 'SWAP',
          targets: [qA, qB],
          controls: [],
          moment,
        });
        continue;
      }

      // qc.measure(q, c)
      const measureMatch = methodCall.match(/^measure\((\d+),\s*(\d+)\)/);
      if (measureMatch) {
        const tgt = parseInt(measureMatch[1], 10);
        const moment = qubitCurrentMoment[tgt] || 0;
        qubitCurrentMoment[tgt] = moment + 1;

        operations.push({
          id: `op-${opCounter++}`,
          gate: 'M',
          targets: [tgt],
          controls: [],
          moment,
        });

        astNodes.push({
          type: 'Measurement',
          targets: [tgt],
          isMeasureAll: false,
          moment,
        });
        continue;
      }

      // Unsupported Qiskit command
      warnings.push(`Some Qiskit operations are not supported by the visual editor: "${rawLine}"`);
      astNodes.push({
        type: 'UnsupportedStatement',
        rawText: rawLine,
        reason: 'Operation not yet mapped in visual editor palette',
      });
    }

    const maxMoment = operations.reduce((m, op) => Math.max(m, op.moment + 1), 5);
    const qubits: QubitDefinition[] = Array.from({ length: numQubits }, (_, i) => ({
      index: i,
      name: `q${i}`,
      initialValue: 0,
    }));

    const circuit: CircuitModel = {
      id: `qiskit-circuit-${Date.now()}`,
      name: 'Imported Qiskit Circuit',
      numQubits: Math.max(1, Math.min(10, numQubits)),
      numMoments: Math.max(4, maxMoment),
      qubits,
      operations,
    };

    const ast: CircuitAST = {
      name: circuit.name,
      numQubits,
      numClassicalBits: numQubits,
      qubitDeclarations: qubits,
      nodes: astNodes,
      unsupportedWarnings: warnings,
    };

    return { circuit, ast, warnings, errors };
  }
}
