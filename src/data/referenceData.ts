export interface ReferenceItem {
  id: string;
  category: 'Concepts' | 'Single Qubit Gates' | 'Multi Qubit Gates' | 'Algorithms' | 'Physical & NISQ';
  title: string;
  symbol?: string;
  qiskitSyntax?: string;
  matrixFormula?: string;
  summary: string;
  explanation: string;
  useCases: string[];
}

export const REFERENCE_ITEMS: ReferenceItem[] = [
  // Concepts
  {
    id: 'ref-qubit',
    category: 'Concepts',
    title: 'Qubit (Quantum Bit)',
    symbol: '|ψ⟩',
    summary: 'The basic atomic unit of quantum computation.',
    explanation: 'A two-level quantum system represented as a linear combination |ψ⟩ = α|0⟩ + β|1⟩, where α and β are complex numbers satisfying |α|² + |β|² = 1.',
    useCases: ['Superconducting transmons', 'Trapped ions', 'Photonic qubits', 'Silicon spin qubits'],
  },
  {
    id: 'ref-superposition',
    category: 'Concepts',
    title: 'Superposition',
    symbol: 'α|0⟩ + β|1⟩',
    summary: 'The capability of a quantum system to exist simultaneously in a combination of basis states.',
    explanation: 'Unlike classical bits that are exclusively 0 or 1, a qubit in superposition possesses genuine wave-like potentiality for both outcomes until measured.',
    useCases: ['Quantum parallelism', 'Quantum search initial state', 'Interferometry'],
  },
  {
    id: 'ref-measurement',
    category: 'Concepts',
    title: 'Measurement & Collapse',
    symbol: 'M',
    qiskitSyntax: 'qc.measure(qubit, cbit)',
    summary: 'Extraction of classical information resulting in state collapse.',
    explanation: 'Under the Born rule, projective measurement collapses the state vector into an eigenstate |0⟩ or |1⟩ with probabilities |α|² and |β|².',
    useCases: ['Reading output registers', 'Syndrome measurement in QEC', 'Mid-circuit teleportation'],
  },
  {
    id: 'ref-bloch-sphere',
    category: 'Concepts',
    title: 'Bloch Sphere',
    symbol: 'S²',
    summary: 'Geometric representation of pure single-qubit states on the surface of a unit sphere.',
    explanation: 'Any pure state can be written as cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩. The angles θ and φ parameterize the polar and azimuthal positions on the sphere.',
    useCases: ['Visualizing single-qubit gate rotations', 'Microwave pulse design', 'Phase tracking'],
  },
  {
    id: 'ref-entanglement',
    category: 'Concepts',
    title: 'Quantum Entanglement',
    symbol: '|Φ⁺⟩',
    summary: 'Non-local physical correlations where composite state cannot be factored.',
    explanation: 'Two or more particles share an inseparable joint state. Measuring one immediately dictates the measurement statistics of the other, even across cosmic distances.',
    useCases: ['Quantum teleportation', 'Superdense coding', 'E91 Quantum Key Distribution'],
  },

  // Gates
  {
    id: 'ref-gate-h',
    category: 'Single Qubit Gates',
    title: 'Hadamard Gate (H)',
    symbol: 'H',
    qiskitSyntax: 'qc.h(0)',
    matrixFormula: '1/√2 [[1, 1], [1, -1]]',
    summary: 'Creates equal superposition and transitions between Z and X bases.',
    explanation: 'Maps |0⟩ → (|0⟩ + |1⟩)/√2 and |1⟩ → (|0⟩ - |1⟩)/√2. It is unitary and Hermitian (H² = I).',
    useCases: ['Algorithm initialization', 'Interference loops', 'Basis transformation'],
  },
  {
    id: 'ref-gate-x',
    category: 'Single Qubit Gates',
    title: 'Pauli-X Gate (NOT)',
    symbol: 'X',
    qiskitSyntax: 'qc.x(0)',
    matrixFormula: '[[0, 1], [1, 0]]',
    summary: 'Bit-flip gate, equivalent to 180° rotation around the X-axis.',
    explanation: 'Transforms |0⟩ → |1⟩ and |1⟩ → |0⟩. The quantum equivalent of the classical inverter.',
    useCases: ['Bit initialization', 'Oracle arithmetic', 'Quantum error correction bit-flip detection'],
  },
  {
    id: 'ref-gate-y',
    category: 'Single Qubit Gates',
    title: 'Pauli-Y Gate',
    symbol: 'Y',
    qiskitSyntax: 'qc.y(0)',
    matrixFormula: '[[0, -i], [i, 0]]',
    summary: 'Bit and phase flip gate with imaginary phase.',
    explanation: 'Rotates 180° around the Y-axis. Maps |0⟩ → i|1⟩ and |1⟩ → -i|0⟩.',
    useCases: ['Universal gate sets', 'Dynamical decoupling pulses', 'Spin echo'],
  },
  {
    id: 'ref-gate-z',
    category: 'Single Qubit Gates',
    title: 'Pauli-Z Gate (Phase Flip)',
    symbol: 'Z',
    qiskitSyntax: 'qc.z(0)',
    matrixFormula: '[[1, 0], [0, -1]]',
    summary: 'Phase flip gate; rotates 180° around the Z-axis.',
    explanation: 'Leaves |0⟩ unchanged and maps |1⟩ → -|1⟩. In computational basis, probabilities do not change.',
    useCases: ['Phase marking in search oracles', 'Parity checks', 'Stabilizer code generators'],
  },
  {
    id: 'ref-gate-s',
    category: 'Single Qubit Gates',
    title: 'Phase Gate (S / √Z)',
    symbol: 'S',
    qiskitSyntax: 'qc.s(0)',
    matrixFormula: '[[1, 0], [0, i]]',
    summary: 'Quarter-turn (90°) rotation around the Z-axis.',
    explanation: 'Adds a relative phase of π/2 to |1⟩: |1⟩ → i|1⟩. Note that S² = Z.',
    useCases: ['Clifford group operations', 'Quantum Fourier Transform', 'Fault-tolerant compilation'],
  },
  {
    id: 'ref-gate-t',
    category: 'Single Qubit Gates',
    title: 'π/8 Gate (T / ∜Z)',
    symbol: 'T',
    qiskitSyntax: 'qc.t(0)',
    matrixFormula: '[[1, 0], [0, e^(iπ/4)]]',
    summary: 'Eighth-turn (45°) rotation around the Z-axis.',
    explanation: 'Adds phase e^(iπ/4) to |1⟩. Crucial non-Clifford gate required for universal quantum computation.',
    useCases: ['Magic state distillation', 'Universal quantum computation', 'Fine phase synthesis'],
  },
  {
    id: 'ref-gate-cx',
    category: 'Multi Qubit Gates',
    title: 'CNOT / Controlled-X Gate (CX)',
    symbol: 'CX',
    qiskitSyntax: 'qc.cx(control, target)',
    summary: 'Controlled-NOT: flips target if control is |1⟩.',
    explanation: 'The archetypal entangling gate. Preserves the control qubit while conditionally inverting the target.',
    useCases: ['Bell state generation', 'Syndrome extraction', 'Quantum teleportation circuits'],
  },
  {
    id: 'ref-gate-swap',
    category: 'Multi Qubit Gates',
    title: 'SWAP Gate',
    symbol: 'SWAP',
    qiskitSyntax: 'qc.swap(qubitA, qubitB)',
    summary: 'Exchanges the states of two qubits: |ab⟩ → |ba⟩.',
    explanation: 'Can be synthesized from three alternating CNOT gates: CX(a, b) · CX(b, a) · CX(a, b).',
    useCases: ['Routing on physical hardware coupling graphs', 'Reversing bit order in QFT'],
  },

  // Algorithms
  {
    id: 'ref-grover',
    category: 'Algorithms',
    title: "Grover's Search Algorithm",
    summary: 'Quadratic speedup for searching unsorted databases in O(√N) queries.',
    explanation: 'Employs an Oracle to mark target elements with a negative phase, followed by a Grover Diffusion operator that inverts amplitudes around the mean.',
    useCases: ['Database searching', 'Constraint satisfaction (SAT solving)', 'Optimization heuristics'],
  },
  {
    id: 'ref-qft',
    category: 'Algorithms',
    title: 'Quantum Fourier Transform (QFT)',
    summary: 'Exponential speedup for computing discrete Fourier transforms.',
    explanation: 'Operates on amplitudes in O(n²) quantum gates compared to classical FFT taking O(n 2ⁿ) operations.',
    useCases: ["Shor's factoring algorithm", 'Quantum Phase Estimation', 'Discrete logarithm'],
  },

  // Physical & NISQ
  {
    id: 'ref-nisq',
    category: 'Physical & NISQ',
    title: 'NISQ (Noisy Intermediate-Scale Quantum)',
    summary: 'The current era of quantum hardware (50–1,000 qubits without full fault tolerance).',
    explanation: 'Characterized by limited coherence times (T1, T2), gate errors (~0.1% to 1%), and imperfect readout, requiring noise-resilient hybrid algorithms.',
    useCases: ['VQE (Variational Quantum Eigensolver)', 'QAOA (Quantum Approximate Optimization)'],
  },
  {
    id: 'ref-noise-channels',
    category: 'Physical & NISQ',
    title: 'Quantum Noise Channels',
    summary: 'Mathematical models of decoherence and environmental dissipation.',
    explanation: 'Common models include Bit-Flip (X errors), Phase-Flip (Z errors), Depolarizing channels (isotropic Pauli errors), and Readout (measurement classification error).',
    useCases: ['Quantum error correction benchmarks', 'Noise mitigation techniques', 'Fault tolerance simulations'],
  },
];
