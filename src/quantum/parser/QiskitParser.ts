import { CircuitModel, GateType, CircuitOperation, QubitDefinition } from '../../types/quantum';
import { CircuitAST, ASTGateCallNode, ASTMeasurementNode, ASTUnsupportedNode } from './CircuitAST';
import { logger } from '../../services/logger';

export interface ParseResult {
  circuit: CircuitModel;
  ast: CircuitAST;
  warnings: string[];
  errors: string[];
  unsupportedOperations: string[];
}

export class QiskitParser {
  /**
   * Parses Python Qiskit code into a canonical CircuitModel.
   * Supports:
   * - QuantumCircuit(n)
   * - qc.h(q)
   * - qc.x(q)
   * - qc.y(q)
   * - qc.z(q)
   * - qc.s(q)
   * - qc.t(q)
   * - qc.cx(c, t)
   * - qc.cnot(c, t)
   * - qc.swap(a, b)
   * - qc.measure(q, c)
   * - qc.measure_all()
   */
  static parse(code: string, fallbackCircuit?: CircuitModel): ParseResult {
    const lines = code.split('\n');
    const warnings: string[] = [];
    const errors: string[] = [];
    const unsupportedOperations: string[] = [];

    let numQubits = fallbackCircuit ? fallbackCircuit.numQubits : 2;
    let circuitVarName = 'qc';
    let declaredQubits = false;
    const operations: CircuitOperation[] = [];
    const astNodes: (ASTGateCallNode | ASTMeasurementNode | ASTUnsupportedNode)[] = [];
    const qubitCurrentMoment: Record<number, number> = {};

    let opCounter = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      let rawLine = lines[lineIdx].trim();
      if (!rawLine || rawLine.startsWith('#')) {
        continue;
      }

      // Strip inline comments: e.g. "qc.h(0) # hadamard" -> "qc.h(0)"
      const commentIndex = rawLine.indexOf('#');
      if (commentIndex >= 0) {
        rawLine = rawLine.substring(0, commentIndex).trim();
      }
      if (!rawLine) continue;

      // Imports
      if (rawLine.startsWith('from qiskit') || rawLine.startsWith('import qiskit') || rawLine.startsWith('import ')) {
        continue;
      }

      // Detect QuantumCircuit instantiation: e.g. qc = QuantumCircuit(2) or circuit = QuantumCircuit(3, 3)
      const qcInitMatch = rawLine.match(/([a-zA-Z_]\w*)\s*=\s*QuantumCircuit\((\d+)(?:,\s*(\d+))?[^)]*\)/);
      if (qcInitMatch) {
        circuitVarName = qcInitMatch[1];
        numQubits = parseInt(qcInitMatch[2], 10);
        declaredQubits = true;
        continue;
      }

      // Check if line calls circuitVarName method
      const dotPrefix = `${circuitVarName}.`;
      if (!rawLine.startsWith(dotPrefix)) {
        // If line is variable assignment or unsupported python statement
        if (rawLine.includes('=')) {
          warnings.push(`Line ${lineIdx + 1}: Ignored non-circuit variable statement: "${rawLine}"`);
          continue;
        }
        // General unsupported operation
        unsupportedOperations.push(rawLine);
        errors.push(`Unsupported Qiskit operation: ${rawLine}`);
        continue;
      }

      const methodCall = rawLine.substring(dotPrefix.length).trim();

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

      // Single-qubit gates: h, x, y, z, s, t
      const singleGateMatch = methodCall.match(/^([hxyzst])\((\d+)\)$/i);
      if (singleGateMatch) {
        const gate = singleGateMatch[1].toUpperCase() as GateType;
        const target = parseInt(singleGateMatch[2], 10);

        if (target >= numQubits) {
          if (!declaredQubits) {
            numQubits = target + 1;
          } else {
            errors.push(`Line ${lineIdx + 1}: Target qubit index ${target} exceeds circuit width (${numQubits}).`);
            continue;
          }
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

      // CX / CNOT: qc.cx(control, target) or qc.cnot(control, target)
      const cxMatch = methodCall.match(/^(?:cx|cnot)\((\d+),\s*(\d+)\)$/);
      if (cxMatch) {
        const ctrl = parseInt(cxMatch[1], 10);
        const tgt = parseInt(cxMatch[2], 10);

        if (ctrl >= numQubits || tgt >= numQubits) {
          if (!declaredQubits) {
            numQubits = Math.max(ctrl, tgt) + 1;
          } else {
            errors.push(`Line ${lineIdx + 1}: Qubit index out of range in cx(${ctrl}, ${tgt}) with width ${numQubits}.`);
            continue;
          }
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
      const swapMatch = methodCall.match(/^swap\((\d+),\s*(\d+)\)$/);
      if (swapMatch) {
        const qA = parseInt(swapMatch[1], 10);
        const qB = parseInt(swapMatch[2], 10);

        if (qA >= numQubits || qB >= numQubits) {
          if (!declaredQubits) {
            numQubits = Math.max(qA, qB) + 1;
          } else {
            errors.push(`Line ${lineIdx + 1}: Qubit index out of range in swap(${qA}, ${qB}).`);
            continue;
          }
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
      const measureMatch = methodCall.match(/^measure\((\d+),\s*(\d+)\)$/);
      if (measureMatch) {
        const tgt = parseInt(measureMatch[1], 10);
        if (tgt >= numQubits) {
          if (!declaredQubits) {
            numQubits = tgt + 1;
          } else {
            errors.push(`Line ${lineIdx + 1}: Qubit index out of range in measure(${tgt}).`);
            continue;
          }
        }

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

      // If method call doesn't match supported operations
      unsupportedOperations.push(rawLine);
      errors.push(`Unsupported Qiskit operation: ${rawLine}`);
      astNodes.push({
        type: 'UnsupportedStatement',
        rawText: rawLine,
        reason: 'Operation not yet mapped in visual editor palette',
      });
    }

    // If there were critical errors or unsupported operations, keep fallback circuit
    if (errors.length > 0 && fallbackCircuit) {
      return {
        circuit: fallbackCircuit,
        ast: {
          name: fallbackCircuit.name,
          numQubits: fallbackCircuit.numQubits,
          numClassicalBits: fallbackCircuit.numQubits,
          qubitDeclarations: fallbackCircuit.qubits,
          nodes: astNodes,
          unsupportedWarnings: warnings,
        },
        warnings,
        errors,
        unsupportedOperations,
      };
    }

    const safeNumQubits = Math.max(1, Math.min(8, numQubits));
    const maxMoment = operations.reduce((m, op) => Math.max(m, op.moment + 1), 5);
    const qubits: QubitDefinition[] = Array.from({ length: safeNumQubits }, (_, i) => ({
      index: i,
      name: `q${i}`,
      initialValue: 0,
    }));

    const circuit: CircuitModel = {
      id: fallbackCircuit?.id || `qiskit-circuit-${Date.now()}`,
      name: fallbackCircuit?.name || 'Quantum Circuit',
      numQubits: safeNumQubits,
      numMoments: Math.max(5, maxMoment),
      qubits,
      operations,
    };

    const ast: CircuitAST = {
      name: circuit.name,
      numQubits: safeNumQubits,
      numClassicalBits: safeNumQubits,
      qubitDeclarations: qubits,
      nodes: astNodes,
      unsupportedWarnings: warnings,
    };

    if (errors.length > 0) {
      logger.error('QiskitParser', `Python/Qiskit parsing errors: ${errors.join('; ')}`);
    }

    return { circuit, ast, warnings, errors, unsupportedOperations };
  }
}
