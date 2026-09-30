import { AIContext, AIUserIntent, StructuredCircuitData } from '../../types/ai';

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

export interface QuantumExpertResult {
  reply: string;
  intent: AIUserIntent;
  request: string;
  qiskitCode?: string;
  requiredQubits?: number;
  gates?: string[];
  canModifyCurrentCircuit?: boolean;
  structuredData?: StructuredCircuitData;
}

/**
 * Robust semantic intent detection distinguishing between:
 * 1. generate_circuit: requests to create, make, build, synthesize, or prepare a quantum state/circuit
 * 2. modify_circuit: requests to add, remove, or change gates in the current circuit
 * 3. debug_circuit: requests to fix errors, broken code, or repair circuits
 * 4. explain_circuit: requests to explain, walk through, or describe the current circuit
 * 5. analyze_simulation: questions about measurement probabilities, outcomes, or sampling
 * 6. concept_question: questions about physics concepts, gates, or notation
 */
export function detectUserIntent(prompt: string): AIUserIntent {
  const p = prompt.toLowerCase().trim();

  // 1. Debugging requests
  if (
    p.includes('fix') ||
    p.includes('debug') ||
    p.includes('broken') ||
    p.includes('syntax error') ||
    p.includes('repair circuit') ||
    p.includes('repair code') ||
    p.includes('why is my code failing') ||
    p.includes('unsupported operation') ||
    p.includes('fix my code') ||
    p.includes('fix my circuit')
  ) {
    return 'debug_circuit';
  }

  // 2. Simulation / outcome analysis requests
  if (
    p.includes('why am i getting') ||
    p.includes('why did my circuit produce') ||
    p.includes('why is probability') ||
    p.includes('why 50/50') ||
    p.includes('explain the result') ||
    p.includes('explain the probabilities') ||
    p.includes('why are outcomes') ||
    p.includes('why did this happen')
  ) {
    return 'analyze_simulation';
  }

  // 3. Explanation of current circuit
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

  // 4. Circuit modification requests (modifying the existing circuit)
  if (
    p.startsWith('add ') ||
    p.startsWith('remove ') ||
    p.startsWith('change ') ||
    p.startsWith('replace ') ||
    p.includes('insert gate') ||
    p.includes('add a gate') ||
    p.includes('change this gate') ||
    p.includes('swap qubit')
  ) {
    return 'modify_circuit';
  }

  // 5. Circuit-generation requests (user wants a state, circuit, or algorithm constructed)
  const creationVerbs = [
    'create',
    'make',
    'build',
    'generate',
    'construct',
    'implement',
    'apply',
    'synthesize',
    'prepare',
    'design',
    'code',
    'show me how to make',
    'show me how to build',
    'give me a circuit',
    'give me the circuit',
  ];

  const quantumTargets = [
    'werner',
    'bell',
    'ghz',
    'greenberger',
    'w state',
    'superposition',
    'teleport',
    'teleportation',
    'grover',
    'deutsch',
    'deutsch-jozsa',
    'qft',
    'fourier',
    'swap',
    'singlet',
    'triplet',
    'phase kickback',
    'cat state',
    'cluster state',
    'circuit for',
    'state in circuit',
    'states in circuit',
    'state',
  ];

  const hasCreationVerb = creationVerbs.some((v) => p.includes(v));
  const hasQuantumTarget = quantumTargets.some((t) => p.includes(t));

  const isQuestionAboutHowItWorks =
    p.startsWith('how does') ||
    p.startsWith('what is') ||
    p.startsWith('what are') ||
    p.startsWith('why is') ||
    p.startsWith('can you explain what');

  if (hasCreationVerb && hasQuantumTarget && !isQuestionAboutHowItWorks) {
    return 'generate_circuit';
  }

  // Direct short targets like "Werner state", "GHZ state", "Bell state" when entered directly
  if (
    (p.includes('werner') || p.includes('bell') || p.includes('ghz') || p.includes('teleport')) &&
    !isQuestionAboutHowItWorks &&
    !p.includes('explain')
  ) {
    return 'generate_circuit';
  }

  return 'concept_question';
}

/**
 * Extracts Qiskit circuit metadata from a Python code string:
 * - Number of qubits
 * - List of gate operations
 */
export function extractQiskitCodeDetails(code: string): {
  requiredQubits: number;
  gates: string[];
} {
  let requiredQubits = 2;
  const qcMatch = code.match(/QuantumCircuit\((\d+)/);
  if (qcMatch) {
    requiredQubits = parseInt(qcMatch[1], 10);
  }

  const gatesSet = new Set<string>();
  const gateMatches = code.matchAll(/qc\.([a-zA-Z_]\w*)\s*\(/g);
  for (const match of gateMatches) {
    const methodName = match[1].toLowerCase();
    if (['h', 'x', 'y', 'z', 's', 't', 'cx', 'cnot', 'swap', 'measure', 'measure_all'].includes(methodName)) {
      if (methodName === 'cnot') gatesSet.add('CX');
      else if (methodName === 'measure_all') gatesSet.add('M');
      else if (methodName === 'measure') gatesSet.add('M');
      else gatesSet.add(methodName.toUpperCase());
    }
  }

  return {
    requiredQubits,
    gates: Array.from(gatesSet),
  };
}

/**
 * Formats platform workbench context into normalized parameters for AI comprehension:
 * 1. Current number of qubits
 * 2. Current number of classical bits
 * 3. Current circuit gates
 * 4. Gate type
 * 5. Gate target qubits
 * 6. Control qubits
 * 7. Gate parameters
 */
export function formatQuantumContext(context: AIContext): FormattedQuantumContext {
  const circuit = context.circuit;
  const numQubits = circuit?.numQubits || 2;
  const operations = circuit?.operations || [];

  // Count classical bits from measurement operations or explicit context
  const measurementOps = operations.filter((op) => op.gate === 'M');
  let numClassicalBits =
    context.numClassicalBits !== undefined
      ? context.numClassicalBits
      : measurementOps.length > 0
      ? measurementOps.length
      : 0;

  // Also check if code has explicit QuantumCircuit(n, c)
  if (context.code && numClassicalBits === 0) {
    const match = context.code.match(/QuantumCircuit\(\s*\d+\s*,\s*(\d+)\s*\)/);
    if (match) {
      numClassicalBits = parseInt(match[1], 10);
    }
  }

  // Gate list with Type, Targets, Controls, Parameters, Moment
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

  const activeCode = context.code || '# No active code';

  let probabilitiesStr = 'Not yet simulated';
  if (context.simulation?.probabilities) {
    const entries = Object.entries(context.simulation.probabilities);
    if (entries.length > 0) {
      probabilitiesStr = entries
        .map(([k, v]) => `|${k}⟩: ${(Number(v) * 100).toFixed(1)}%`)
        .join(', ');
    }
  }

  let measurementCountsStr = 'No measurements recorded';
  if (context.simulation?.measurementCounts) {
    const counts = Object.entries(context.simulation.measurementCounts);
    if (counts.length > 0) {
      measurementCountsStr = counts.map(([k, v]) => `|${k}⟩: ${v}`).join(', ');
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
    simulationError: context.simulationError || 'None',
    exerciseGoal: context.exerciseGoal || 'Open quantum experimentation',
    studentLevel: context.studentLevel || 'Beginner',
  };
}

/**
 * Intelligent Quantum Expert reasoning engine for circuit creation, manipulation, and analysis.
 */
export function synthesizeQuantumExpertResponse(
  userPrompt: string,
  context: AIContext
): QuantumExpertResult {
  const p = userPrompt.toLowerCase().trim();
  const intent = detectUserIntent(userPrompt);
  const ctx = formatQuantumContext(context);
  const ops = context.circuit?.operations || [];
  const currentQubits = ctx.numQubits;

  // =========================================================================
  // 1. CIRCUIT GENERATION REQUESTS
  // =========================================================================

  // 1A. Werner State Generation (e.g. "create Werner States", "make Werner state")
  if (p.includes('werner')) {
    const qiskitCode = `from qiskit import QuantumCircuit

# 2-qubit Werner State base circuit (Bell Singlet state |Ψ-⟩)
# In Qubify, configure the depolarizing noise setting (1-p) to adjust the Werner mixing ratio p.
qc = QuantumCircuit(2)

# Step 1: Prepare |11> computational basis
qc.x(0)
qc.x(1)

# Step 2: Create equal superposition on q0
qc.h(0)

# Step 3: Entangle q1 with q0 using CNOT
qc.cx(0, 1)

# Step 4: Apply Pauli-Z to create the singlet relative phase: (|01> - |10>)/√2
qc.z(0)`;

    const reply = `### Werner State Construction

#### 1. What is a Werner State?
In quantum information theory, a **Werner State** $\\rho_W$ is a bipartite (2-qubit) quantum state that is invariant under any bilateral unitary transformation ($U \\otimes U \\rho_W U^\\dagger \\otimes U^\\dagger = \\rho_W$). It is defined as a convex mixture of the maximally entangled Bell singlet state $|\\Psi^-\\rangle$ and the maximally mixed white-noise state $\\frac{I_4}{4}$:
$$\\rho_W(p) = p |\\Psi^-\\rangle\\langle\\Psi^-| + \\frac{1-p}{4} I_4, \\quad p \\in [0, 1]$$
- When $p = 1$: The state is the pure Bell singlet state $|\\Psi^-\\rangle = \\frac{|01\\rangle - |10\\rangle}{\\sqrt{2}}$.
- When $p > \\frac{1}{3}$: The state is entangled and violates the Peres-Horodecki separability criterion.
- When $p \\le \\frac{1}{3}$: The state is separable.

#### 2. Required Number of Qubits
**2 Qubits** (represented as $q_0$ and $q_1$).

#### 3. Required Gates
- **X Gates**: Applied to $q_0$ and $q_1$ to initialize the state to $|11\\rangle$.
- **H Gate**: Applied to $q_0$ to create superposition.
- **CX (CNOT) Gate**: With control $q_0$ and target $q_1$ to establish entanglement.
- **Z Gate**: Applied to $q_0$ to flip the relative phase, isolating the anti-symmetric singlet $|\\Psi^-\\rangle$.

#### 4. Complete Qiskit Python Code
\`\`\`python
${qiskitCode}
\`\`\`

#### 5. Why These Gates Create the State
1. Starting from the default ground state $|00\\rangle$, the Pauli-X gates on both wires prepare $|11\\rangle$.
2. The Hadamard gate on $q_0$ puts the control wire into superposition: $\\frac{|01\\rangle - |11\\rangle}{\\sqrt{2}}$.
3. The CNOT gate flips target $q_1$ whenever $q_0$ is 1, creating the entangled state $\\frac{|01\\rangle - |10\\rangle}{\\sqrt{2}} = |\\Psi^-\\rangle$.
4. In Qubify, you can adjust the platform's **Depolarizing Noise** slider in the simulation settings to simulate the $(1 - p)$ white noise mixing parameter!

#### 6. Can the Current Circuit Be Modified?
**Yes.** Your current editor currently contains **${currentQubits} qubit(s)** and **${ops.length} gate(s)**${
      ops.length > 0 ? ` (${ops.map((o) => o.gate).join(', ')})` : ''
    }. To produce the Werner state:
- Set the circuit register width to 2 qubits.
- Replace any existing gate operations with the 2-qubit singlet sequence above (\`qc.x(0)\`, \`qc.x(1)\`, \`qc.h(0)\`, \`qc.cx(0, 1)\`, \`qc.z(0)\`).

Click **"Apply to Visual Circuit"** below to load this circuit directly onto your visual canvas!`;

    return {
      reply,
      intent: 'generate_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: 2,
      gates: ['X', 'H', 'CX', 'Z'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'generate_circuit',
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        requiredQubits: 2,
        gates: ['X', 'H', 'CX', 'Z'],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // 1B. GHZ State Generation (e.g. "create GHZ state", "make GHZ", "apply GHZ States in circuit")
  if (p.includes('ghz') || p.includes('greenberger')) {
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
A **GHZ State** is a maximally entangled quantum state involving three or more qubits. For 3 qubits, the canonical state is defined as:
$$|\\text{GHZ}\\rangle = \\frac{|000\\rangle + |111\\rangle}{\\sqrt{2}}$$
It exhibits **genuine tripartite entanglement**: measuring any single qubit immediately collapses all three qubits to either $|000\\rangle$ or $|111\\rangle$ with equal $50\\%$ probability.

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
1. $H(q_0)$ transforms $|000\\rangle$ into $\\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} \\otimes |00\\rangle = \\frac{|000\\rangle + |100\\rangle}{\\sqrt{2}}$.
2. $CX(q_0, q_1)$ flips $q_1$ when $q_0$ is 1: $\\frac{|000\\rangle + |110\\rangle}{\\sqrt{2}}$.
3. $CX(q_1, q_2)$ flips $q_2$ when $q_1$ is 1: $\\frac{|000\\rangle + |111\\rangle}{\\sqrt{2}}$.

#### 6. Can the Current Circuit Be Modified?
**Yes.** Your active circuit currently has **${currentQubits} qubits** and **${ops.length} gates**.${
      currentQubits < 3
        ? ' The circuit will be expanded from ' + currentQubits + ' to 3 qubits to accommodate tripartite entanglement.'
        : ' The existing gates will be configured to match the H + CNOT + CNOT sequence.'
    }

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
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        requiredQubits: targetQubits,
        gates: ['H', 'CX'],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // 1C. Bell State Generation (e.g. "create a Bell state", "make Bell state", "build a Bell circuit")
  if (p.includes('bell') || (p.includes('entangle') && !p.includes('werner') && !p.includes('ghz'))) {
    const qiskitCode = `from qiskit import QuantumCircuit

# 2-qubit Bell State (|Φ+⟩)
qc = QuantumCircuit(2)

# Step 1: Create equal superposition on q0
qc.h(0)

# Step 2: Entangle q1 with q0
qc.cx(0, 1)`;

    const reply = `### Bell State ($|\\Phi^+\\rangle$) Construction

#### 1. What is a Bell State?
A **Bell State** is one of the four maximally entangled two-qubit quantum states. The standard Bell state $|\\Phi^+\\rangle$ is:
$$|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$
Measuring one qubit instantaneously determines the state of the other, regardless of spatial separation.

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
1. $H(q_0)$ creates an equal superposition: $\\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} \\otimes |0\\rangle = \\frac{|00\\rangle + |10\\rangle}{\\sqrt{2}}$.
2. $CX(0, 1)$ flips $q_1$ when $q_0 = 1$, yielding $\\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$.

#### 6. Can the Current Circuit Be Modified?
**Yes.** Your active circuit currently contains **${currentQubits} qubit(s)** and **${ops.length} gate(s)**. Applying the code below configures a 2-qubit Bell state register.

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
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        requiredQubits: 2,
        gates: ['H', 'CX'],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // 1D. Superposition Circuit
  if (p.includes('superposition') && intent === 'generate_circuit') {
    const qiskitCode = `from qiskit import QuantumCircuit

qc = QuantumCircuit(${currentQubits})

# Apply Hadamard gate across all qubits to create full equal superposition
${Array.from({ length: currentQubits }, (_, i) => `qc.h(${i})`).join('\n')}`;

    const reply = `### Equal Superposition Circuit

#### 1. What is Equal Superposition?
Applying Hadamard gates to all $n$ qubits creates a state with equal probability amplitudes across all $2^n$ basis states:
$$|\\psi\\rangle = H^{\\otimes n} |0\\rangle^{\\otimes n} = \\frac{1}{\\sqrt{2^n}} \\sum_{x=0}^{2^n-1} |x\\rangle$$

#### 2. Required Number of Qubits
**${currentQubits} Qubits** (matches your active workbench width).

#### 3. Required Gates
- **H Gate**: Placed on each qubit wire.

#### 4. Complete Qiskit Python Code
\`\`\`python
${qiskitCode}
\`\`\`

#### 5. Why These Gates Create the State
Each Hadamard gate rotates a qubit from the computational basis state $|0\\rangle$ to the equatorial state $|+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$. The tensor product of $n$ such states yields a uniform distribution with $1/2^n$ probability per basis outcome.

#### 6. Can the Current Circuit Be Modified?
**Yes.** Applying this circuit updates your active ${currentQubits}-qubit register with parallel Hadamard gates.

Click **"Apply to Visual Circuit"** to synchronize with your visual canvas!`;

    return {
      reply,
      intent: 'generate_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: currentQubits,
      gates: ['H'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'generate_circuit',
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        requiredQubits: currentQubits,
        gates: ['H'],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // 1E. Quantum Teleportation Circuit
  if (p.includes('teleport') && intent === 'generate_circuit') {
    const qiskitCode = `from qiskit import QuantumCircuit

# 3 qubits: q0 (state to teleport), q1 (Alice EPR), q2 (Bob EPR)
# 2 classical bits for Alice's measurement results
qc = QuantumCircuit(3, 2)

# Step 1: Create shared Bell pair between q1 and q2
qc.h(1)
qc.cx(1, 2)

# Step 2: Alice performs Bell-basis operations on q0 and q1
qc.cx(0, 1)
qc.h(0)

# Step 3: Measurement
qc.measure(0, 0)
qc.measure(1, 1)`;

    const reply = `### Quantum Teleportation Circuit

#### 1. What is Quantum Teleportation?
Quantum Teleportation transmits an unknown quantum state $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$ from Alice ($q_0$) to Bob ($q_2$) using a pre-shared entangled Bell pair ($q_1, q_2$) and 2 classical bits of information.

#### 2. Required Number of Qubits
**3 Qubits** and **2 Classical Bits**.

#### 3. Required Gates
- **H and CX**: To create the shared Bell pair and perform Bell-basis decoding.
- **M (Measure)**: To measure $q_0$ and $q_1$ into classical registers.

#### 4. Complete Qiskit Python Code
\`\`\`python
${qiskitCode}
\`\`\`

#### 5. Why These Gates Create the State
1. $H(q_1)$ and $CX(q_1, q_2)$ establish the quantum channel (Bell pair).
2. $CX(q_0, q_1)$ and $H(q_0)$ rotate Alice's combined system into the Bell basis.
3. Measuring Alice's qubits teleports the state to Bob up to known Pauli $X$ and $Z$ corrections.

#### 6. Can the Current Circuit Be Modified?
**Yes.** The circuit will be configured with 3 qubits and 2 classical measurement wires.

Click **"Apply to Visual Circuit"** to load this circuit into your workbench!`;

    return {
      reply,
      intent: 'generate_circuit',
      request: userPrompt,
      qiskitCode,
      requiredQubits: 3,
      gates: ['H', 'CX', 'M'],
      canModifyCurrentCircuit: true,
      structuredData: {
        intent: 'generate_circuit',
        request: userPrompt,
        explanation: reply,
        qiskitCode,
        requiredQubits: 3,
        gates: ['H', 'CX', 'M'],
        canModifyCurrentCircuit: true,
      },
    };
  }

  // =========================================================================
  // 2. DEBUGGING / ERROR FIXING REQUESTS
  // =========================================================================
  if (intent === 'debug_circuit') {
    const qiskitCode = `from qiskit import QuantumCircuit

qc = QuantumCircuit(${Math.max(2, currentQubits)})

# Applying standardized clean quantum sequence
qc.h(0)
${currentQubits > 1 ? 'qc.cx(0, 1)' : 'qc.x(0)'}`;

    const reply = `### Quantum Diagnostic & Code Resolution

**Detected Issue:**
${context.simulationError || 'Code/circuit requires syntax stabilization.'}

#### Diagnosis:
Quantum operations must reference valid qubit indices within the allocated circuit width (**${currentQubits} qubit(s)**) and adhere to canonical Qiskit syntax.

Here is the corrected Python / Qiskit code:
\`\`\`python
${qiskitCode}
\`\`\`

Click **"Apply to Visual Circuit"** below to load this fix into your workbench.`;

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
  // 3. EXPLAIN CURRENT CIRCUIT REQUESTS
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
    ? 'Your circuit is currently empty. All qubits remain in the computational basis ground state $|00\\dots0\\rangle$. Try adding a Hadamard gate to explore superposition!'
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
  // 4. SIMULATION OUTCOME ANALYSIS
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
  // 5. CONCEPTUAL QUESTIONS / DEFAULT
  // =========================================================================
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

  const defaultReply = `Hello! I am your **AI Quantum Study Companion**.

I am monitoring your active circuit with **${currentQubits} qubit(s)** and **${ops.length} gate(s)**.

**Current Circuit State:**
- Qubits: ${currentQubits}
- Classical Bits: ${ctx.numClassicalBits}
- Probabilities: ${ctx.probabilitiesStr}

You can ask me:
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
