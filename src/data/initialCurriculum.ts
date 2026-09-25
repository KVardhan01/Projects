import { Course, Module, Lesson } from '../types/curriculum';

export const INITIAL_COURSE: Course = {
  id: 'quantum-computing-mastery',
  title: 'Quantum Computing & Algorithms: From Intuition to Implementation',
  description: 'Master quantum states, gates, entanglement, and quantum algorithms through interactive circuit simulation and AI tutoring.',
  level: 'Beginner',
  category: 'Quantum Computing',
  order: 1,
  isPublished: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

export const INITIAL_MODULES: Module[] = [
  {
    id: 'mod-foundations',
    courseId: 'quantum-computing-mastery',
    title: 'Foundations of Quantum Information',
    description: 'Build concrete physical and mathematical intuition for qubits, superposition, probability amplitudes, and measurement.',
    category: 'Foundations',
    order: 1,
    estimatedMinutes: 45,
    difficulty: 'Beginner',
    isPublished: true,
  },
  {
    id: 'mod-core-gates',
    courseId: 'quantum-computing-mastery',
    title: 'Quantum Gates & Rotations',
    description: 'Understand reversible single-qubit transformations: Pauli X, Y, Z, Hadamard, and Phase gates (S and T).',
    category: 'Core Concepts',
    order: 2,
    estimatedMinutes: 60,
    difficulty: 'Beginner',
    isPublished: true,
  },
  {
    id: 'mod-circuits',
    courseId: 'quantum-computing-mastery',
    title: 'Multi-Qubit Circuits & Controlled Gates',
    description: 'Compose multi-qubit systems, controlled operations, CNOT, SWAP, and parallel gate execution moments.',
    category: 'Circuits',
    order: 3,
    estimatedMinutes: 50,
    difficulty: 'Intermediate',
    isPublished: true,
  },
  {
    id: 'mod-entanglement',
    courseId: 'quantum-computing-mastery',
    title: 'Quantum Entanglement & Bell States',
    description: 'Explore the Einstein-Podolsky-Rosen paradox, non-local quantum correlations, and the four canonical Bell states.',
    category: 'Entanglement',
    order: 4,
    estimatedMinutes: 40,
    difficulty: 'Intermediate',
    isPublished: true,
  },
  {
    id: 'mod-algorithms',
    courseId: 'quantum-computing-mastery',
    title: 'Quantum Algorithms: Grover & QFT',
    description: 'Implement quantum speedups: Grover quadratic database search and the Quantum Fourier Transform.',
    category: 'Algorithms',
    order: 5,
    estimatedMinutes: 90,
    difficulty: 'Advanced',
    isPublished: true,
  },
  {
    id: 'mod-advanced-nisq',
    courseId: 'quantum-computing-mastery',
    title: 'Circuit Equivalence, Optimization & NISQ Noise',
    description: 'Verify formal unitary equivalence, optimize circuit depth, and analyze real-world decoherence on NISQ processors.',
    category: 'Advanced',
    order: 6,
    estimatedMinutes: 70,
    difficulty: 'Advanced',
    isPublished: true,
  },
];

export const INITIAL_LESSONS: Lesson[] = [
  // 1. What is a Qubit?
  {
    id: 'lesson-1-what-is-qubit',
    moduleId: 'mod-foundations',
    title: '1. What is a Qubit?',
    description: 'The fundamental atomic unit of quantum information.',
    coreIdea: 'A classical bit is strictly 0 or 1. A qubit is a two-level quantum system represented as a linear combination of |0⟩ and |1⟩.',
    order: 1,
    estimatedMinutes: 10,
    difficulty: 'Beginner',
    lessonType: 'theory',
    content: `
# What is a Qubit?

In classical computing, the fundamental unit of information is the **bit**, which can be in exactly one of two distinct physical states: **0** (off / low voltage) or **1** (on / high voltage).

In quantum computing, our basic unit is the **quantum bit**, or **qubit**. 

### The Key Difference
Unlike a classical switch, a qubit is an authentic quantum mechanical system (such as the spin of an electron or the polarization of a photon). Before you measure it, it can be in a continuum of states!

We write the two standard basis states using Dirac **bra-ket notation**:
- **|0⟩**: corresponds to classical state 0
- **|1⟩**: corresponds to classical state 1

### Try It in the Simulator
Open the workbench below. Notice qubit **q0** starts in state **|0⟩**. When you simulate it, the probability of measuring 0 is 100%.
    `,
    initialCircuit: {
      id: 'qubit-intro',
      name: 'Single Qubit Baseline',
      numQubits: 1,
      numMoments: 3,
      qubits: [{ index: 0, name: 'q0', initialValue: 0 }],
      operations: [],
    },
    experimentGoal: 'Simulate the initial |0⟩ state and observe that P(0) = 1.0 and P(1) = 0.0.',
    isPublished: true,
    quizId: 'quiz-foundations',
  },

  // 2. Quantum State
  {
    id: 'lesson-2-quantum-state',
    moduleId: 'mod-foundations',
    title: '2. Quantum State Vector',
    description: 'Mathematical representation of pure quantum states as complex vectors.',
    coreIdea: 'A qubit state |ψ⟩ is written as α|0⟩ + β|1⟩, where α and β are complex numbers satisfying |α|² + |β|² = 1.',
    order: 2,
    estimatedMinutes: 12,
    difficulty: 'Beginner',
    lessonType: 'interactive',
    content: `
# The Quantum State Vector

Any single-qubit state |ψ⟩ can be expressed as:
$$|\\psi\\rangle = \\alpha |0\\rangle + \\beta |1\\rangle$$

Here:
- **α (alpha)** is the complex probability amplitude for state |0⟩.
- **β (beta)** is the complex probability amplitude for state |1⟩.

### The Normalization Condition
Because the total probability of all possible measurement outcomes must equal 100%:
$$|\\alpha|^2 + |\\beta|^2 = 1$$

In vector notation:
$$|\\psi\\rangle = \\begin{pmatrix} \\alpha \\\\ \\beta \\end{pmatrix}$$

If $\\alpha = 1$ and $\\beta = 0$, the state is $|0\\rangle = \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$.
If $\\alpha = 0$ and $\\beta = 1$, the state is $|1\\rangle = \\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix}$.
    `,
    initialCircuit: {
      id: 'state-vector-intro',
      name: 'State Vector Observation',
      numQubits: 1,
      numMoments: 3,
      qubits: [{ index: 0, name: 'q0', initialValue: 0 }],
      operations: [{ id: 'op1', gate: 'X', targets: [0], controls: [], moment: 0 }],
    },
    experimentGoal: 'Add an X gate to flip the state vector from [1, 0] to [0, 1].',
    isPublished: true,
  },

  // 3. Superposition
  {
    id: 'lesson-3-superposition',
    moduleId: 'mod-foundations',
    title: '3. Superposition: The Hadamard Gate',
    description: 'Creating genuine quantum parallelism where a qubit exists in both states at once.',
    coreIdea: 'The Hadamard (H) gate places |0⟩ into equal superposition (|0⟩ + |1⟩)/√2, giving a 50% chance of measuring 0 and 50% chance of measuring 1.',
    order: 3,
    estimatedMinutes: 15,
    difficulty: 'Beginner',
    lessonType: 'experiment',
    content: `
# Superposition: The Heart of Quantum Computing

Superposition does **not** mean the qubit is secretly 0 or 1 and we just don't know it yet. It means the qubit physically possesses properties of both states simultaneously!

### The Hadamard Gate (H)
When you apply a Hadamard gate to $|0\\rangle$:
$$H|0\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} = |+\\rangle$$

Both amplitudes are $\\frac{1}{\\sqrt{2}} \\approx 0.7071$.
The probabilities are:
$$P(0) = |\\frac{1}{\\sqrt{2}}|^2 = \\frac{1}{2} = 50\\%$$
$$P(1) = |\\frac{1}{\\sqrt{2}}|^2 = \\frac{1}{2} = 50\\%$$

### What happens if you apply H twice?
In quantum mechanics, gates are reversible unitaries. $H \\cdot H = I$ (the Identity gate)!
Applying H to $|+\\rangle$ returns exactly back to $|0\\rangle$ with 100% certainty!
    `,
    initialCircuit: {
      id: 'superposition-demo',
      name: 'Hadamard Superposition',
      numQubits: 1,
      numMoments: 4,
      qubits: [{ index: 0, name: 'q0', initialValue: 0 }],
      operations: [{ id: 'h1', gate: 'H', targets: [0], controls: [], moment: 0 }],
    },
    experimentGoal: 'Simulate the H gate with 1024 shots. Verify that 0 and 1 each receive approximately 512 counts.',
    isPublished: true,
    exerciseId: 'ex-probabilistic-h',
  },

  // 4. Probability and Amplitudes
  {
    id: 'lesson-4-probability-amplitudes',
    moduleId: 'mod-foundations',
    title: '4. Probability and Complex Amplitudes',
    description: 'How quantum amplitudes can be negative or complex, enabling constructive and destructive interference.',
    coreIdea: 'Classical probabilities cannot cancel each other out. Quantum amplitudes are complex numbers that can interfere destructively (cancel to 0) or constructively (boost to 1).',
    order: 4,
    estimatedMinutes: 15,
    difficulty: 'Beginner',
    lessonType: 'interactive',
    content: `
# Amplitudes vs. Probabilities: Interference

Classical probabilities are real numbers between 0 and 1 that only add up.

Quantum amplitudes are **complex numbers** with magnitude and phase. When two computational paths lead to the same outcome:
- If their amplitudes have the same sign (in-phase), they **interfere constructively** (probability increases).
- If their amplitudes have opposite signs (out-of-phase), they **interfere destructively** (probability drops to zero)!

This quantum interference is the engine behind all quantum speedups, including Shor's and Grover's algorithms.
    `,
    initialCircuit: {
      id: 'interference-demo',
      name: 'Quantum Interference Test',
      numQubits: 1,
      numMoments: 4,
      qubits: [{ index: 0, name: 'q0', initialValue: 0 }],
      operations: [
        { id: 'h1', gate: 'H', targets: [0], controls: [], moment: 0 },
        { id: 'z1', gate: 'Z', targets: [0], controls: [], moment: 1 },
        { id: 'h2', gate: 'H', targets: [0], controls: [], moment: 2 },
      ],
    },
    experimentGoal: 'Observe that H -> Z -> H transforms |0⟩ into |1⟩ with 100% certainty via destructive interference on |0⟩!',
    isPublished: true,
  },

  // 5. Measurement
  {
    id: 'lesson-5-measurement',
    moduleId: 'mod-foundations',
    title: '5. Quantum Measurement & Wavefunction Collapse',
    description: 'Observation destroys superposition, collapsing the state into a definite classical bit.',
    coreIdea: 'According to the Born rule, measuring a qubit in state α|0⟩ + β|1⟩ yields 0 with probability |α|² and 1 with probability |β|², collapsing the state permanently.',
    order: 5,
    estimatedMinutes: 12,
    difficulty: 'Beginner',
    lessonType: 'experiment',
    content: `
# Quantum Measurement: The Born Rule

Measurement is an irreversible physical operation that extracts classical information from a quantum system.

### Post-Measurement State
Immediately after measuring outcome **0**, the wavefunction collapses:
$$|\\psi_{\\text{after}}\\rangle = |0\\rangle$$
Subsequent measurements on the same qubit will yield outcome **0** with 100% certainty.

In our quantum simulator, you can configure how many **shots** (repetitions) to run (e.g. 10, 100, 512, 1024) to observe the law of large numbers converging to the exact theoretical probabilities.
    `,
    initialCircuit: {
      id: 'measurement-demo',
      name: 'Measurement Sampling Experiment',
      numQubits: 2,
      numMoments: 3,
      qubits: [
        { index: 0, name: 'q0', initialValue: 0 },
        { index: 1, name: 'q1', initialValue: 0 },
      ],
      operations: [
        { id: 'h0', gate: 'H', targets: [0], controls: [], moment: 0 },
        { id: 'm0', gate: 'M', targets: [0], controls: [], moment: 1 },
        { id: 'm1', gate: 'M', targets: [1], controls: [], moment: 1 },
      ],
    },
    experimentGoal: 'Sample 1024 shots and inspect the measurement table to see individual shot occurrences.',
    isPublished: true,
  },

  // 7. X Gate
  {
    id: 'lesson-7-x-gate',
    moduleId: 'mod-core-gates',
    title: '7. The Pauli-X Gate (Quantum NOT)',
    description: 'Rotate the state vector by 180 degrees around the X-axis of the Bloch sphere.',
    coreIdea: 'The Pauli-X gate performs a bit-flip: X|0⟩ = |1⟩ and X|1⟩ = |0⟩. It is represented by the matrix [[0, 1], [1, 0]].',
    order: 7,
    estimatedMinutes: 10,
    difficulty: 'Beginner',
    lessonType: 'interactive',
    content: `
# The Pauli-X Gate

The Pauli-X gate is the direct quantum analogue of the classical **NOT** gate.

### Matrix Representation
$$X = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$$

### Action on Computational Basis
$$X|0\\rangle = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix} \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix} = \\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix} = |1\\rangle$$
$$X|1\\rangle = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix} \\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix} = \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix} = |0\\rangle$$

Because $X^2 = I$, applying two X gates in sequence returns the qubit to its original state.
    `,
    initialCircuit: {
      id: 'x-gate-demo',
      name: 'Pauli-X Gate',
      numQubits: 1,
      numMoments: 3,
      qubits: [{ index: 0, name: 'q0', initialValue: 0 }],
      operations: [{ id: 'x1', gate: 'X', targets: [0], controls: [], moment: 0 }],
    },
    isPublished: true,
    exerciseId: 'ex-invert-qubit',
  },

  // 8. H Gate
  {
    id: 'lesson-8-h-gate',
    moduleId: 'mod-core-gates',
    title: '8. The Hadamard Gate in Depth',
    description: 'Deep dive into Hadamard rotations and basis transitions on the Bloch sphere.',
    coreIdea: 'The Hadamard gate maps between the Z basis (|0⟩, |1⟩) and the X basis (|+⟩, |−⟩).',
    order: 8,
    estimatedMinutes: 12,
    difficulty: 'Beginner',
    lessonType: 'interactive',
    content: `
# The Hadamard Gate (H)

The Hadamard gate is one of the most frequently used gates in quantum algorithms.

### Matrix Form
$$H = \\frac{1}{\\sqrt{2}} \\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}$$

### Geometric Interpretation on Bloch Sphere
The Hadamard gate corresponds to a $180^\\circ$ rotation around the axis $(X + Z)/\\sqrt{2}$.
- Rotates $|0\\rangle$ (North pole along Z) into $|+\\rangle$ (equator along +X).
- Rotates $|1\\rangle$ (South pole along Z) into $|-\\rangle$ (equator along -X), where $|-\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}}$.
    `,
    initialCircuit: {
      id: 'h-gate-deep',
      name: 'Hadamard Exploration',
      numQubits: 1,
      numMoments: 3,
      qubits: [{ index: 0, name: 'q0', initialValue: 1 }],
      operations: [{ id: 'h1', gate: 'H', targets: [0], controls: [], moment: 0 }],
    },
    isPublished: true,
  },

  // 10. Z Gate
  {
    id: 'lesson-10-z-gate',
    moduleId: 'mod-core-gates',
    title: '10. The Pauli-Z Gate (Phase Flip)',
    description: 'Leave computational probabilities intact while flipping the quantum phase.',
    coreIdea: 'Pauli-Z maps |0⟩ → |0⟩ and |1⟩ → −|1⟩. It changes the relative phase without altering measurement probabilities in the standard basis.',
    order: 10,
    estimatedMinutes: 12,
    difficulty: 'Beginner',
    lessonType: 'theory',
    content: `
# The Pauli-Z Gate

While the X gate flips the bit values, the Pauli-Z gate flips the **relative phase**:
$$Z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}$$

### Notice:
If you measure $Z|0\\rangle$ or $Z|1\\rangle$, the measurement probabilities do not change at all!
However, if you prepare $|+\\rangle = (|0\\rangle + |1\\rangle)/\\sqrt{2}$ and apply Z, you get $|-\\rangle = (|0\\rangle - |1\\rangle)/\\sqrt{2}$.
Applying another H reveals that the state is now $|1\\rangle$ instead of $|0\\rangle$!
    `,
    initialCircuit: {
      id: 'z-gate-demo',
      name: 'Pauli-Z Gate Effect',
      numQubits: 1,
      numMoments: 4,
      qubits: [{ index: 0, name: 'q0', initialValue: 0 }],
      operations: [
        { id: 'h1', gate: 'H', targets: [0], controls: [], moment: 0 },
        { id: 'z1', gate: 'Z', targets: [0], controls: [], moment: 1 },
      ],
    },
    isPublished: true,
  },

  // 15. CNOT Gate
  {
    id: 'lesson-15-cnot',
    moduleId: 'mod-circuits',
    title: '15. The CNOT (Controlled-NOT) Gate',
    description: 'The fundamental two-qubit entangling gate.',
    coreIdea: 'CNOT acts on two qubits: if the control qubit is 1, it flips the target qubit. If the control is 0, the target is untouched.',
    order: 15,
    estimatedMinutes: 15,
    difficulty: 'Intermediate',
    lessonType: 'interactive',
    content: `
# The CNOT Gate (Controlled-X)

Classical computing relies on NAND or AND gates, but quantum computing requires **reversible** gates. The CNOT (Controlled-NOT) gate is reversible and unitary!

### Truth Table
| Input | Output |
|---|---|
| |00⟩ | |00⟩ |
| |01⟩ | |01⟩ |
| |10⟩ | |11⟩ |
| |11⟩ | |10⟩ |

### When Control is in Superposition
If the control qubit is in superposition $(|0\\rangle + |1\\rangle)/\\sqrt{2}$ and the target is $|0\\rangle$:
$$\\text{CNOT} \\left(\\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} \\otimes |0\\rangle\\right) = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$
This creates quantum entanglement!
    `,
    initialCircuit: {
      id: 'cnot-demo',
      name: 'CNOT Gate Operation',
      numQubits: 2,
      numMoments: 3,
      qubits: [
        { index: 0, name: 'q0', initialValue: 1 },
        { index: 1, name: 'q1', initialValue: 0 },
      ],
      operations: [
        { id: 'cx1', gate: 'CX', targets: [1], controls: [0], moment: 0 },
      ],
    },
    experimentGoal: 'Verify that when q0 = |1⟩, CNOT flips q1 from |0⟩ to |1⟩, resulting in state |11⟩.',
    isPublished: true,
  },

  // 18. Bell States (Entanglement)
  {
    id: 'lesson-18-bell-states',
    moduleId: 'mod-entanglement',
    title: '18. Creating Bell States (|Φ+⟩)',
    description: 'Generate maximal entanglement between two qubits and observe non-local correlations.',
    coreIdea: 'Applying Hadamard to q0 followed by CNOT(q0, q1) produces the maximally entangled Bell state (|00⟩ + |11⟩)/√2.',
    order: 18,
    estimatedMinutes: 20,
    difficulty: 'Intermediate',
    lessonType: 'experiment',
    content: `
# Bell States: The Essence of Quantum Entanglement

A Bell state is a maximally entangled quantum state of two qubits. The most famous is:
$$|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$

### The Recipe
1. Start with $|00\\rangle$.
2. Apply Hadamard to qubit 0:
   $$|\\psi_1\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} \\otimes |0\\rangle = \\frac{|00\\rangle + |10\\rangle}{\\sqrt{2}}$$
3. Apply CNOT with control = qubit 0 and target = qubit 1:
   $$|\\psi_2\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$

### Correlated Outcomes
Notice that:
- $P(00) = 50\\%$
- $P(11) = 50\\%$
- $P(01) = 0\\%$
- $P(10) = 0\\%$

Neither qubit has a definite state on its own, but measuring one instantly predicts the outcome of measuring the other with 100% certainty!
    `,
    initialCircuit: {
      id: 'bell-state-canonical',
      name: 'Canonical Bell State |Φ+⟩',
      numQubits: 2,
      numMoments: 3,
      qubits: [
        { index: 0, name: 'q0', initialValue: 0 },
        { index: 1, name: 'q1', initialValue: 0 },
      ],
      operations: [
        { id: 'h0', gate: 'H', targets: [0], controls: [], moment: 0 },
        { id: 'cx01', gate: 'CX', targets: [1], controls: [0], moment: 1 },
      ],
    },
    experimentGoal: 'Simulate with 1024 shots. Verify that only states 00 and 11 appear with ~50% frequency each.',
    isPublished: true,
    exerciseId: 'ex-bell-state',
  },

  // 19. Grover's Algorithm
  {
    id: 'lesson-19-grover',
    moduleId: 'mod-algorithms',
    title: '19. Grover\'s Search Algorithm',
    description: 'Quadratic speedup for unstructured database search using amplitude amplification.',
    coreIdea: 'Grover\'s algorithm searches an unsorted database of N items in O(√N) queries instead of classical O(N), using an Oracle and a Diffusion operator to amplify the marked item\'s amplitude.',
    order: 19,
    estimatedMinutes: 30,
    difficulty: 'Advanced',
    lessonType: 'algorithm',
    content: `
# Grover's Search Algorithm

Classical unstructured search requires checking $N$ items one-by-one, taking $O(N)$ operations on average.

Grover's algorithm finds the target item in only $O(\\sqrt{N})$ queries—a provable quadratic speedup!

### The Steps for a 2-Qubit Search ($N = 4$ items):
1. **Initialize equal superposition**: Apply $H$ to all qubits. All 4 states ($|00\\rangle, |01\\rangle, |10\\rangle, |11\\rangle$) have amplitude $+0.5$.
2. **Oracle**: Flips the phase of the marked target item (e.g. state $|11\\rangle$ becomes $-0.5$).
3. **Diffusion Operator (Inversion about the average)**:
   - Compute average amplitude: $(0.5 + 0.5 + 0.5 - 0.5) / 4 = 0.25$.
   - Invert each amplitude around the average: $A_{\\text{new}} = 2 \\times \\text{avg} - A_{\\text{old}}$.
   - For unmarked items: $2(0.25) - 0.5 = 0$.
   - For marked item $|11\\rangle$: $2(0.25) - (-0.5) = +1.0$!
4. **Measurement**: Returns the marked item with **100% probability** in a single query!
    `,
    initialCircuit: {
      id: 'grover-2qubit',
      name: 'Grover Search for |11⟩ (2-Qubit)',
      numQubits: 2,
      numMoments: 6,
      qubits: [
        { index: 0, name: 'q0', initialValue: 0 },
        { index: 1, name: 'q1', initialValue: 0 },
      ],
      operations: [
        // 1. Equal Superposition
        { id: 'g_h0', gate: 'H', targets: [0], controls: [], moment: 0 },
        { id: 'g_h1', gate: 'H', targets: [1], controls: [], moment: 0 },
        // 2. Oracle for |11> (Controlled-Z simulated via H-CX-H)
        { id: 'g_h_oracle', gate: 'H', targets: [1], controls: [], moment: 1 },
        { id: 'g_cx_oracle', gate: 'CX', targets: [1], controls: [0], moment: 2 },
        { id: 'g_h_oracle_end', gate: 'H', targets: [1], controls: [], moment: 3 },
        // 3. Diffusion operator
        { id: 'g_diff_h0', gate: 'H', targets: [0], controls: [], moment: 4 },
        { id: 'g_diff_h1', gate: 'H', targets: [1], controls: [], moment: 4 },
        { id: 'g_diff_x0', gate: 'X', targets: [0], controls: [], moment: 5 },
        { id: 'g_diff_x1', gate: 'X', targets: [1], controls: [], moment: 5 },
      ],
    },
    experimentGoal: 'Run the complete Grover algorithm and observe amplitude amplification focusing probability onto the target.',
    isPublished: true,
    exerciseId: 'ex-grover-challenge',
  },

  // 20. Quantum Fourier Transform
  {
    id: 'lesson-20-qft',
    moduleId: 'mod-algorithms',
    title: '20. Quantum Fourier Transform (QFT)',
    description: 'Transform computational basis states into frequency phase basis states in logarithmic steps.',
    coreIdea: 'The Quantum Fourier Transform maps an n-qubit state to its discrete Fourier transform in O(n²) quantum gates, compared to classical FFT taking O(n 2ⁿ) steps.',
    order: 20,
    estimatedMinutes: 25,
    difficulty: 'Advanced',
    lessonType: 'algorithm',
    content: `
# Quantum Fourier Transform (QFT)

The QFT is the quantum implementation of the Discrete Fourier Transform (DFT). It is the backbone of:
- Shor's algorithm for factoring integers
- Quantum Phase Estimation (QPE)
- Order finding and period estimation

### 2-Qubit QFT Structure
1. Apply $H$ to qubit 0.
2. Apply controlled phase rotation from qubit 1 to qubit 0 (using $S$ gate).
3. Apply $H$ to qubit 1.
4. Apply a final **SWAP** gate between qubit 0 and qubit 1 to reverse the bit order!
    `,
    initialCircuit: {
      id: 'qft-2qubit',
      name: '2-Qubit Quantum Fourier Transform',
      numQubits: 2,
      numMoments: 4,
      qubits: [
        { index: 0, name: 'q0', initialValue: 0 },
        { index: 1, name: 'q1', initialValue: 0 },
      ],
      operations: [
        { id: 'qft_h0', gate: 'H', targets: [0], controls: [], moment: 0 },
        { id: 'qft_s', gate: 'S', targets: [1], controls: [], moment: 1 },
        { id: 'qft_h1', gate: 'H', targets: [1], controls: [], moment: 2 },
        { id: 'qft_swap', gate: 'SWAP', targets: [0, 1], controls: [], moment: 3 },
      ],
    },
    experimentGoal: 'Simulate the 2-qubit QFT and examine how the state vector spreads uniform magnitude with structured phases.',
    isPublished: true,
    exerciseId: 'ex-qft-challenge',
  },

  // 21. Circuit Equivalence
  {
    id: 'lesson-21-equivalence',
    moduleId: 'mod-advanced-nisq',
    title: '21. Circuit Equivalence & Unitary Invariants',
    description: 'Verify whether two distinct circuit designs implement the exact same quantum transformation.',
    coreIdea: 'Two quantum circuits are equivalent if their global unitary operators differ at most by an unmeasurable global phase e^(iθ).',
    order: 21,
    estimatedMinutes: 15,
    difficulty: 'Advanced',
    lessonType: 'theory',
    content: `
# Circuit Equivalence & Unitary Fidelity

In quantum compiler design and educational assessment, there are usually dozens of valid ways to implement a target algorithm.

Our platform evaluates two levels of equivalence:
1. **Behavioral / Probability Equivalence**: Do both circuits output the same probability distribution across computational basis states?
2. **Formal Unitary Equivalence**: Do both circuits implement the exact same unitary matrix $U$ up to a global phase $e^{i\\theta}$?
   $$\\frac{|\\text{Tr}(U_{\\text{student}}^\\dagger U_{\\text{ref}})|}{2^n} = 1.0$$
    `,
    initialCircuit: {
      id: 'equiv-demo',
      name: 'H-Z-H vs X Equivalence',
      numQubits: 1,
      numMoments: 4,
      qubits: [{ index: 0, name: 'q0', initialValue: 0 }],
      operations: [
        { id: 'eq_h1', gate: 'H', targets: [0], controls: [], moment: 0 },
        { id: 'eq_z', gate: 'Z', targets: [0], controls: [], moment: 1 },
        { id: 'eq_h2', gate: 'H', targets: [0], controls: [], moment: 2 },
      ],
    },
    isPublished: true,
    exerciseId: 'ex-equivalent-circuit',
  },

  // 23. Noise & NISQ Concepts
  {
    id: 'lesson-23-noise',
    moduleId: 'mod-advanced-nisq',
    title: '23. Noise Channels & NISQ Decoherence',
    description: 'Understanding physical errors: bit flip, phase flip, depolarizing channels, and readout noise.',
    coreIdea: 'Current Noisy Intermediate-Scale Quantum (NISQ) processors suffer from environmental decoherence and imperfect gate fidelities.',
    order: 23,
    estimatedMinutes: 20,
    difficulty: 'Advanced',
    lessonType: 'experiment',
    content: `
# Noise and NISQ Era Quantum Computing

We currently live in the **NISQ** (Noisy Intermediate-Scale Quantum) era. Physical qubits on superconducting chips or trapped ions are susceptible to environmental noise.

### Key Noise Channels:
1. **Bit Flip**: Environmental coupling causes $|0\\rangle \\leftrightarrow |1\\rangle$ transitions (analogous to classical noise).
2. **Phase Flip**: Random fluctuations destroy quantum phase coherence without changing population probabilities.
3. **Depolarizing Noise**: The qubit randomly undergoes isotropic Pauli degradation towards the maximally mixed state $I/2$.
4. **Readout / SPAM Error**: The measurement apparatus misclassifies 0 as 1 or 1 as 0.

### Experiment with Simulated Noise:
In our workbench, toggle **Noise ON** and vary the error rate to see how perfect quantum interference degrades into classical noise!
    `,
    initialCircuit: {
      id: 'noise-demo',
      name: 'Noisy Bell State Demonstration',
      numQubits: 2,
      numMoments: 3,
      qubits: [
        { index: 0, name: 'q0', initialValue: 0 },
        { index: 1, name: 'q1', initialValue: 0 },
      ],
      operations: [
        { id: 'n_h', gate: 'H', targets: [0], controls: [], moment: 0 },
        { id: 'n_cx', gate: 'CX', targets: [1], controls: [0], moment: 1 },
      ],
    },
    experimentGoal: 'Enable the Simulated Noise Model and observe spurious 01 and 10 counts appearing in the Bell state measurement!',
    isPublished: true,
  },
];
