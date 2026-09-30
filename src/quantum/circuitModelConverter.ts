import { CircuitModel, CircuitOperation, GateType, QubitDefinition } from '../types/quantum';
import { StructuredCircuitData, StructuredGate } from '../types/ai';
import { QiskitParser } from './parser/QiskitParser';
import { QuantumCircuitSimulator } from './QuantumCircuitSimulator';

export interface CircuitConversionResult {
  circuit: CircuitModel;
  isValid: boolean;
  errors: string[];
}

const SUPPORTED_GATES: GateType[] = ['H', 'X', 'Y', 'Z', 'S', 'T', 'CX', 'SWAP', 'M', 'U'];

/**
 * Converts AI-generated structured circuit data into Qubify's shared internal CircuitModel.
 * Ensures time-slot serialization without moment collisions, validates against simulator rules,
 * and ensures full compatibility with the visual canvas and Qiskit code editor.
 */
export function convertStructuredCircuitToModel(
  data: StructuredCircuitData,
  baseCircuit?: CircuitModel
): CircuitConversionResult {
  // If circuit explicitly declared as unsupported by simulator
  if (data.isSupportedBySimulator === false) {
    const errorMsg =
      data.unsupportedReason || 'This circuit cannot be represented in the current simulator.';
    return {
      circuit: baseCircuit || {
        id: `circuit-${Date.now()}`,
        name: 'Unsupported Circuit',
        numQubits: 2,
        numMoments: 5,
        qubits: [
          { index: 0, name: 'q0', initialValue: 0 },
          { index: 1, name: 'q1', initialValue: 0 },
        ],
        operations: [],
      },
      isValid: false,
      errors: [errorMsg],
    };
  }

  // 1. Try parsing directly from Qiskit code if available
  if (data.qiskitCode && data.qiskitCode.trim()) {
    const parseRes = QiskitParser.parse(data.qiskitCode, baseCircuit);
    if (parseRes.errors.length === 0) {
      const simVal = QuantumCircuitSimulator.validateCircuit(parseRes.circuit);
      if (simVal.isValid) {
        return {
          circuit: parseRes.circuit,
          isValid: true,
          errors: [],
        };
      }
    }
  }

  // 2. Build circuit model from structured gates array
  const rawGates = data.gates || [];
  let numQubits = Math.max(data.qubits || data.requiredQubits || 2, 2);

  // Scan gates to check max qubit index
  for (const g of rawGates) {
    if (typeof g === 'object' && g !== null && Array.isArray((g as StructuredGate).qubits)) {
      for (const q of (g as StructuredGate).qubits) {
        if (typeof q === 'number' && q >= numQubits) {
          numQubits = q + 1;
        }
      }
    }
  }

  // Enforce platform bounds
  if (numQubits > 8) {
    return {
      circuit: baseCircuit || {
        id: `circuit-${Date.now()}`,
        name: 'Invalid Register',
        numQubits: 2,
        numMoments: 5,
        qubits: [],
        operations: [],
      },
      isValid: false,
      errors: [`Register width (${numQubits} qubits) exceeds editor maximum (8 qubits).`],
    };
  }

  const qubits: QubitDefinition[] = Array.from({ length: numQubits }, (_, i) => ({
    index: i,
    name: `q${i}`,
    initialValue: 0,
  }));

  const operations: CircuitOperation[] = [];
  const qubitMoments: Record<number, number> = {};
  const errors: string[] = [];
  let opCounter = 0;

  for (let idx = 0; idx < rawGates.length; idx++) {
    const g = rawGates[idx];
    let gateTypeStr: string;
    let gateQubits: number[] = [];
    let params: Record<string, number> | undefined;

    if (typeof g === 'string') {
      gateTypeStr = g.toUpperCase();
      gateQubits = [0];
    } else if (typeof g === 'object' && g !== null) {
      gateTypeStr = (g.type || 'H').toUpperCase();
      gateQubits = Array.isArray(g.qubits) ? g.qubits : [0];
      if (Array.isArray(g.parameters) && g.parameters.length > 0) {
        params = {};
        g.parameters.forEach((val, pIdx) => {
          if (typeof val === 'number') params![`param_${pIdx}`] = val;
        });
      }
    } else {
      continue;
    }

    if (gateTypeStr === 'CNOT') gateTypeStr = 'CX';

    const normalizedGate = gateTypeStr as GateType;
    if (!SUPPORTED_GATES.includes(normalizedGate)) {
      errors.push(`Gate ${gateTypeStr} at position ${idx} is not supported by Qubify.`);
      continue;
    }

    let targets: number[] = [];
    let controls: number[] = [];

    if (normalizedGate === 'CX') {
      const c = gateQubits[0] !== undefined ? gateQubits[0] : 0;
      const t = gateQubits[1] !== undefined ? gateQubits[1] : 1;
      if (c === t) {
        errors.push(`CX gate cannot have the same control and target wire (${c}).`);
        continue;
      }
      controls = [c];
      targets = [t];

      const moment = Math.max(qubitMoments[c] || 0, qubitMoments[t] || 0);
      qubitMoments[c] = moment + 1;
      qubitMoments[t] = moment + 1;

      operations.push({
        id: `op-gen-${Date.now()}-${opCounter++}`,
        gate: 'CX',
        targets,
        controls,
        moment,
        params,
      });
    } else if (normalizedGate === 'SWAP') {
      const qA = gateQubits[0] !== undefined ? gateQubits[0] : 0;
      const qB = gateQubits[1] !== undefined ? gateQubits[1] : 1;
      controls = [];
      targets = [qA, qB];

      const moment = Math.max(qubitMoments[qA] || 0, qubitMoments[qB] || 0);
      qubitMoments[qA] = moment + 1;
      qubitMoments[qB] = moment + 1;

      operations.push({
        id: `op-gen-${Date.now()}-${opCounter++}`,
        gate: 'SWAP',
        targets,
        controls,
        moment,
        params,
      });
    } else {
      const target = gateQubits[0] !== undefined ? gateQubits[0] : 0;
      controls = [];
      targets = [target];

      const moment = qubitMoments[target] || 0;
      qubitMoments[target] = moment + 1;

      operations.push({
        id: `op-gen-${Date.now()}-${opCounter++}`,
        gate: normalizedGate,
        targets,
        controls,
        moment,
        params,
      });
    }
  }

  let maxMoment = 5;
  for (const m of Object.values(qubitMoments)) {
    if (m > maxMoment) maxMoment = m;
  }

  const model: CircuitModel = {
    id: baseCircuit ? baseCircuit.id : `circuit-${Date.now()}`,
    name: baseCircuit?.name || 'Generated Circuit',
    numQubits,
    numMoments: Math.max(maxMoment + 2, 6),
    qubits,
    operations,
    updatedAt: new Date().toISOString(),
  };

  const validation = QuantumCircuitSimulator.validateCircuit(model);
  if (!validation.isValid) {
    errors.push(...validation.errors);
  }

  return {
    circuit: model,
    isValid: errors.length === 0,
    errors,
  };
}
