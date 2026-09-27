import { QiskitGenerator } from '../parser/QiskitGenerator';
import { QiskitParser } from '../parser/QiskitParser';
import { CircuitModel } from '../../types/quantum';

// Helper to run self-validating test assertions
export function runBidirectionalTests(): { passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, detail?: string) {
    if (condition) {
      passed++;
      results.push(`✅ [PASS] ${testName}`);
    } else {
      failed++;
      results.push(`❌ [FAIL] ${testName}: ${detail || 'Assertion failed'}`);
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Create a 1-qubit circuit. Add H.
  // Expected Python:
  // from qiskit import QuantumCircuit
  // qc = QuantumCircuit(1)
  // qc.h(0)
  // -------------------------------------------------------------
  const circuit1: CircuitModel = {
    id: 'test-1',
    name: '1-Qubit H',
    numQubits: 1,
    numMoments: 4,
    qubits: [{ index: 0, name: 'q0', initialValue: 0 }],
    operations: [{ id: 'op-1', gate: 'H', targets: [0], controls: [], moment: 0 }],
  };
  const python1 = QiskitGenerator.generate(circuit1);
  assert(
    'TEST 1: 1-qubit circuit with H produces expected Python',
    python1.includes('from qiskit import QuantumCircuit') &&
      python1.includes('qc = QuantumCircuit(1)') &&
      python1.includes('qc.h(0)'),
    `Actual:\n${python1}`
  );

  // -------------------------------------------------------------
  // TEST 2: Change H to X visually.
  // Expected Python: qc.x(0)
  // -------------------------------------------------------------
  const circuit2: CircuitModel = {
    ...circuit1,
    operations: [{ id: 'op-1', gate: 'X', targets: [0], controls: [], moment: 0 }],
  };
  const python2 = QiskitGenerator.generate(circuit2);
  assert(
    'TEST 2: Changing H to X visually generates qc.x(0) and removes qc.h(0)',
    python2.includes('qc.x(0)') && !python2.includes('qc.h(0)'),
    `Actual:\n${python2}`
  );

  // -------------------------------------------------------------
  // TEST 3: Edit Python: qc.h(0) to qc.x(0).
  // Expected visual circuit: H changes to X.
  // -------------------------------------------------------------
  const codeToParse = `from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.x(0)`;
  const parsed3 = QiskitParser.parse(codeToParse, circuit1);
  assert(
    'TEST 3: Editing Python qc.h(0) to qc.x(0) changes visual circuit gate to X',
    parsed3.circuit.operations.length === 1 &&
      parsed3.circuit.operations[0].gate === 'X' &&
      parsed3.circuit.operations[0].targets[0] === 0,
    `Parsed gates: ${JSON.stringify(parsed3.circuit.operations)}`
  );

  // -------------------------------------------------------------
  // TEST 4: Add CNOT visually.
  // Expected Python: qc.cx(0, 1)
  // -------------------------------------------------------------
  const circuit4: CircuitModel = {
    id: 'test-4',
    name: 'Bell circuit',
    numQubits: 2,
    numMoments: 4,
    qubits: [
      { index: 0, name: 'q0', initialValue: 0 },
      { index: 1, name: 'q1', initialValue: 0 },
    ],
    operations: [
      { id: 'op-h', gate: 'H', targets: [0], controls: [], moment: 0 },
      { id: 'op-cx', gate: 'CX', targets: [1], controls: [0], moment: 1 },
    ],
  };
  const python4 = QiskitGenerator.generate(circuit4);
  assert(
    'TEST 4: Adding CNOT visually generates qc.cx(0, 1)',
    python4.includes('qc.cx(0, 1)'),
    `Actual:\n${python4}`
  );

  // -------------------------------------------------------------
  // TEST 5: Add/remove qubits.
  // Expected Python QuantumCircuit qubit count changes.
  // -------------------------------------------------------------
  const circuit5a: CircuitModel = {
    ...circuit4,
    numQubits: 3,
    qubits: [
      { index: 0, name: 'q0', initialValue: 0 },
      { index: 1, name: 'q1', initialValue: 0 },
      { index: 2, name: 'q2', initialValue: 0 },
    ],
  };
  const python5a = QiskitGenerator.generate(circuit5a);
  assert(
    'TEST 5: Adding qubit visually changes QuantumCircuit qubit count to 3',
    python5a.includes('qc = QuantumCircuit(3)'),
    `Actual:\n${python5a}`
  );

  const parsed5b = QiskitParser.parse(`from qiskit import QuantumCircuit\nqc = QuantumCircuit(4)`);
  assert(
    'TEST 5 (Reverse): Changing QuantumCircuit(4) in Python updates visual circuit numQubits to 4',
    parsed5b.circuit.numQubits === 4 && parsed5b.circuit.qubits.length === 4,
    `Parsed numQubits: ${parsed5b.circuit.numQubits}`
  );

  // -------------------------------------------------------------
  // TEST 6: Delete a gate visually.
  // Expected corresponding Python line disappears.
  // -------------------------------------------------------------
  const circuit6: CircuitModel = {
    ...circuit4,
    operations: [{ id: 'op-h', gate: 'H', targets: [0], controls: [], moment: 0 }], // deleted CX
  };
  const python6 = QiskitGenerator.generate(circuit6);
  assert(
    'TEST 6: Deleting CX visually removes qc.cx(0, 1) from Python code',
    !python6.includes('qc.cx(0, 1)') && python6.includes('qc.h(0)'),
    `Actual:\n${python6}`
  );

  // -------------------------------------------------------------
  // TEST 7: Delete a gate in Python.
  // Expected corresponding visual gate disappears.
  // -------------------------------------------------------------
  const parsed7 = QiskitParser.parse(`from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.h(0)`);
  assert(
    'TEST 7: Deleting qc.cx(0, 1) in Python removes the visual gate from operations',
    parsed7.circuit.operations.length === 1 && parsed7.circuit.operations[0].gate === 'H',
    `Parsed operations count: ${parsed7.circuit.operations.length}`
  );

  // -------------------------------------------------------------
  // TEST 8: Unsupported Qiskit operation handling
  // Expected: Shows "Unsupported Qiskit operation: <op>" and preserves last valid circuit.
  // -------------------------------------------------------------
  const unsupportedCode = `from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.magic_gate(0)`;
  const parsed8 = QiskitParser.parse(unsupportedCode, circuit4);
  assert(
    'TEST 8: Unsupported Qiskit operation generates clear error and keeps fallback circuit',
    parsed8.errors.some((e) => e.includes('Unsupported Qiskit operation: qc.magic_gate(0)')) &&
      parsed8.circuit.id === circuit4.id,
    `Errors: ${parsed8.errors.join(', ')}`
  );

  return { passed, failed, results };
}
