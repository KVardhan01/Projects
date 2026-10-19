/**
 * Comprehensive Automated Test Suite for Qubify AI Tutor Circuit Action Pipeline
 * Verifies Tests A through L as specified in Master Prompt Section 13 & Step 10.
 */
import {
  detectUserIntent,
  synthesizeQuantumExpertResponse,
  formatQuantumContext,
  extractErrorDetails,
} from '../../services/ai/quantumExpertEngine';
import { convertStructuredCircuitToModel } from '../circuitModelConverter';
import { QuantumCircuitSimulator } from '../QuantumCircuitSimulator';
import { QiskitGenerator } from '../parser/QiskitGenerator';
import { CircuitModel } from '../../types/quantum';
import { AIContext } from '../../types/ai';

export function runAITutorTestSuite() {
  const results: { test: string; passed: boolean; message: string }[] = [];

  const assert = (condition: boolean, test: string, detail?: string) => {
    if (condition) {
      results.push({ test, passed: true, message: 'Passed' });
    } else {
      results.push({ test, passed: false, message: detail || 'Assertion failed' });
    }
  };

  const dummyContext: AIContext = {
    circuit: {
      id: 'circ-1',
      name: 'Active Circuit',
      numQubits: 2,
      numMoments: 4,
      qubits: [
        { index: 0, name: 'q0', initialValue: 0 },
        { index: 1, name: 'q1', initialValue: 0 },
      ],
      operations: [
        { id: 'op-0', gate: 'H', targets: [0], controls: [], moment: 0 },
        { id: 'op-1', gate: 'CX', targets: [1], controls: [0], moment: 1 },
      ],
    },
    code: 'qc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)',
    simulation: {
      probabilities: { '00': 0.5, '11': 0.5 },
    },
  };

  // TEST A: Conceptual question: "What is a Werner state?"
  {
    const prompt = 'What is a Werner state?';
    const intent = detectUserIntent(prompt, dummyContext);
    const res = synthesizeQuantumExpertResponse(prompt, dummyContext);
    assert(
      intent === 'concept_question',
      'TEST A: Intent is concept_question',
      `Got intent: ${intent}`
    );
    assert(
      res.structuredData?.action === undefined || res.structuredData?.action === 'none',
      'TEST A: Action is none (No Apply button)',
      `Got action: ${res.structuredData?.action}`
    );
    assert(
      res.reply.toLowerCase().includes('werner state') &&
        res.reply.includes('\\rho_W') &&
        res.reply.includes('|\\Psi^-\\rangle'),
      'TEST A: Explanation contains accurate mathematical definition of Werner state',
      `Reply missing definition: ${res.reply.slice(0, 100)}`
    );
  }

  // TEST B: Circuit Action Request: "Give me a Werner state" / "where is werner state"
  {
    const prompt = 'give me a Werner state';
    const intent = detectUserIntent(prompt, dummyContext);
    const res = synthesizeQuantumExpertResponse(prompt, dummyContext);
    assert(
      intent === 'generate_circuit',
      'TEST B: Intent is recognized as circuit generation',
      `Got intent: ${intent}`
    );
    assert(
      res.structuredData?.action === 'apply_to_visual_circuit',
      'TEST B: Action is apply_to_visual_circuit (shows Apply to Visual Circuit button)',
      `Got action: ${res.structuredData?.action}`
    );
    assert(
      res.structuredData?.isSupportedBySimulator === true,
      'TEST B: isSupportedBySimulator is true',
      `Got isSupportedBySimulator: ${res.structuredData?.isSupportedBySimulator}`
    );
    assert(
      Boolean(res.qiskitCode && res.qiskitCode.includes('QuantumCircuit(2)')),
      'TEST B: Provides runnable 2-qubit Qiskit code',
      `Code: ${res.qiskitCode}`
    );
    assert(
      Boolean(res.structuredData?.noiseSettings?.enabled && res.structuredData?.noiseSettings?.depolarizingRate),
      'TEST B: Provides depolarizing noise settings for Werner mixed state simulation',
      `Noise: ${JSON.stringify(res.structuredData?.noiseSettings)}`
    );
    const converted = convertStructuredCircuitToModel(res.structuredData!, dummyContext.circuit);
    assert(converted.isValid, 'TEST B: Werner circuit converts to valid CircuitModel');

    // Also test "where is werner state"
    const wherePrompt = 'where is werner state';
    const whereIntent = detectUserIntent(wherePrompt, dummyContext);
    const whereRes = synthesizeQuantumExpertResponse(wherePrompt, dummyContext);
    assert(
      whereIntent === 'generate_circuit',
      'TEST B2: "where is werner state" enters generate_circuit action flow',
      `Got intent: ${whereIntent}`
    );
    assert(
      whereRes.structuredData?.action === 'apply_to_visual_circuit',
      'TEST B2: "where is werner state" produces apply_to_visual_circuit action',
      `Got action: ${whereRes.structuredData?.action}`
    );
  }

  // TEST B3: Request a Z gate (Must NOT generate H+CX Bell state)
  {
    const zPrompt = 'request a Z gate';
    const zIntent = detectUserIntent(zPrompt, dummyContext);
    const zRes = synthesizeQuantumExpertResponse(zPrompt, dummyContext);
    assert(
      zIntent === 'modify_circuit' || zIntent === 'generate_circuit',
      'TEST B3: "request a Z gate" recognized as circuit action',
      `Got intent: ${zIntent}`
    );
    assert(
      zRes.structuredData?.action === 'apply_to_visual_circuit',
      'TEST B3: Action is apply_to_visual_circuit',
      `Got action: ${zRes.structuredData?.action}`
    );
    assert(
      Boolean(zRes.qiskitCode && (zRes.qiskitCode.includes('.z(') || zRes.qiskitCode.includes('qc.z'))),
      'TEST B3: Generates Z gate in Qiskit code',
      `Code: ${zRes.qiskitCode}`
    );
    assert(
      !zRes.reply.includes('Bell State (|Φ+⟩)') && !zRes.reply.includes('CX (CNOT) Gate creates quantum entanglement'),
      'TEST B3: Does NOT confuse Z gate with Bell state or CX entanglement',
      `Reply: ${zRes.reply.slice(0, 100)}`
    );
  }

  // TEST C: Circuit Action: "Create a Bell state"
  {
    const prompt = 'Create a Bell state';
    const intent = detectUserIntent(prompt, dummyContext);
    const res = synthesizeQuantumExpertResponse(prompt, dummyContext);
    assert(intent === 'generate_circuit', 'TEST C: Intent is generate_circuit');
    assert(
      res.structuredData?.action === 'apply_to_visual_circuit',
      'TEST C: Action is apply_to_visual_circuit'
    );
    assert(res.structuredData?.isSupportedBySimulator === true, 'TEST C: Supported by simulator');
    assert(
      Boolean(res.qiskitCode && res.qiskitCode.includes('qc.h(0)') && res.qiskitCode.includes('qc.cx(0, 1)')),
      'TEST C: Generated Qiskit code is valid'
    );

    // Apply to circuit model
    const converted = convertStructuredCircuitToModel(res.structuredData!, dummyContext.circuit);
    assert(converted.isValid, 'TEST C: Circuit model conversion is valid');
    assert(converted.circuit.operations.length === 2, 'TEST C: Model has 2 gates (H + CX)');
    const sim = QuantumCircuitSimulator.simulate(converted.circuit, 1024);
    assert(
      Math.abs(sim.probabilities['00'] - 0.5) < 1e-4 && Math.abs(sim.probabilities['11'] - 0.5) < 1e-4,
      'TEST C: Simulator yields exact Bell state probabilities (|00>: 50%, |11>: 50%)'
    );
    const generatedCode = QiskitGenerator.generate(converted.circuit);
    assert(
      generatedCode.includes('qc.h(0)') && generatedCode.includes('qc.cx(0, 1)'),
      'TEST C: Synchronized Qiskit code matches visual circuit'
    );
  }

  // TEST D: "Create GHZ state"
  {
    const prompt = 'create GHZ state';
    const res = synthesizeQuantumExpertResponse(prompt, dummyContext);
    assert(res.intent === 'generate_circuit', 'TEST D: Intent is generate_circuit');
    assert(
      res.structuredData?.action === 'apply_to_visual_circuit',
      'TEST D: Action is apply_to_visual_circuit'
    );
    const converted = convertStructuredCircuitToModel(res.structuredData!, dummyContext.circuit);
    assert(converted.isValid, 'TEST D: GHZ circuit conversion is valid');
    assert(converted.circuit.numQubits >= 3, 'TEST D: GHZ requires >= 3 qubits');
    const sim = QuantumCircuitSimulator.simulate(converted.circuit, 1024);
    assert(
      Math.abs(sim.probabilities['000'] - 0.5) < 1e-4 && Math.abs(sim.probabilities['111'] - 0.5) < 1e-4,
      'TEST D: Simulator yields GHZ probabilities (|000>: 50%, |111>: 50%)'
    );
  }

  // TEST E: "Add an H gate to qubit 0" (Circuit modification)
  {
    const prompt = 'Add an H gate to qubit 0';
    const intent = detectUserIntent(prompt, dummyContext);
    const res = synthesizeQuantumExpertResponse(prompt, dummyContext);
    assert(intent === 'modify_circuit', 'TEST E: Intent is modify_circuit');
    assert(
      res.structuredData?.action === 'apply_to_visual_circuit',
      'TEST E: Action is apply_to_visual_circuit'
    );
    const converted = convertStructuredCircuitToModel(res.structuredData!, dummyContext.circuit);
    assert(converted.isValid, 'TEST E: Modified circuit converts validly');
  }

  // TEST F: "Why am I getting this circuit validation error?" (Diagnosis)
  {
    const errContext: AIContext = {
      ...dummyContext,
      simulationError: 'Multiple gates placed on qubit 0 at moment 2.',
    };
    const prompt = 'Why am I getting this circuit validation error?';
    const intent = detectUserIntent(prompt, errContext);
    const res = synthesizeQuantumExpertResponse(prompt, errContext);
    assert(intent === 'error_diagnosis', 'TEST F: Intent is error_diagnosis');
    assert(
      res.structuredData?.action === undefined || res.structuredData?.action === 'none',
      'TEST F: Error diagnosis does not show Apply button'
    );
    assert(
      res.reply.includes('qubit 0') && res.reply.includes('moment 2'),
      'TEST F: Response diagnoses specific affected qubit and moment'
    );
  }

  // TEST G: "Explain my current circuit"
  {
    const prompt = 'Explain my current circuit';
    const intent = detectUserIntent(prompt, dummyContext);
    const res = synthesizeQuantumExpertResponse(prompt, dummyContext);
    assert(intent === 'explain_circuit', 'TEST G: Intent is explain_circuit');
    assert(
      res.reply.toLowerCase().includes('bell') || res.reply.includes('H') || res.reply.includes('CX'),
      'TEST G: Explains active gates of the circuit'
    );
  }

  // TEST H: "What does the T gate do?"
  {
    const prompt = 'What does the T gate do?';
    const intent = detectUserIntent(prompt, dummyContext);
    const res = synthesizeQuantumExpertResponse(prompt, dummyContext);
    assert(intent === 'concept_question', 'TEST H: Intent is concept_question');
    assert(
      res.reply.includes('phase') || res.reply.includes('π/4') || res.reply.includes('pi/4'),
      'TEST H: Explains T gate π/4 phase shift'
    );
  }

  // TEST I: Context formatting with classical bits and gate details
  {
    const formatted = formatQuantumContext(dummyContext);
    assert(formatted.numQubits === 2, 'TEST I: Formatted register width is 2');
    assert(formatted.gateCount === 2, 'TEST I: Gate count is 2');
    assert(formatted.probabilitiesStr.includes('50.0%'), 'TEST I: Probabilities formatted');
  }

  // TEST J: Error diagnosis with moment conflict
  {
    const details = extractErrorDetails('Multiple gates on qubit 1 at moment 3', dummyContext.circuit);
    assert(details.affectedQubit === 1, 'TEST J: Affected qubit extracted as 1');
    assert(details.affectedMoment === 3, 'TEST J: Affected moment extracted as 3');
    assert(details.errorType === 'moment_conflict', 'TEST J: Error type is moment_conflict');
  }

  // TEST K: Verify normal conceptual answers do NOT show Apply buttons
  {
    const res = synthesizeQuantumExpertResponse('What is quantum entanglement?', dummyContext);
    assert(
      res.structuredData?.action === undefined || res.structuredData?.action === 'none',
      'TEST K: Conceptual answer has no Apply action'
    );
  }

  // TEST L: Verify malformed or unsupported circuits cannot corrupt the shared circuit model
  {
    const unsupportedData = {
      intent: 'generate_circuit' as const,
      action: 'explain_limitation' as const,
      isSupportedBySimulator: false,
      unsupportedReason: 'Density matrix mixed states unsupported',
      qiskitCode: 'qc = QuantumCircuit(2)\nqc.h(0)',
    };
    const conversion = convertStructuredCircuitToModel(unsupportedData, dummyContext.circuit);
    assert(
      conversion.isValid === false,
      'TEST L: Unsupported circuit cannot convert to valid model'
    );
    assert(
      conversion.errors.length > 0,
      'TEST L: Error is returned preventing circuit replacement'
    );
  }

  return {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
  };
}

if (process.argv[1]?.includes('aiTutorPipeline.test')) {
  const suite = runAITutorTestSuite();
  console.log(`\n==================================================`);
  console.log(`AI TUTOR PIPELINE TEST SUITE: ${suite.passed}/${suite.total} PASSED`);
  console.log(`==================================================`);
  for (const r of suite.results) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.test}: ${r.message}`);
  }
  if (suite.failed > 0) {
    process.exit(1);
  }
}
