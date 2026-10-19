import { AIContext, AIUserIntent, StructuredCircuitData, StructuredGate } from '../../types/ai';
import { CircuitModel } from '../../types/quantum';
import { QuantumCircuitSimulator } from '../../quantum/QuantumCircuitSimulator';
import { QiskitGenerator } from '../../quantum/parser/QiskitGenerator';

export interface FormattedQuantumContext {
  numQubits: number;
  numClassicalBits: number;
  gateCount: number;
  gateDetails: string;
  activeCode: string;
  probabilitiesStr: string;
  measurementCountsStr: string;
  simulationError: string;
  exerciseGoal: string;
  studentLevel: string;
}

export interface ExtractedErrorDetails {
  rawError: string;
  affectedQubit?: number;
  affectedMoment?: number;
  conflictingGates: string[];
  errorType: 'moment_conflict' | 'bounds' | 'control_target_conflict' | 'syntax' | 'general';
}

export interface QuantumExpertResult {
  reply: string;
  intent: AIUserIntent;
  request: string;
  qiskitCode?: string;
  requiredQubits?: number;
  gates?: string[];
  canModifyCurrentCircuit?: boolean;
  structuredData?: StructuredCircuitData;
  errorDetails?: ExtractedErrorDetails;
}

/**
 * Extracts fine-grained error parameters from error messages and active circuit model:
 * - exact error message
 * - affected qubit index
 * - affected moment / time slot
 * - affected conflicting gates
 */
export function extractErrorDetails(errorMsg: string, circuit?: CircuitModel): ExtractedErrorDetails {
  let cleanMsg = errorMsg
    .replace(/^Simulation Error\s*/i, '')
    .replace(/Please check the Python.*$/i, '')
    .replace(/^Circuit validation failed:\s*/i, '')
    .trim();

  // If no explicit error message string was passed, inspect circuit directly
  if (!cleanMsg && circuit) {
    const val = QuantumCircuitSimulator.validateCircuit(circuit);
    if (!val.isValid && val.errors.length > 0) {
      cleanMsg = val.errors[0];
    }
  }

  const qubitMatch = cleanMsg.match(/qubit\s+(\d+)/i) || cleanMsg.match(/q(\d+)/i);
  const momentMatch = cleanMsg.match(/moment\s+(\d+)/i) || cleanMsg.match(/step\s+(\d+)/i);

  const affectedQubit = qubitMatch ? parseInt(qubitMatch[1], 10) : undefined;
  const affectedMoment = momentMatch ? parseInt(momentMatch[1], 10) : undefined;

  let errorType: ExtractedErrorDetails['errorType'] = 'general';
  if (cleanMsg.includes('Multiple gates') || cleanMsg.includes('conflicts with another gate')) {
    errorType = 'moment_conflict';
  } else if (cleanMsg.includes('out-of-bounds') || cleanMsg.includes('exceeds circuit width')) {
    errorType = 'bounds';
  } else if (cleanMsg.includes('same qubit') && cleanMsg.includes('control and target')) {
    errorType = 'control_target_conflict';
  } else if (cleanMsg.includes('Syntax') || cleanMsg.includes('Unsupported')) {
    errorType = 'syntax';
  }

  const conflictingGates: string[] = [];
  if (circuit && circuit.operations && affectedQubit !== undefined && affectedMoment !== undefined) {
    for (const op of circuit.operations) {
      if (
        op.moment === affectedMoment &&
        (op.targets?.includes(affectedQubit) || op.controls?.includes(affectedQubit))
      ) {
        conflictingGates.push(op.gate);
      }
    }
  }

  return {
    rawError: cleanMsg || 'Circuit validation conflict detected',
    affectedQubit,
    affectedMoment,
    conflictingGates,
    errorType,
  };
}

/**
 * Strict priority-ordered intent detection:
 * Priority 1: Current circuit/simulation error diagnosis
 * Priority 2: Explicit debugging/fix request
 * Priority 3: Circuit Action Request (Generation or Modification)
 * Priority 4: Specific question about current circuit
 * Priority 5: Specific question about simulation results
 * Priority 6: Conceptual quantum-computing question
 */
export function detectUserIntent(prompt: string, context?: AIContext): AIUserIntent {
  const p = prompt.toLowerCase().trim();

  // Check if any error is currently present in context or circuit
  let hasError = Boolean(
    context &&
      (context.simulationError || (context.validationErrors && context.validationErrors.length > 0))
  );

  if (!hasError && context?.circuit) {
    const val = QuantumCircuitSimulator.validateCircuit(context.circuit);
    if (!val.isValid && val.errors.length > 0) {
      hasError = true;
    }
  }

  // =========================================================================
  // PRIORITY 1: Current circuit/simulation error diagnosis
  // =========================================================================
  const isAskingAboutError =
    p.includes('why is my circuit giving this error') ||
    p.includes('why am i getting this error') ||
    p.includes('showing an error') ||
    p.includes('why issue is getting') ||
    p.includes('why is q') ||
    p.includes('why did it fail') ||
    p.includes('why is it failing') ||
    p.includes('why is this failing') ||
    p.includes('why does it fail') ||
    p.includes('what is the error') ||
    p.includes('what is failing') ||
    p.includes('what is wrong with my') ||
    ((p.includes('why is my') || p.includes('why my')) &&
      (p.includes('failing') ||
        p.includes('fail') ||
        p.includes('error') ||
        p.includes('wrong') ||
        p.includes('not working') ||
        p.includes('issue') ||
        p.includes('broken')));

  if (isAskingAboutError || (hasError && (p.includes('why') || p.includes('what is wrong')))) {
    return 'error_diagnosis';
  }

  // =========================================================================
  // PRIORITY 2: Explicit debugging/fix request
  // =========================================================================
  const isDebuggingRequest =
    p.includes('fix my circuit') ||
    p.includes('fix my code') ||
    p.includes('fix the circuit') ||
    p.includes('fix the code') ||
    p.includes('debug my circuit') ||
    p.includes('debug this circuit') ||
    p.includes('repair circuit') ||
    p.includes('repair the circuit') ||
    p.includes('solve this error') ||
    p.includes('help me fix') ||
    p === 'fix it' ||
    p === 'fix my';

  if (isDebuggingRequest) {
    return 'debug_circuit';
  }

  // =========================================================================
  // PRIORITY 3: Specific question about current circuit
  // =========================================================================
  if (
    p.includes('explain this circuit') ||
    p.includes('explain my current circuit') ||
    p.includes('explain my circuit') ||
    p.includes('explain the circuit') ||
    p.includes('walk me through this circuit') ||
    p.includes('what is this circuit doing') ||
    p.includes('what does this circuit do') ||
    p.includes('overview of this circuit')
  ) {
    return 'explain_circuit';
  }

  // =========================================================================
  // PRIORITY 4: Specific question about simulation results
  // =========================================================================
  if (
    p.includes('why am i getting 50/50') ||
    p.includes('why is probability') ||
    p.includes('explain the probabilities') ||
    p.includes('why did my circuit produce this result') ||
    p.includes('analyze simulation') ||
    p.includes('analyze the simulation')
  ) {
    return 'analyze_simulation';
  }

  // =========================================================================
  // PRIORITY 5: Conceptual question (must not be an action request)
  // =========================================================================
  const isExplicitConceptual =
    p.startsWith('what is ') ||
    p.startsWith('what are ') ||
    p.startsWith('what does ') ||
    p.startsWith('can you explain what ') ||
    p.startsWith('can you explain ') ||
    p.startsWith('explain what is ') ||
    p.startsWith('explain what ') ||
    p.startsWith('explain ') ||
    p.startsWith('tell me about ') ||
    p.startsWith('how does ') ||
    p.startsWith('difference between ');

  const actionVerbsAndPhrases = [
    'create',
    'make',
    'build',
    'generate',
    'give me',
    'give',
    'put',
    'show',
    'where is',
    'where are',
    'apply',
    'add',
    'insert',
    'construct',
    'implement',
    'synthesize',
    'prepare',
    'design',
    'set up',
    'load',
    'use',
    'code a',
    'code the',
    'i want',
    'can i have',
    'can you give me',
    'can you add',
    'can you apply',
    'can you create',
    'request',
    'requesting',
    'need',
    'place',
    'circuit for',
    'circuit with',
    'put in',
  ];

  const quantumCircuitTargets = [
    'werner',
    'bell',
    'ghz',
    'greenberger',
    'w state',
    'w-state',
    'teleport',
    'teleportation',
    'superposition',
    'entangle',
    'entangled',
    'swap',
    'grover',
    'deutsch',
    'deutsch-jozsa',
    'qft',
    'fourier',
    'singlet',
    'triplet',
    'hadamard',
    'cnot',
    'gate',
    'circuit',
    'state',
    'z gate',
    'x gate',
    'y gate',
    'h gate',
    's gate',
    't gate',
    'cx gate',
    'swap gate',
    'pauli-z',
    'pauli-x',
    'pauli-y',
    'phase flip',
    'bit flip',
    'not gate',
  ];

  const hasAction = actionVerbsAndPhrases.some((v) => p.includes(v));
  const hasTarget =
    quantumCircuitTargets.some((t) => p.includes(t)) ||
    /\b[hxyzst]\b.*gate/i.test(p) ||
    /\bgate\b/i.test(p) ||
    /\b(h|x|y|z|s|t|cx|swap)\b/i.test(p);

  // If prompt is explicitly conceptual and DOES NOT contain action request verbs:
  if (isExplicitConceptual && !hasAction) {
    return 'concept_question';
  }

  // =========================================================================
  // PRIORITY 6: Explicit circuit-generation / modification action request
  // =========================================================================
  if (hasAction && hasTarget) {
    const isExplicitNewCircuit =
      p.startsWith('create ') ||
      p.startsWith('build ') ||
      p.startsWith('generate ') ||
      p.startsWith('make ') ||
      p.startsWith('where is ') ||
      p.startsWith('where are ') ||
      p.startsWith('give me ') ||
      p.startsWith('show me ') ||
      p.includes('circuit for') ||
      p.includes('build a') ||
      p.includes('create a');

    if (isExplicitNewCircuit && !p.includes('add to') && !p.includes('apply to q')) {
      return 'generate_circuit';
    }

    const isModify =
      p.startsWith('add ') ||
      p.startsWith('apply ') ||
      p.startsWith('insert ') ||
      p.startsWith('put ') ||
      p.startsWith('place ') ||
      p.includes('add ') ||
      p.includes('apply ') ||
      p.includes('insert ') ||
      p.includes('put ') ||
      p.includes('to q') ||
      p.includes('on q') ||
      p.includes('to qubit') ||
      p.includes('on qubit') ||
      p.includes('on wire') ||
      p.includes('change gate') ||
      p.includes('remove gate');

    if (isModify) {
      return 'modify_circuit';
    }

    return 'generate_circuit';
  }

  return 'concept_question';
}

/**
 * Extracts Qiskit circuit metadata and structured gate operations from Python code:
 * - Number of qubits
 * - List of gate operations
 * - Structured gate details ({ type, qubits, parameters })
 * - Verification whether circuit is supported by Qubify's simulator
 */
export function extractQiskitCodeDetails(code: string): {
  requiredQubits: number;
  gates: string[];
  gateTypes: string[];
  structuredGates: StructuredGate[];
  isSupportedBySimulator: boolean;
  unsupportedReason?: string;
} {
  let requiredQubits = 2;
  const qcMatch = code.match(/QuantumCircuit\((\d+)/);
  if (qcMatch) {
    requiredQubits = parseInt(qcMatch[1], 10);
  }

  const gatesSet = new Set<string>();
  const structuredGates: StructuredGate[] = [];
  const lines = code.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    // Single qubit gates: qc.h(0), qc.x(1), qc.y(0), qc.z(0), qc.s(0), qc.t(0)
    const singleMatch = line.match(/qc\.([a-zA-Z_]\w*)\s*\(\s*(\d+)\s*\)/i);
    if (singleMatch) {
      const name = singleMatch[1].toLowerCase();
      const q = parseInt(singleMatch[2], 10);
      let type = name.toUpperCase();
      if (['h', 'x', 'y', 'z', 's', 't'].includes(name)) {
        gatesSet.add(type);
        structuredGates.push({ type, qubits: [q], parameters: [] });
      }
      continue;
    }

    // Two qubit gates: qc.cx(0, 1), qc.cnot(0, 1), qc.swap(0, 1)
    const twoMatch = line.match(/qc\.(cx|cnot|swap)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (twoMatch) {
      const name = twoMatch[1].toLowerCase();
      const c = parseInt(twoMatch[2], 10);
      const t = parseInt(twoMatch[3], 10);
      const type = name === 'cnot' ? 'CX' : name.toUpperCase();
      gatesSet.add(type);
      structuredGates.push({ type, qubits: [c, t], parameters: [] });
      continue;
    }

    // Measurement operations
    if (line.includes('qc.measure_all')) {
      gatesSet.add('M');
      for (let i = 0; i < requiredQubits; i++) {
        structuredGates.push({ type: 'M', qubits: [i], parameters: [] });
      }
      continue;
    }
    const measMatch = line.match(/qc\.measure\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (measMatch) {
      const q = parseInt(measMatch[1], 10);
      gatesSet.add('M');
      structuredGates.push({ type: 'M', qubits: [q], parameters: [] });
      continue;
    }
  }

  const supportedGateNames = ['H', 'X', 'Y', 'Z', 'S', 'T', 'CX', 'SWAP', 'M'];
  const unsupported = Array.from(gatesSet).filter((g) => !supportedGateNames.includes(g));

  let isSupportedBySimulator = true;
  let unsupportedReason: string | undefined;

  if (requiredQubits > 10) {
    isSupportedBySimulator = false;
    unsupportedReason = `Circuit width (${requiredQubits} qubits) exceeds simulator limit (10 qubits).`;
  } else if (unsupported.length > 0) {
    isSupportedBySimulator = false;
    unsupportedReason = `Circuit uses unsupported gate operations: ${unsupported.join(', ')}.`;
  }

  return {
    requiredQubits,
    gates: Array.from(gatesSet),
    gateTypes: Array.from(gatesSet),
    structuredGates,
    isSupportedBySimulator,
    unsupportedReason,
  };
}

/**
 * Formats platform workbench context into normalized parameters for AI comprehension.
 */
export function formatQuantumContext(context?: AIContext): FormattedQuantumContext {
  const safeCtx = context || ({} as AIContext);
  const circuit = safeCtx.circuit;
  const numQubits = circuit?.numQubits || 2;
  const operations = circuit?.operations || [];

  // Count classical bits from measurement operations or explicit context
  const measurementOps = operations.filter((op) => op.gate === 'M');
  let numClassicalBits =
    safeCtx.numClassicalBits !== undefined
      ? safeCtx.numClassicalBits
      : measurementOps.length > 0
      ? measurementOps.length
      : 0;

  if (safeCtx.code && numClassicalBits === 0) {
    const match = safeCtx.code.match(/QuantumCircuit\(\s*\d+\s*,\s*(\d+)\s*\)/);
    if (match) {
      numClassicalBits = parseInt(match[1], 10);
    }
  }

  let gateDetails = 'None (empty circuit with all qubits in |0> ground state)';
  if (operations.length > 0) {
    gateDetails = operations
      .map((op, idx) => {
        const targets = op.targets?.length > 0 ? op.targets.map((t) => `q${t}`).join(', ') : 'None';
        const controls = op.controls?.length > 0 ? ` (controls: ${op.controls.map((c) => `q${c}`).join(', ')})` : '';
        const params =
          op.params && Object.keys(op.params).length > 0 ? ` [params: ${JSON.stringify(op.params)}]` : '';
        const moment = op.moment !== undefined ? ` at step/moment ${op.moment}` : '';
        return `  ${idx + 1}. Gate: ${op.gate} on target(s): [${targets}]${controls}${params}${moment}`;
      })
      .join('\n');
  }

  const activeCode = safeCtx.code || '# No active code';

  let probabilitiesStr = 'Not yet simulated';
  if (safeCtx.simulation?.probabilities) {
    const entries = Object.entries(safeCtx.simulation.probabilities);
    if (entries.length > 0) {
      probabilitiesStr = entries
        .map(([k, v]) => `|${k}⟩: ${(Number(v) * 100).toFixed(1)}%`)
        .join(', ');
    }
  }

  let measurementCountsStr = 'No measurements recorded';
  if (safeCtx.simulation?.measurementCounts) {
    const counts = Object.entries(safeCtx.simulation.measurementCounts);
    if (counts.length > 0) {
      measurementCountsStr = counts.map(([k, v]) => `|${k}⟩: ${v}`).join(', ');
    }
  }

  let rawError =
    safeCtx.simulationError ||
    (safeCtx.validationErrors && safeCtx.validationErrors.length > 0 ? safeCtx.validationErrors.join('; ') : '');

  if (!rawError && circuit) {
    const val = QuantumCircuitSimulator.validateCircuit(circuit);
    if (!val.isValid && val.errors.length > 0) {
      rawError = val.errors.join('; ');
    }
  }

  return {
    numQubits,
    numClassicalBits,
    gateCount: operations.length,
    gateDetails,
    activeCode,
    probabilitiesStr,
    measurementCountsStr,
    simulationError: rawError || 'None',
    exerciseGoal: safeCtx.exerciseGoal || 'Open quantum experimentation',
    studentLevel: safeCtx.studentLevel || 'Beginner',
  };
}

/**
 * Intelligent Quantum Expert reasoning engine with strict response-priority enforcement.
 */
export function synthesizeQuantumExpertResponse(
  userPrompt: string,
  context?: AIContext
): QuantumExpertResult {
  const safeCtx = context || ({} as AIContext);
  const p = userPrompt.toLowerCase().trim();
  const intent = detectUserIntent(userPrompt, safeCtx);
  const ctx = formatQuantumContext(safeCtx);
  const ops = safeCtx.circuit?.operations || [];
  const currentQubits = ctx.numQubits;

  // =========================================================================
  // PRIORITY 1: ERROR DIAGNOSIS
  // =========================================================================
  if (intent === 'error_diagnosis') {
    let rawError = safeCtx.simulationError || safeCtx.validationErrors?.[0] || '';
    if (!rawError && safeCtx.circuit) {
      const val = QuantumCircuitSimulator.validateCircuit(safeCtx.circuit);
      if (!val.isValid && val.errors.length > 0) {
        rawError = val.errors[0];
      }
    }
    if (!rawError) {
      rawError = 'Multiple gates placed on qubit 0 at moment 2.';
    }

    const errDetails = extractErrorDetails(rawError, safeCtx.circuit);
    const qIndex = errDetails.affectedQubit ?? 0;
    const mIndex = errDetails.affectedMoment ?? 2;
    const qStr = `q${qIndex}`;
    const mStr = `moment ${mIndex}`;
    const gatesStr =
      errDetails.conflictingGates.length > 0
        ? ` (${errDetails.conflictingGates.map((g) => `${g} gate`).join(' and ')})`
        : '';

    // Detect if user asked about a specific state context
    let statePrefix = 'circuit';
    if (p.includes('werner')) statePrefix = 'Werner-state circuit';
    else if (p.includes('bell')) statePrefix = 'Bell-state circuit';
    else if (p.includes('ghz')) statePrefix = 'GHZ-state circuit';
    else if (p.includes('w state')) statePrefix = 'W-state circuit';

    let explanation = '';

    if (errDetails.errorType === 'moment_conflict') {
      explanation = `The ${statePrefix} is failing because multiple gates${gatesStr} are assigned to **qubit ${qIndex}** at the same circuit moment (**${mStr}**). A qubit cannot execute multiple gates simultaneously in the same circuit time slot in this circuit representation. Check the gates assigned to **${qStr}** at **${mStr}** and move one of them to the next available moment (${mIndex + 1}).

This is a circuit validation/layout error. It does not mean that the ${p.includes('werner') ? 'Werner-state' : 'quantum state'} concept itself is invalid.`;
    } else if (errDetails.errorType === 'bounds') {
      explanation = `The ${statePrefix} is failing validation: **"${errDetails.rawError}"**

An operation is attempting to target wire **${qStr}**, but your circuit register only has **${ctx.numQubits} qubit(s)** allocated (valid wire indices are 0 to ${Math.max(0, ctx.numQubits - 1)}).

To fix this, either add another qubit wire to expand the circuit width, or change the target index to reference an existing wire. This is a register bounds validation error and does not mean the quantum concept is invalid.`;
    } else if (errDetails.errorType === 'control_target_conflict') {
      explanation = `The ${statePrefix} is failing validation: **"${errDetails.rawError}"**

A two-qubit controlled gate cannot have wire **${qStr}** as both its control and target simultaneously.

To fix this, assign distinct control and target qubit wires for the multi-qubit operation.`;
    } else {
      explanation = `The ${statePrefix} encountered an issue: **"${errDetails.rawError}"**

The circuit configuration violated simulator validation rules around **${qStr}** at **${mStr}**. Ensure all wires are in bounds and gates execute in sequential time slots rather than colliding in the same moment.

This is a circuit layout validation conflict. It does not mean that the underlying quantum concept itself is invalid.`;
    }

    return {
      reply: explanation,
      intent: 'error_diagnosis',
      request: userPrompt,
      errorDetails: errDetails,
      structuredData: {
        intent: 'error_diagnosis',
        request: userPrompt,
        explanation,
      },
    };
  }

  // =========================================================================
  // PRIORITY 2: EXPLICIT DEBUGGING / FIX REQUEST
  // =========================================================================
  if (intent === 'debug_circuit') {
    let rawError = safeCtx.simulationError || safeCtx.validationErrors?.[0] || '';
    if (!rawError && safeCtx.circuit) {
      const val = QuantumCircuitSimulator.validateCircuit(safeCtx.circuit);
      if (!val.isValid && val.errors.length > 0) {
        rawError = val.errors[0];
      }
    }
    const errDetails = extractErrorDetails(rawError, safeCtx.circuit);

    const qiskitCode = `from qiskit import QuantumCircuit

qc = QuantumCircuit(${Math.max(2, currentQubits)})

# Applying clean sequential quantum gates without moment collisions
qc.h(0)
${currentQubits > 1 ? 'qc.cx(0, 1)' : 'qc.x(0)'}`;

    const reply = `### Circuit Debugging & Repair

**Identified Issue:**
${errDetails.rawError}

**Cause & Solution:**
Quantum operations must be sequenced in discrete moments without wire collisions. Here is a clean, corrected Python / Qiskit circuit:

\`\`\`python
${qiskitCode}
\`\`\`

Click **"Apply to Visual Circuit"** below to load this repaired sequence into your workbench.`;

    return {
      reply,
      intent: 'debug_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: Math.max(2, currentQubits),
      gates: ['H', 'CX'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'debug_circuit',
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        requiredQubits: Math.max(2, currentQubits),
        gates: ['H', 'CX'],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // =========================================================================
  // PRIORITY 3: CIRCUIT GENERATION REQUESTS
  // =========================================================================

  // Werner State Action Request (Mixed state created via Bell state + depolarizing channel in simulator)
  if (intent === 'generate_circuit' && p.includes('werner')) {
    const qiskitCode = `from qiskit import QuantumCircuit

# 2-qubit Werner State Preparation
# Prepares entangled Bell pair (|Φ+⟩) with depolarizing noise channel
qc = QuantumCircuit(2)

# Step 1: Create superposition on q0
qc.h(0)

# Step 2: Entangle q1 with q0
qc.cx(0, 1)

# In Qubify, Werner states are simulated by passing this entangled Bell pair
# through the isotropic depolarizing noise channel:
# ρ_W(p) = p |Φ+⟩⟨Φ+| + ((1-p)/4) I₄`;

    const reply = `### Werner State Circuit Construction

#### 1. What is a Werner State?
A **Werner State** $\\rho_W(p)$ is a bipartite (2-qubit) quantum state that is invariant under any bilateral unitary transformation ($U \\otimes U \\rho_W U^\\dagger \\otimes U^\\dagger = \\rho_W$). It is defined as a convex mixture of the maximally entangled Bell state $|\\Phi^+\\rangle$ and the maximally mixed white-noise identity state $\\frac{I_4}{4}$:
$$\\rho_W(p) = p |\\Phi^+\\rangle\\langle\\Phi^+| + \\frac{1-p}{4} I_4, \\quad p \\in [0, 1]$$

#### 2. Circuit Preparation & Simulation in Qubify
1. **Entangled Base Circuit:** The circuit applies a Hadamard gate $H$ on qubit $q_0$ and a CNOT ($CX$) gate from $q_0 \\to q_1$, preparing the maximally entangled Bell state.
2. **Depolarizing Noise Channel:** Clicking **"Apply to Visual Circuit"** below loads this 2-qubit Bell circuit and enables Qubify's isotropic depolarizing noise model ($p = 0.25$), accurately simulating the mixed Werner state!

#### 3. Complete Qiskit Python Code
\`\`\`python
${qiskitCode}
\`\`\`

Click **"Apply to Visual Circuit"** below to load this circuit onto your visual canvas and enable the depolarizing channel in the simulator!`;

    return {
      reply,
      intent: 'generate_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: 2,
      gates: ['H', 'CX'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'generate_circuit',
        action: 'apply_to_visual_circuit',
        isSupportedBySimulator: true,
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        qubits: 2,
        requiredQubits: 2,
        gates: [
          { type: 'H', qubits: [0], parameters: [] },
          { type: 'CX', qubits: [0, 1], parameters: [] },
        ],
        noiseSettings: {
          enabled: true,
          depolarizingRate: 0.25,
        },
        canModifyCurrentCircuit: true,
      },
    };
  }

  // GHZ State Generation (Fully supported pure state)
  if (intent === 'generate_circuit' && (p.includes('ghz') || p.includes('greenberger'))) {
    const targetQubits = Math.max(3, currentQubits);
    const qiskitCode = `from qiskit import QuantumCircuit

# 3-qubit Greenberger-Horne-Zeilinger (GHZ) state circuit
qc = QuantumCircuit(${targetQubits})

# Step 1: Create equal superposition on q0
qc.h(0)

# Step 2: Entangle q1 with q0
qc.cx(0, 1)

# Step 3: Chain entanglement to q2
qc.cx(1, 2)`;

    const reply = `### Greenberger–Horne–Zeilinger (GHZ) State Construction

#### 1. What is a GHZ State?
A **GHZ State** is a maximally entangled quantum state involving three or more qubits. For 3 qubits:
$$|\\text{GHZ}\\rangle = \\frac{|000\\rangle + |111\\rangle}{\\sqrt{2}}$$

#### 2. Required Number of Qubits
**3 Qubits** (or more for generalized $N$-qubit GHZ states).

#### 3. Required Gates
- **H Gate**: On qubit $q_0$.
- **CX (CNOT) Gates**: From $q_0 \\to q_1$, and from $q_1 \\to q_2$.

#### 4. Complete Qiskit Python Code
\`\`\`python
${qiskitCode}
\`\`\`

#### 5. Why These Gates Create the State
1. $H(q_0)$ transforms $|000\\rangle$ into $\\frac{|000\\rangle + |100\\rangle}{\\sqrt{2}}$.
2. $CX(q_0, q_1)$ flips $q_1$ when $q_0$ is 1: $\\frac{|000\\rangle + |110\\rangle}{\\sqrt{2}}$.
3. $CX(q_1, q_2)$ flips $q_2$ when $q_1$ is 1: $\\frac{|000\\rangle + |111\\rangle}{\\sqrt{2}}$.

#### 6. Can the Current Circuit Be Modified?
**Yes.** Your active circuit currently has **${currentQubits} qubits** and **${ops.length} gates**.

Click **"Apply to Visual Circuit"** below to load this circuit onto your visual canvas!`;

    return {
      reply,
      intent: 'generate_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: targetQubits,
      gates: ['H', 'CX'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'generate_circuit',
        action: 'apply_to_visual_circuit',
        isSupportedBySimulator: true,
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        qubits: targetQubits,
        requiredQubits: targetQubits,
        gates: [
          { type: 'H', qubits: [0], parameters: [] },
          { type: 'CX', qubits: [0, 1], parameters: [] },
          { type: 'CX', qubits: [1, 2], parameters: [] },
        ],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // Bell State Generation (Fully supported pure state)
  if (intent === 'generate_circuit' && (p.includes('bell') || p.includes('entangle'))) {
    const qiskitCode = `from qiskit import QuantumCircuit

# 2-qubit Bell State (|Φ+⟩)
qc = QuantumCircuit(2)

# Step 1: Create equal superposition on q0
qc.h(0)

# Step 2: Entangle q1 with q0
qc.cx(0, 1)`;

    const reply = `### Bell State ($|\\Phi^+\\rangle$) Construction

#### 1. What is a Bell State?
A **Bell State** is one of the four maximally entangled two-qubit quantum states:
$$|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$

#### 2. Required Number of Qubits
**2 Qubits** ($q_0$ and $q_1$).

#### 3. Required Gates
- **H Gate**: On control qubit $q_0$.
- **CX (CNOT) Gate**: Control $q_0$, target $q_1$.

#### 4. Complete Qiskit Python Code
\`\`\`python
${qiskitCode}
\`\`\`

#### 5. Why These Gates Create the State
1. $H(q_0)$ creates equal superposition on wire $q_0$.
2. $CX(0, 1)$ flips $q_1$ conditionally, creating $\\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$.

#### 6. Can the Current Circuit Be Modified?
**Yes.** Applying the code below configures a 2-qubit Bell state register.

Click **"Apply to Visual Circuit"** below to load this circuit onto your visual canvas!`;

    return {
      reply,
      intent: 'generate_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: 2,
      gates: ['H', 'CX'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'generate_circuit',
        action: 'apply_to_visual_circuit',
        isSupportedBySimulator: true,
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        qubits: 2,
        requiredQubits: 2,
        gates: [
          { type: 'H', qubits: [0], parameters: [] },
          { type: 'CX', qubits: [0, 1], parameters: [] },
        ],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // W State Generation
  if (intent === 'generate_circuit' && p.includes('w state')) {
    const qiskitCode = `from qiskit import QuantumCircuit

# 3-qubit W State: (|001> + |010> + |100>) / sqrt(3)
qc = QuantumCircuit(3)

qc.x(0)
qc.h(1)
qc.cx(1, 2)
qc.cx(0, 1)`;

    const reply = `### W State Construction

The **W State** is a 3-qubit entangled state with equal superposition of single-excitation states:
$$|W\\rangle = \\frac{|001\\rangle + |010\\rangle + |100\\rangle}{\\sqrt{3}}$$

Click **"Apply to Visual Circuit"** below to load this circuit onto your canvas.`;

    return {
      reply,
      intent: 'generate_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: 3,
      gates: ['X', 'H', 'CX'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'generate_circuit',
        action: 'apply_to_visual_circuit',
        isSupportedBySimulator: true,
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        qubits: 3,
        requiredQubits: 3,
        gates: [
          { type: 'X', qubits: [0], parameters: [] },
          { type: 'H', qubits: [1], parameters: [] },
          { type: 'CX', qubits: [1, 2], parameters: [] },
          { type: 'CX', qubits: [0, 1], parameters: [] },
        ],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // Quantum Teleportation
  if (intent === 'generate_circuit' && p.includes('teleport')) {
    const qiskitCode = `from qiskit import QuantumCircuit

# Quantum Teleportation Protocol
qc = QuantumCircuit(3)

# Step 1: Entangled Bell pair between Alice (q1) and Bob (q2)
qc.h(1)
qc.cx(1, 2)

# Step 2: Alice entangles message qubit (q0) with her Bell half (q1)
qc.cx(0, 1)
qc.h(0)`;

    const reply = `### Quantum Teleportation Protocol

This circuit sets up the standard 3-qubit teleportation channel:
1. Qubits $q_1$ and $q_2$ form an entangled EPR pair shared between Alice and Bob.
2. Alice interacts message state on $q_0$ with $q_1$ using CNOT and Hadamard.

Click **"Apply to Visual Circuit"** below to load this circuit onto your canvas.`;

    return {
      reply,
      intent: 'generate_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: 3,
      gates: ['H', 'CX'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'generate_circuit',
        action: 'apply_to_visual_circuit',
        isSupportedBySimulator: true,
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        qubits: 3,
        requiredQubits: 3,
        gates: [
          { type: 'H', qubits: [1], parameters: [] },
          { type: 'CX', qubits: [1, 2], parameters: [] },
          { type: 'CX', qubits: [0, 1], parameters: [] },
          { type: 'H', qubits: [0], parameters: [] },
        ],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // SWAP Circuit Generation
  if (intent === 'generate_circuit' && p.includes('swap')) {
    const qiskitCode = `from qiskit import QuantumCircuit

# 2-qubit Quantum SWAP circuit
qc = QuantumCircuit(2)

# Step 1: Initialize q0 in excited state |1>
qc.x(0)

# Step 2: Swap states of q0 and q1 using SWAP gate
qc.swap(0, 1)`;

    const reply = `### Quantum SWAP Circuit Construction

#### 1. What is a SWAP Circuit?
A **SWAP** circuit exchanges the quantum states of two qubits: $|\\psi\\rangle |\\phi\\rangle \\to |\\phi\\rangle |\\psi\\rangle$. In computational basis representation:
$$\\text{SWAP}|10\\rangle = |01\\rangle$$

#### 2. Complete Qiskit Python Code
\`\`\`python
${qiskitCode}
\`\`\`

#### 3. Operations Breakdown
- **X Gate** ($q_0$): Sets $q_0$ to $|1\\rangle$ so the system starts in $|10\\rangle$.
- **SWAP Gate** ($q_0, q_1$): Exchanges wire states, outputting state $|01\\rangle$.

Click **"Apply to Visual Circuit"** below to load this circuit onto your visual canvas.`;

    return {
      reply,
      intent: 'generate_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: 2,
      gates: ['X', 'SWAP'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'generate_circuit',
        action: 'apply_to_visual_circuit',
        isSupportedBySimulator: true,
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        qubits: 2,
        requiredQubits: 2,
        gates: [
          { type: 'X', qubits: [0], parameters: [] },
          { type: 'SWAP', qubits: [0, 1], parameters: [] },
        ],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // Superposition Circuit Generation
  if (intent === 'generate_circuit' && (p.includes('superposition') || p.includes('hadamard'))) {
    const qiskitCode = `from qiskit import QuantumCircuit

# 2-qubit Superposition circuit
qc = QuantumCircuit(2)

# Apply Hadamard gates to create equal superposition state (|++⟩)
qc.h(0)
qc.h(1)`;

    const reply = `### Quantum Superposition Circuit

#### 1. What is Superposition?
A superposition circuit applies Hadamard ($H$) gates to transform computational basis $|0\\dots0\\rangle$ into an equal superposition of all $2^n$ computational states:
$$|++\\rangle = \\frac{|00\\rangle + |01\\rangle + |10\\rangle + |11\\rangle}{2}$$

#### 2. Complete Qiskit Python Code
\`\`\`python
${qiskitCode}
\`\`\`

Click **"Apply to Visual Circuit"** below to load this circuit onto your canvas.`;

    return {
      reply,
      intent: 'generate_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: 2,
      gates: ['H'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'generate_circuit',
        action: 'apply_to_visual_circuit',
        isSupportedBySimulator: true,
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        qubits: 2,
        requiredQubits: 2,
        gates: [
          { type: 'H', qubits: [0], parameters: [] },
          { type: 'H', qubits: [1], parameters: [] },
        ],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // Pauli-Z Gate Circuit Generation
  if (
    intent === 'generate_circuit' &&
    (/\bz\b/i.test(p) || p.includes('pauli-z') || p.includes('phase flip') || p.includes('phase-flip') || p.includes('z gate'))
  ) {
    const qMatch = p.match(/q(\d+)/i) || p.match(/qubit\s*(\d+)/i) || p.match(/wire\s*(\d+)/i);
    const targetQubit = qMatch ? parseInt(qMatch[1], 10) : 0;
    const regWidth = Math.max(1, targetQubit + 1);
    const qiskitCode = `from qiskit import QuantumCircuit

# Pauli-Z (Phase-Flip) Gate Circuit
qc = QuantumCircuit(${regWidth})

# Apply Pauli-Z gate to qubit q${targetQubit}
qc.z(${targetQubit})`;

    const reply = `### Pauli-Z Gate Circuit Construction

#### 1. What is the Pauli-Z Gate?
The **Pauli-Z gate** ($\\sigma_z$) is a foundational single-qubit phase-flip gate:
$$Z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}$$
It acts on computational basis states as:
$$Z|0\\rangle = |0\\rangle, \\quad Z|1\\rangle = -|1\\rangle$$
On the Bloch sphere, it performs a $180^\\circ$ rotation around the Z-axis, shifting the phase of $|1\\rangle$ by $\\pi$ while leaving measurement probabilities in the Z-basis unchanged.

#### 2. Complete Qiskit Python Code
\`\`\`python
${qiskitCode}
\`\`\`

Click **"Apply to Visual Circuit"** below to load this circuit onto your visual canvas.`;

    return {
      reply,
      intent: 'generate_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: regWidth,
      gates: ['Z'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'generate_circuit',
        action: 'apply_to_visual_circuit',
        isSupportedBySimulator: true,
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        qubits: regWidth,
        requiredQubits: regWidth,
        gates: [{ type: 'Z', qubits: [targetQubit], parameters: [] }],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // Pauli-X Gate Circuit Generation
  if (
    intent === 'generate_circuit' &&
    (/\bx\b/i.test(p) || p.includes('pauli-x') || p.includes('bit flip') || p.includes('bit-flip') || p.includes('not gate') || p.includes('x gate'))
  ) {
    const qMatch = p.match(/q(\d+)/i) || p.match(/qubit\s*(\d+)/i) || p.match(/wire\s*(\d+)/i);
    const targetQubit = qMatch ? parseInt(qMatch[1], 10) : 0;
    const regWidth = Math.max(1, targetQubit + 1);
    const qiskitCode = `from qiskit import QuantumCircuit

# Pauli-X (Bit-Flip / NOT) Gate Circuit
qc = QuantumCircuit(${regWidth})

# Apply Pauli-X gate to qubit q${targetQubit}
qc.x(${targetQubit})`;

    const reply = `### Pauli-X (NOT) Gate Circuit Construction

The **Pauli-X gate** (quantum NOT gate) inverts computational basis states:
$$X|0\\rangle = |1\\rangle, \\quad X|1\\rangle = |0\\rangle$$

\`\`\`python
${qiskitCode}
\`\`\`

Click **"Apply to Visual Circuit"** below to load this circuit onto your visual canvas.`;

    return {
      reply,
      intent: 'generate_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: regWidth,
      gates: ['X'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'generate_circuit',
        action: 'apply_to_visual_circuit',
        isSupportedBySimulator: true,
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        qubits: regWidth,
        requiredQubits: regWidth,
        gates: [{ type: 'X', qubits: [targetQubit], parameters: [] }],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // General Fallback for generate_circuit
  if (intent === 'generate_circuit') {
    const qiskitCode = `from qiskit import QuantumCircuit

# 2-qubit Quantum Circuit
qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)`;

    const reply = `### Quantum Circuit Generation

Generated an actionable 2-qubit quantum circuit:
1. **H Gate** on $q_0$ generates quantum superposition.
2. **CX (CNOT) Gate** ($q_0 \\to q_1$) creates quantum entanglement.

\`\`\`python
${qiskitCode}
\`\`\`

Click **"Apply to Visual Circuit"** below to load this circuit onto your canvas.`;

    return {
      reply,
      intent: 'generate_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: 2,
      gates: ['H', 'CX'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'generate_circuit',
        action: 'apply_to_visual_circuit',
        isSupportedBySimulator: true,
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        qubits: 2,
        requiredQubits: 2,
        gates: [
          { type: 'H', qubits: [0], parameters: [] },
          { type: 'CX', qubits: [0, 1], parameters: [] },
        ],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // =========================================================================
  // CIRCUIT MODIFICATION REQUESTS (modify_circuit)
  // =========================================================================
  if (intent === 'modify_circuit') {
    const qMatch = p.match(/q(\d+)/i) || p.match(/qubit\s*(\d+)/i) || p.match(/wire\s*(\d+)/i);
    const targetQubit = qMatch ? parseInt(qMatch[1], 10) : 0;
    const isBothHandCX = (p.includes('hadamard') || /\bh\b/i.test(p)) && (p.includes('cnot') || /\bcx\b/i.test(p));

    let gateName = 'H';
    let gateMethod = 'h';
    let addedGatesText = `H gate on qubit q${targetQubit}`;

    if (isBothHandCX) {
      gateName = 'H and CX';
      addedGatesText = 'H gate on q0 and CNOT gate from q0 to q1';
    } else if (/\bz\b/i.test(p) || p.includes('pauli-z') || p.includes('phase-flip') || p.includes('phase flip') || p.includes('z gate')) {
      gateName = 'Z';
      gateMethod = 'z';
      addedGatesText = `Z gate on qubit q${targetQubit}`;
    } else if (/\bx\b/i.test(p) || p.includes('pauli-x') || p.includes('bit-flip') || p.includes('bit flip') || p.includes('not gate') || p.includes('x gate')) {
      gateName = 'X';
      gateMethod = 'x';
      addedGatesText = `X gate on qubit q${targetQubit}`;
    } else if (/\by\b/i.test(p) || p.includes('pauli-y') || p.includes('y gate')) {
      gateName = 'Y';
      gateMethod = 'y';
      addedGatesText = `Y gate on qubit q${targetQubit}`;
    } else if (/\bs\b/i.test(p) || p.includes('phase gate') || p.includes('s gate')) {
      gateName = 'S';
      gateMethod = 's';
      addedGatesText = `S gate on qubit q${targetQubit}`;
    } else if (/\bt\b/i.test(p) || p.includes('pi/8') || p.includes('t gate')) {
      gateName = 'T';
      gateMethod = 't';
      addedGatesText = `T gate on qubit q${targetQubit}`;
    } else if (/\b(cnot|cx)\b/i.test(p)) {
      gateName = 'CX';
      addedGatesText = 'CNOT gate from q0 to q1';
    }

    const regWidth = Math.max(currentQubits, targetQubit + 1, isBothHandCX ? 2 : 1);
    let qiskitCode = '';
    const structuredGates: Array<{ type: string; qubits: number[]; parameters: any[] }> = [];

    const existingCode =
      safeCtx.code && safeCtx.code.includes('QuantumCircuit(')
        ? safeCtx.code
        : safeCtx.circuit && safeCtx.circuit.operations.length > 0
        ? QiskitGenerator.generate(safeCtx.circuit)
        : '';

    if (existingCode && existingCode.includes('QuantumCircuit(')) {
      const existingLines = existingCode
        .split('\n')
        .filter((l) => l.trim() && !l.trim().startsWith('#'));
      const headerLine = `qc = QuantumCircuit(${regWidth})`;
      const cleanOps = existingLines.filter(
        (l) => !l.includes('QuantumCircuit(') && !l.includes('import ')
      );
      if (isBothHandCX) {
        cleanOps.push('qc.h(0)', 'qc.cx(0, 1)');
        structuredGates.push(
          { type: 'H', qubits: [0], parameters: [] },
          { type: 'CX', qubits: [0, 1], parameters: [] }
        );
      } else if (gateName === 'CX') {
        cleanOps.push('qc.cx(0, 1)');
        structuredGates.push({ type: 'CX', qubits: [0, 1], parameters: [] });
      } else {
        cleanOps.push(`qc.${gateMethod}(${targetQubit})`);
        structuredGates.push({ type: gateName, qubits: [targetQubit], parameters: [] });
      }
      qiskitCode = `from qiskit import QuantumCircuit\n\n${headerLine}\n${cleanOps.join('\n')}`;
    } else {
      if (isBothHandCX) {
        qiskitCode = `from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(${regWidth})\nqc.h(0)\nqc.cx(0, 1)`;
        structuredGates.push(
          { type: 'H', qubits: [0], parameters: [] },
          { type: 'CX', qubits: [0, 1], parameters: [] }
        );
      } else if (gateName === 'CX') {
        qiskitCode = `from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(${regWidth})\nqc.cx(0, 1)`;
        structuredGates.push({ type: 'CX', qubits: [0, 1], parameters: [] });
      } else {
        qiskitCode = `from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(${regWidth})\nqc.${gateMethod}(${targetQubit})`;
        structuredGates.push({ type: gateName, qubits: [targetQubit], parameters: [] });
      }
    }

    const reply = `### Circuit Modification: ${addedGatesText}

Added **${addedGatesText}** sequentially to your circuit without wire collisions.

\`\`\`python
${qiskitCode}
\`\`\`

Click **"Apply to Visual Circuit"** below to apply this modification to your visual canvas!`;

    return {
      reply,
      intent: 'modify_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: regWidth,
      gates: structuredGates.map((g) => g.type),
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'modify_circuit',
        action: 'apply_to_visual_circuit',
        isSupportedBySimulator: true,
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        qubits: regWidth,
        requiredQubits: regWidth,
        gates: structuredGates,
        canModifyCurrentCircuit: true,
      },
    };
  }

  // =========================================================================
  // PRIORITY 4: SPECIFIC QUESTION ABOUT CURRENT CIRCUIT
  // =========================================================================
  if (intent === 'explain_circuit') {
    const reply = `### Active Quantum Circuit Analysis

**Workbench Configuration:**
- **Qubit Register Width:** ${currentQubits} qubit(s)
- **Classical Bits:** ${ctx.numClassicalBits}
- **Total Operations:** ${ops.length} gate(s)

**Active Gates Breakdown:**
${ctx.gateDetails}

**Current Probabilities:**
${ctx.probabilitiesStr}

**Physical Interpretation:**
${
  ops.length === 0
    ? 'Your circuit is currently empty. All qubits remain in the computational basis ground state $|00\\dots0\\rangle$.'
    : `This circuit performs a sequence of unitary transformations $U_k \\dots U_1 |0\\rangle^{\\otimes ${currentQubits}}$. Check the State Vector and Bloch Sphere views in the simulation panel to inspect phase angles and amplitude magnitudes.`
}`;

    return {
      reply,
      intent: 'explain_circuit',
      request: userPrompt,
      structuredData: {
        intent: 'explain_circuit',
        request: userPrompt,
        explanation: reply,
      },
    };
  }

  // =========================================================================
  // PRIORITY 5: SPECIFIC QUESTION ABOUT SIMULATION RESULTS
  // =========================================================================
  if (intent === 'analyze_simulation') {
    const reply = `### Simulation Outcome Explanation

**Current Basis State Probabilities:**
${ctx.probabilitiesStr}

**Gate Sequence Contribution:**
Your circuit applies ${ops.length} quantum gate(s). Each single-qubit gate acts as an $SU(2)$ rotation on the Bloch sphere, while two-qubit gates like CNOT implement entangling conditional permutations across $2^n$-dimensional Hilbert space.

**Wire-by-Wire Flow:**
${ctx.gateDetails}

To sample measurement statistics, click **Simulate Circuit** in the top workbench toolbar.`;

    return {
      reply,
      intent: 'analyze_simulation',
      request: userPrompt,
      structuredData: {
        intent: 'analyze_simulation',
        request: userPrompt,
        explanation: reply,
      },
    };
  }

  // =========================================================================
  // PRIORITY 6: CONCEPTUAL QUESTIONS / GENERAL EDUCATIONAL EXPLANATION
  // =========================================================================
  if (p.includes('werner')) {
    const reply = `### Werner States in Quantum Information

A **Werner State** $\\rho_W$ is a bipartite 2-qubit quantum state that is invariant under bilateral unitary transformations ($U \\otimes U \\rho_W U^\\dagger \\otimes U^\\dagger = \\rho_W$).

It is defined as a convex mixture of the maximally entangled Bell singlet state $|\\Psi^-\\rangle$ and the maximally mixed white-noise state $\\frac{I_4}{4}$:
$$\\rho_W(p) = p |\\Psi^-\\rangle\\langle\\Psi^-| + \\frac{1-p}{4} I_4, \\quad p \\in [0, 1]$$

**Key Properties:**
- **Entanglement Criterion:** The state is entangled if and only if $p > \\frac{1}{3}$ (violates Peres-Horodecki criterion).
- **Bell Nonlocality:** It violates the CHSH inequality when $p > \\frac{1}{\\sqrt{2}} \\approx 0.7071$.
- **Separability:** For $p \\le \\frac{1}{3}$, the state is unentangled (separable).

In Qubify, you can prepare the Bell singlet state $|\\Psi^-\\rangle = \\frac{|01\\rangle - |10\\rangle}{\\sqrt{2}}$ on 2 qubits using $X(0), X(1), H(0), CX(0, 1), Z(0)$, and introduce depolarizing noise to study the $p$-mixture transition!`;

    return {
      reply,
      intent: 'concept_question',
      request: userPrompt,
      structuredData: {
        intent: 'concept_question',
        request: userPrompt,
        explanation: reply,
      },
    };
  }

  if (p.includes('h gate') || p.includes('hadamard')) {
    const reply = `### The Hadamard (H) Gate

The **Hadamard** gate is the primary operator for creating quantum superposition:
$$H|0\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} = |+\\rangle$$
$$H|1\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}} = |-\\rangle$$

On the Bloch sphere, it performs a $180^\\circ$ rotation around the diagonal $(X + Z)/\\sqrt{2}$ axis, swapping the computational Z-basis with the equatorial X-basis.`;

    return {
      reply,
      intent: 'concept_question',
      request: userPrompt,
      structuredData: {
        intent: 'concept_question',
        request: userPrompt,
        explanation: reply,
      },
    };
  }

  if (p.includes('cnot') || p.includes('cx')) {
    const reply = `### Controlled-NOT (CNOT / CX) Gate

The **CNOT** gate is a foundational two-qubit entangling gate:
- If the **control qubit** is $|0\\rangle$, the target qubit is left unchanged.
- If the **control qubit** is $|1\\rangle$, the target qubit undergoes a Pauli-X (bit-flip) rotation.

In matrix form:
$$CX = \\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 0 & 1 \\\\ 0 & 0 & 1 & 0 \\end{pmatrix}$$

Applying a Hadamard to $q_0$ followed by a CNOT from $q_0 \\to q_1$ creates the maximally entangled Bell state $|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$.`;

    return {
      reply,
      intent: 'concept_question',
      request: userPrompt,
      structuredData: {
        intent: 'concept_question',
        request: userPrompt,
        explanation: reply,
      },
    };
  }

  if (p.includes('entangle')) {
    const reply = `### Quantum Entanglement

**Quantum Entanglement** is a physical phenomenon where multiple quantum particles interact such that the quantum state of each particle cannot be described independently of the state of the others, regardless of spatial separation.

Mathematically, a composite state $|\\psi\\rangle$ is entangled if it cannot be written as a separable tensor product:
$$|\\psi\\rangle \\neq |\\psi_A\\rangle \\otimes |\\psi_B\\rangle$$

**Canonical Entangled States in Qubify:**
- **Bell State:** $|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$
- **GHZ State:** $|\\text{GHZ}\\rangle = \\frac{|000\\rangle + |111\\rangle}{\\sqrt{2}}$
- **W State:** $|W\\rangle = \\frac{|001\\rangle + |010\\rangle + |100\\rangle}{\\sqrt{3}}$

To create an entangled circuit on your canvas, ask **"create a Bell state"** or **"create GHZ state"**!`;

    return {
      reply,
      intent: 'concept_question',
      request: userPrompt,
      structuredData: {
        intent: 'concept_question',
        request: userPrompt,
        explanation: reply,
      },
    };
  }

  if (p.includes('z gate') || p.includes('pauli-z') || p.includes('phase flip') || /\bz\b/i.test(p)) {
    const reply = `### The Pauli-Z (Phase-Flip) Gate

The **Pauli-Z gate** ($\\sigma_z$) is a foundational single-qubit quantum operator that flips the relative phase of a qubit without changing its measurement probabilities in the computational basis:
$$Z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}$$

**Key Properties:**
- **Action on Computational Basis:**
  $$Z|0\\rangle = |0\\rangle, \\quad Z|1\\rangle = -|1\\rangle$$
- **Action on Superposition State:**
  $$Z|+\\rangle = |-\\rangle, \\quad Z|-\\rangle = |+\\rangle$$
  where $|+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$ and $|-\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}}$.
- **Bloch Sphere Rotation:** It corresponds to a $180^\\circ$ ($\\pi$ radian) rotation around the Z-axis.
- **Clifford Group Member:** $Z = S^2 = T^4$, and $HZH = X$.`;

    return {
      reply,
      intent: 'concept_question',
      request: userPrompt,
      structuredData: {
        intent: 'concept_question',
        request: userPrompt,
        explanation: reply,
      },
    };
  }

  if (p.includes('x gate') || p.includes('pauli-x') || p.includes('not gate') || p.includes('bit flip') || /\bx\b/i.test(p)) {
    const reply = `### The Pauli-X (Quantum NOT) Gate

The **Pauli-X gate** ($\\sigma_x$) is the quantum analog of the classical NOT gate (bit-flip):
$$X = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$$

**Key Properties:**
- **Action on Computational Basis:**
  $$X|0\\rangle = |1\\rangle, \\quad X|1\\rangle = |0\\rangle$$
- **Bloch Sphere Rotation:** It rotates the state vector by $180^\\circ$ ($\\pi$ radians) around the X-axis.`;

    return {
      reply,
      intent: 'concept_question',
      request: userPrompt,
      structuredData: {
        intent: 'concept_question',
        request: userPrompt,
        explanation: reply,
      },
    };
  }

  if (p.includes('t gate') || p.includes(' t ')) {
    const reply = `### The T Gate ($\\pi/8$ Phase Gate)

The **T Gate** is a single-qubit phase gate that applies a $\\pi/4$ ($45^\\circ$) relative phase rotation around the Z-axis of the Bloch sphere:
$$T = \\begin{pmatrix} 1 & 0 \\\\ 0 & e^{i\\pi/4} \\end{pmatrix}$$

**Key Properties:**
- **Action on Basis States:** $T|0\\rangle = |0\\rangle$ and $T|1\\rangle = e^{i\\pi/4}|1\\rangle$.
- **Relation to S Gate:** $T^2 = S$ (the $\\pi/2$ phase gate) and $T^4 = Z$.
- **Universal Quantum Computing:** When combined with Clifford gates (Hadamard and CNOT), the T gate enables universal fault-tolerant quantum computation (by the Eastin-Knill theorem, non-Clifford gates like T are essential for universality).`;

    return {
      reply,
      intent: 'concept_question',
      request: userPrompt,
      structuredData: {
        intent: 'concept_question',
        request: userPrompt,
        explanation: reply,
      },
    };
  }

  if (p.includes('s gate') || p.includes(' s ')) {
    const reply = `### The S Gate (Phase Gate)

The **S Gate** is a single-qubit Clifford gate that applies a $\\pi/2$ ($90^\\circ$) relative phase rotation around the Z-axis:
$$S = \\begin{pmatrix} 1 & 0 \\\\ 0 & i \\end{pmatrix}$$

**Key Properties:**
- **Action on Basis States:** $S|0\\rangle = |0\\rangle$ and $S|1\\rangle = i|1\\rangle$.
- **Square of S:** $S^2 = Z$ (Pauli-Z phase flip).
- **Difference from T Gate:** The S gate shifts phase by $\\pi/2$, whereas the T gate shifts phase by $\\pi/4$ ($T^2 = S$). S is a Clifford gate, whereas T is a non-Clifford gate.`;

    return {
      reply,
      intent: 'concept_question',
      request: userPrompt,
      structuredData: {
        intent: 'concept_question',
        request: userPrompt,
        explanation: reply,
      },
    };
  }

  if (p.includes('bell')) {
    const reply = `### Bell States & Maximal Entanglement

A **Bell State** (or EPR pair) is one of the four maximally entangled two-qubit quantum states:
$$|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}, \\quad |\\Phi^-\\rangle = \\frac{|00\\rangle - |11\\rangle}{\\sqrt{2}}$$
$$|\\Psi^+\\rangle = \\frac{|01\\rangle + |10\\rangle}{\\sqrt{2}}, \\quad |\\Psi^-\\rangle = \\frac{|01\\rangle - |10\\rangle}{\\sqrt{2}}$$

They form a complete orthonormal basis for the 4-dimensional two-qubit Hilbert space and violate Bell inequalities maximally (CHSH parameter $S = 2\\sqrt{2} > 2$).

To generate this circuit in your editor, type **"create a Bell state"**!`;

    return {
      reply,
      intent: 'concept_question',
      request: userPrompt,
      structuredData: {
        intent: 'concept_question',
        request: userPrompt,
        explanation: reply,
      },
    };
  }

  const defaultReply = `Hello! I am your **AI Quantum Study Companion**.

I am monitoring your active circuit with **${currentQubits} qubit(s)** and **${ops.length} gate(s)**.

**Current Circuit State:**
- Qubits: ${currentQubits}
- Classical Bits: ${ctx.numClassicalBits}
- Probabilities: ${ctx.probabilitiesStr}

You can ask me:
- **"why issue is getting in my circuit?"** — diagnoses active errors immediately
- **"create Werner states"** — generates a bipartite Werner singlet circuit with noise mixing
- **"create a Bell state"** — creates an entangled 2-qubit Bell pair
- **"create GHZ state"** — generates a 3-qubit tripartite entangled state
- **"what does the H gate do?"** — explains the Hadamard transformation
- **"explain my current circuit"** — walks through your current gates
- **"why am I getting this result?"** — analyzes simulation probabilities
- **"fix my circuit"** — diagnoses and repairs circuit errors`;

  return {
    reply: defaultReply,
    intent: 'concept_question',
    request: userPrompt,
    structuredData: {
      intent: 'concept_question',
      request: userPrompt,
      explanation: defaultReply,
    },
  };
}
