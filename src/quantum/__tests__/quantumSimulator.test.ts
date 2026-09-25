/**
 * Comprehensive Quantum Simulator & Equivalence Unit Tests
 * Can be run via Node (tsx) or imported in development.
 */
import { Complex } from '../ComplexNumber';
import { QuantumState } from '../QuantumState';
import { QuantumGate } from '../QuantumGate';
import { QuantumCircuitSimulator } from '../QuantumCircuitSimulator';
import { CircuitModel } from '../../types/quantum';
import { UnitaryEquivalence } from '../equivalence/UnitaryEquivalence';
import { ProbabilityEquivalence } from '../equivalence/ProbabilityEquivalence';
import { QiskitGenerator } from '../parser/QiskitGenerator';
import { QiskitParser } from '../parser/QiskitParser';

export function runQuantumTestSuite(): {
  total: number;
  passed: number;
  failed: number;
  results: { testName: string; passed: boolean; message: string }[];
} {
  const results: { testName: string; passed: boolean; message: string }[] = [];

  const assert = (condition: boolean, testName: string, errorDetail?: string) => {
    if (condition) {
      results.push({ testName, passed: true, message: 'Passed' });
    } else {
      results.push({ testName, passed: false, message: errorDetail || 'Assertion failed' });
    }
  };

  // Test 1: Complex Number Arithmetic
  const c1 = new Complex(3, 4);
  const c2 = new Complex(1, -2);
  const cSum = c1.add(c2);
  const cMul = c1.mul(c2);
  assert(cSum.re === 4 && cSum.im === 2, 'Complex Addition (3+4i) + (1-2i) == 4+2i');
  assert(cMul.re === 11 && cMul.im === -2, 'Complex Multiplication (3+4i)*(1-2i) == 11-2i');
  assert(Math.abs(c1.magnitude() - 5) < 1e-6, 'Complex Magnitude |3+4i| == 5');

  // Test 2: Hadamard Gate Superposition: |0> -> (|0> + |1>)/sqrt(2)
  const stateH = new QuantumState(1, [0]);
  QuantumGate.applySingleQubitGate(stateH, 0, QuantumGate.H.matrix);
  const probsH = stateH.getProbabilities();
  assert(
    Math.abs(probsH[0] - 0.5) < 1e-4 && Math.abs(probsH[1] - 0.5) < 1e-4,
    'Hadamard Gate on |0> creates 50/50 superposition'
  );

  // Test 3: Pauli-X Bit Flip: |0> -> |1>
  const stateX = new QuantumState(1, [0]);
  QuantumGate.applySingleQubitGate(stateX, 0, QuantumGate.X.matrix);
  assert(
    Math.abs(stateX.getProbabilities()[1] - 1.0) < 1e-6,
    'Pauli-X Gate flips |0> to |1> with 100% probability'
  );

  // Test 4: Pauli-Z Phase Flip: |+> -> |->
  const stateZ = new QuantumState(1, [0]);
  QuantumGate.applySingleQubitGate(stateZ, 0, QuantumGate.H.matrix);
  QuantumGate.applySingleQubitGate(stateZ, 0, QuantumGate.Z.matrix);
  QuantumGate.applySingleQubitGate(stateZ, 0, QuantumGate.H.matrix); // H·Z·H = X
  assert(
    Math.abs(stateZ.getProbabilities()[1] - 1.0) < 1e-6,
    'H·Z·H is equivalent to Pauli-X'
  );

  // Test 5: Phase S & T Gates
  const sMat = QuantumGate.S.matrix;
  const sSq = QuantumGate.matrixMultiply(sMat, sMat);
  assert(
    sSq[1][1].isCloseTo(Complex.NEG_ONE),
    'S^2 equals Pauli-Z'
  );

  // Test 6: Bell State Entanglement (Prompt Section 110)
  // Circuit: H(0), CX(0, 1) starting from |00>
  const bellCircuit: CircuitModel = {
    id: 'bell-test',
    name: 'Bell State Test',
    numQubits: 2,
    numMoments: 2,
    qubits: [
      { index: 0, name: 'q0', initialValue: 0 },
      { index: 1, name: 'q1', initialValue: 0 },
    ],
    operations: [
      { id: 'h0', gate: 'H', targets: [0], controls: [], moment: 0 },
      { id: 'cx', gate: 'CX', targets: [1], controls: [0], moment: 1 },
    ],
  };

  const bellSim = QuantumCircuitSimulator.simulate(bellCircuit, 1024);
  const p00 = bellSim.probabilities['00'] || 0;
  const p11 = bellSim.probabilities['11'] || 0;
  const p01 = bellSim.probabilities['01'] || 0;
  const p10 = bellSim.probabilities['10'] || 0;

  assert(
    Math.abs(p00 - 0.5) < 1e-4 &&
      Math.abs(p11 - 0.5) < 1e-4 &&
      Math.abs(p01) < 1e-4 &&
      Math.abs(p10) < 1e-4,
    'Bell State |Phi+> produces P(00)=0.5, P(11)=0.5, P(01)=0, P(10)=0 within tolerance',
    `Observed: P(00)=${p00}, P(11)=${p11}, P(01)=${p01}, P(10)=${p10}`
  );

  // Test 7: Formal Unitary Equivalence Engine
  // Compare H·Z·H vs X on 1 qubit
  const hzhCircuit: CircuitModel = {
    id: 'hzh',
    name: 'H-Z-H',
    numQubits: 1,
    numMoments: 3,
    qubits: [{ index: 0, name: 'q0', initialValue: 0 }],
    operations: [
      { id: '1', gate: 'H', targets: [0], controls: [], moment: 0 },
      { id: '2', gate: 'Z', targets: [0], controls: [], moment: 1 },
      { id: '3', gate: 'H', targets: [0], controls: [], moment: 2 },
    ],
  };
  const xCircuit: CircuitModel = {
    id: 'x',
    name: 'X Gate',
    numQubits: 1,
    numMoments: 1,
    qubits: [{ index: 0, name: 'q0', initialValue: 0 }],
    operations: [{ id: '1', gate: 'X', targets: [0], controls: [], moment: 0 }],
  };

  const unitaryComp = UnitaryEquivalence.compare(hzhCircuit, xCircuit);
  assert(
    unitaryComp.isEquivalent && Math.abs(unitaryComp.fidelity - 1.0) < 1e-4,
    'UnitaryEquivalence correctly identifies H·Z·H == X with fidelity 1.0'
  );

  // Test 8: Qiskit Code Generation
  const generatedCode = QiskitGenerator.generate(bellCircuit);
  assert(
    generatedCode.includes('qc.h(0)') && generatedCode.includes('qc.cx(0, 1)'),
    'QiskitGenerator correctly serializes Bell circuit'
  );

  // Test 9: Qiskit Parsing and Visual Synchronization
  const qiskitCode = `qc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure_all()`;
  const parsed = QiskitParser.parse(qiskitCode);
  assert(
    parsed.circuit.operations.some((o) => o.gate === 'H' && o.targets[0] === 0) &&
      parsed.circuit.operations.some((o) => o.gate === 'CX' && o.controls[0] === 0 && o.targets[0] === 1),
    'QiskitParser correctly converts Python code to internal CircuitModel'
  );

  // Test 10: SWAP Gate
  const swapCircuit: CircuitModel = {
    id: 'swap',
    name: 'SWAP Test',
    numQubits: 2,
    numMoments: 2,
    qubits: [
      { index: 0, name: 'q0', initialValue: 1 },
      { index: 1, name: 'q1', initialValue: 0 },
    ],
    operations: [{ id: 'sw', gate: 'SWAP', targets: [0, 1], controls: [], moment: 0 }],
  };
  const swapSim = QuantumCircuitSimulator.simulate(swapCircuit, 100);
  assert(
    Math.abs(swapSim.probabilities['01'] - 1.0) < 1e-4,
    'SWAP gate swaps |10> to |01> with 100% probability'
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  return { total: results.length, passed, failed, results };
}
