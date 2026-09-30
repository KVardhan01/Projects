import { AIContext } from '../../types/ai';

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

  // 2. Count classical bits from measurement operations or explicit context
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

  // 3-7. Gate list with Type, Targets, Controls, Parameters, Moment
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
export function synthesizeQuantumExpertResponse(userPrompt: string, context: AIContext): string {
  const p = userPrompt.toLowerCase().trim();
  const ctx = formatQuantumContext(context);
  const ops = context.circuit?.operations || [];
  const numQubits = ctx.numQubits;

  // 1. GHZ State Request: e.g. "apply GHZ States in circuit", "create GHZ state", "make a GHZ circuit"
  if (p.includes('ghz') || p.includes('greenberger')) {
    const targetQubits = Math.max(3, numQubits);
    return `### Greenberger–Horne–Zeilinger (GHZ) State

A **GHZ State** is a maximally entangled quantum state involving three or more qubits. For a 3-qubit system, the canonical state is defined as:
$$|\\text{GHZ}\\rangle = \\frac{|000\\rangle + |111\\rangle}{\\sqrt{2}}$$

#### Physical Intuition:
Unlike product states or pairwise Bell states, a GHZ state exhibits **genuine tripartite entanglement**: measuring any single qubit immediately collapses all other entangled qubits into the identical computational basis outcome ($|0\\rangle$ or $|1\\rangle$).

#### Construction Steps:
1. **Hadamard Gate on $q_0$**: Places qubit 0 into equal superposition:
   $$H|0\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$$
2. **CNOT from $q_0$ to $q_1$**: Entangles qubit 1 with qubit 0, creating a Bell state:
   $$\\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$
3. **CNOT from $q_1$ to $q_2$** (or $q_0$ to $q_2$): Chains the entanglement to qubit 2:
   $$\\frac{|000\\rangle + |111\\rangle}{\\sqrt{2}}$$

Here is the complete Python / Qiskit code to apply this GHZ state:
\`\`\`python
from qiskit import QuantumCircuit

# 3-qubit GHZ state circuit
qc = QuantumCircuit(${targetQubits})

# Step 1: Create superposition on q0
qc.h(0)

# Step 2: Entangle q1 with q0
qc.cx(0, 1)

# Step 3: Entangle q2 with q1 to form the tripartite GHZ state
qc.cx(1, 2)
\`\`\`

Click **"Apply to Visual Circuit"** below to load this GHZ state onto your visual canvas and run the quantum simulator!`;
  }

  // 2. Bell State Request: e.g. "apply Bell state", "create Bell state", "entangle two qubits"
  if (p.includes('bell state') || p.includes('bell pair') || p.includes('epr') || (p.includes('entangle') && !p.includes('ghz'))) {
    return `### Entangled Bell State ($|\\Phi^+\\rangle$)

The Bell state $|\\Phi^+\\rangle$ is the foundational 2-qubit maximally entangled state:
$$|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$

#### Current Circuit Assessment:
- Current qubits: **${numQubits}**
- Existing gates: **${ops.length}**
- Status: ${
      ops.some((o) => o.gate === 'H' && o.targets.includes(0)) &&
      ops.some((o) => o.gate === 'CX' && o.controls.includes(0) && o.targets.includes(1))
        ? '✅ Your active circuit already contains the core Bell state structure (H on q0 and CX(0,1))!'
        : 'To construct the Bell state, apply a Hadamard gate to qubit 0, followed by a CNOT gate with control 0 and target 1.'
    }

Here is the standard Python / Qiskit code:
\`\`\`python
from qiskit import QuantumCircuit

qc = QuantumCircuit(2)

# Create equal superposition on q0
qc.h(0)

# Apply CNOT to entangle q1 with q0
qc.cx(0, 1)
\`\`\`

Click **"Apply to Visual Circuit"** to immediately update your workbench and observe the 50/50 probability distribution between $|00\\rangle$ and $|11\\rangle$.`;
  }

  // 3. Superposition Request: e.g. "what is superposition", "create superposition", "hadamard", "h gate"
  if (p.includes('superposition') || p.includes('hadamard') || p.includes('h gate')) {
    const hasH = ops.some((o) => o.gate === 'H');
    return `### Quantum Superposition & The Hadamard (H) Gate

In quantum mechanics, **superposition** allows a qubit to exist in a linear combination of the computational basis states $|0\\rangle$ and $|1\\rangle$:
$$|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle, \\quad |\\alpha|^2 + |\\beta|^2 = 1$$

#### The Hadamard Transformation:
Applying an **H gate** to $|0\\rangle$ maps it to the $|+\\rangle$ state on the equator of the Bloch sphere:
$$H|0\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} = |+\\rangle$$
This produces equal $50\\%$ measurement probabilities for both outcomes.

#### Current Circuit Status:
- Qubits: **${numQubits}**
- Hadamard Gate Present: ${hasH ? '✅ Yes, you currently have H gate(s) placed!' : '❌ Not placed yet.'}

Here is the Qiskit code to apply equal superposition across all qubits:
\`\`\`python
from qiskit import QuantumCircuit

qc = QuantumCircuit(${numQubits})

# Apply Hadamard to each qubit wire
${Array.from({ length: numQubits }, (_, i) => `qc.h(${i})`).join('\n')}
\`\`\`

Click **"Apply to Visual Circuit"** to synchronize and simulate.`;
  }

  // 4. Quantum Teleportation
  if (p.includes('teleport') || p.includes('teleportation')) {
    return `### Quantum Teleportation Protocol

Quantum Teleportation allows transmitting an unknown quantum state $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$ from Alice ($q_0$) to Bob ($q_2$) using a shared entangled Bell pair ($q_1, q_2$) and 2 classical bits of information.

#### Protocol Sequence:
1. **Prepare Entangled Pair**: Alice ($q_1$) and Bob ($q_2$) share a Bell pair ($H(q_1)$ then $CX(q_1, q_2)$).
2. **Alice's Bell-State Measurement**: Alice interacts her state ($q_0$) with her half of the pair ($q_1$) using $CX(q_0, q_1)$ and $H(q_0)$, then measures both.
3. **Bob's Reconstruction**: Bob applies conditional Pauli $X$ and $Z$ gates based on Alice's measurement results.

Here is the runnable Qiskit circuit:
\`\`\`python
from qiskit import QuantumCircuit

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
qc.measure(1, 1)
\`\`\`

Click **"Apply to Visual Circuit"** to explore the teleportation protocol in the editor.`;
  }

  // 5. Grover's Algorithm
  if (p.includes('grover') || p.includes('amplitude amplification') || p.includes('quantum search')) {
    return `### Grover's Quantum Search Algorithm

Grover's algorithm searches an unsorted database of $N = 2^n$ items with a **quadratic speedup**, taking approximately $O(\\sqrt{N})$ queries instead of classical $O(N)$.

#### Core Architecture:
1. **Equal Superposition Initialization**: Apply Hadamard gates $H^{\\otimes n}$ to all register qubits.
2. **Grover Iterate** (repeated $\\approx \\frac{\\pi}{4}\\sqrt{N}$ times):
   - **Phase Oracle ($U_f$)**: Flips the phase of the marked target state $|w\\rangle$: $|x\\rangle \\to (-1)^{f(x)}|x\\rangle$.
   - **Diffuser ($U_s$)**: Reflects amplitudes about the average superposition state: $2|s\\rangle\\langle s| - I$.

Here is a 2-qubit Grover circuit searching for the marked state $|11\\rangle$:
\`\`\`python
from qiskit import QuantumCircuit

qc = QuantumCircuit(2)

# 1. Initialize equal superposition
qc.h(0)
qc.h(1)

# 2. Oracle for target state |11> (Controlled-Z via H-CX-H)
qc.h(1)
qc.cx(0, 1)
qc.h(1)

# 3. Grover Diffuser
qc.h(0)
qc.h(1)
qc.x(0)
qc.x(1)
qc.h(1)
qc.cx(0, 1)
qc.h(1)
qc.x(0)
qc.x(1)
qc.h(0)
qc.h(1)
\`\`\`

Click **"Apply to Visual Circuit"** to test amplitude amplification.`;
  }

  // 6. Fix my code / Error Diagnosis
  if (p.includes('fix') || p.includes('error') || p.includes('broken') || p.includes('debug') || context.simulationError) {
    if (context.simulationError) {
      return `### Quantum Diagnostic & Code Resolution

**Detected Issue:**
${context.simulationError}

#### Diagnosis:
Quantum operations must reference valid qubit indices within the allocated circuit width (**${numQubits} qubit(s)**) and adhere to canonical Qiskit syntax.

Here is the corrected Python / Qiskit code:
\`\`\`python
from qiskit import QuantumCircuit

qc = QuantumCircuit(${Math.max(2, numQubits)})

# Applying foundational clean sequence
qc.h(0)
${numQubits > 1 ? 'qc.cx(0, 1)' : 'qc.x(0)'}
\`\`\`

Click **"Apply to Visual Circuit"** below to load this fix into your workbench.`;
    }

    // Generic fix review
    return `### Circuit Review & Optimization

**Workbench Status:**
- Register Size: **${numQubits} qubits**
- Active Gates: **${ops.length} operations**
- Current Qiskit Code:
\`\`\`python
${ctx.activeCode}
\`\`\`

#### Recommended Normalized Code:
\`\`\`python
from qiskit import QuantumCircuit

qc = QuantumCircuit(${numQubits})

${
  ops.length > 0
    ? ops
        .map((o) => {
          if (o.gate === 'CX' && o.controls?.length > 0) return `qc.cx(${o.controls[0]}, ${o.targets[0]})`;
          if (o.gate === 'SWAP' && o.targets?.length > 1) return `qc.swap(${o.targets[0]}, ${o.targets[1]})`;
          if (o.gate === 'M') return `qc.measure(${o.targets[0]}, ${o.targets[0]})`;
          return `qc.${o.gate.toLowerCase()}(${o.targets[0]})`;
        })
        .join('\n')
    : '# Clean initialized circuit\nqc.h(0)\nqc.cx(0, 1)'
}
\`\`\`

Click **"Apply to Visual Circuit"** to synchronize.`;
  }

  // 7. Explain this circuit / Overview
  if (p.includes('explain') || p.includes('overview') || p.includes('what does this circuit do')) {
    return `### Active Quantum Circuit Analysis

**Workbench Configuration:**
- **Qubit Register Width:** ${numQubits} qubit(s)
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
    : `This circuit performs a sequence of unitary transformations $U_k \\dots U_1 |0\\rangle^{\\otimes ${numQubits}}$. Check the State Vector and Bloch Sphere views in the simulation panel to inspect phase angles and amplitude magnitudes.`
}`;
  }

  // 8. Why am I getting this result?
  if (p.includes('why') && (p.includes('result') || p.includes('probability') || p.includes('outcome'))) {
    return `### Simulation Outcome Explanation

**Current Basis State Probabilities:**
${ctx.probabilitiesStr}

**Gate Sequence Contribution:**
Your circuit applies ${ops.length} quantum gate(s). Each single-qubit gate acts as an $SU(2)$ rotation on the Bloch sphere, while two-qubit gates like CNOT implement entangling conditional permutations across $2^n$-dimensional Hilbert space.

**Wire-by-Wire Flow:**
${ctx.gateDetails}

To sample measurement statistics, click **Simulate Circuit** in the top workbench toolbar.`;
  }

  // 9. Specific gate questions: Pauli X, Y, Z, S, T, SWAP, CNOT
  if (p.includes('x gate') || p.includes('not gate')) {
    return `### Pauli-X Gate (Quantum NOT)

The **Pauli-X** gate performs a $\\pi$ (180°) rotation around the X-axis of the Bloch sphere, acting as a bit-flip operator:
$$X|0\\rangle = |1\\rangle, \\quad X|1\\rangle = |0\\rangle$$

In matrix form:
$$X = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$$

In Qiskit: \`qc.x(qubit_index)\``;
  }

  if (p.includes('z gate') || p.includes('phase flip')) {
    return `### Pauli-Z Gate (Phase Flip)

The **Pauli-Z** gate performs a $\\pi$ rotation around the Z-axis of the Bloch sphere, flipping the relative phase of the $|1\\rangle$ component without altering measurement probabilities:
$$Z|0\\rangle = |0\\rangle, \\quad Z|1\\rangle = -|1\\rangle$$

In matrix form:
$$Z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}$$

In Qiskit: \`qc.z(qubit_index)\``;
  }

  if (p.includes('swap')) {
    return `### SWAP Gate

The **SWAP** gate exchanges the quantum states of two qubits:
$$\\text{SWAP}|a\\rangle|b\\rangle = |b\\rangle|a\\rangle$$

It can be synthesized using three alternating CNOT gates:
\`\`\`python
qc.cx(0, 1)
qc.cx(1, 0)
qc.cx(0, 1)
\`\`\`
Or natively: \`qc.swap(0, 1)\`.`;
  }

  // Default context-aware response
  return `Hello! I am your **AI Quantum Study Companion**.

I am monitoring your active circuit with **${numQubits} qubit(s)** and **${ops.length} gate(s)**.

**Current Circuit State:**
- Qubits: ${numQubits}
- Classical Bits: ${ctx.numClassicalBits}
- Probabilities: ${ctx.probabilitiesStr}

You can ask me:
- **"apply GHZ States in circuit"** — creates an entangled 3-qubit GHZ state
- **"apply Bell state"** — creates a 2-qubit entangled Bell pair
- **"what does this H gate do?"** — explains superposition
- **"explain this circuit"** — walks through your current gates
- **"why am I getting this result?"** — analyzes simulation probabilities
- **"fix my code"** — diagnoses and repairs circuit errors

Feel free to ask any quantum question or request a circuit pattern!`;
}
