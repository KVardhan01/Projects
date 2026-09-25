import { Complex } from './ComplexNumber';
import { GateType, GateInfo } from '../types/quantum';
import { QuantumState } from './QuantumState';

const INV_SQRT2 = 1 / Math.SQRT2;

export class QuantumGate {
  readonly type: GateType;
  readonly name: string;
  readonly matrix: Complex[][];

  constructor(type: GateType, name: string, matrix: Complex[][]) {
    this.type = type;
    this.name = name;
    this.matrix = matrix;
  }

  static readonly H = new QuantumGate('H', 'Hadamard', [
    [new Complex(INV_SQRT2, 0), new Complex(INV_SQRT2, 0)],
    [new Complex(INV_SQRT2, 0), new Complex(-INV_SQRT2, 0)],
  ]);

  static readonly X = new QuantumGate('X', 'Pauli-X', [
    [Complex.ZERO, Complex.ONE],
    [Complex.ONE, Complex.ZERO],
  ]);

  static readonly Y = new QuantumGate('Y', 'Pauli-Y', [
    [Complex.ZERO, new Complex(0, -1)],
    [new Complex(0, 1), Complex.ZERO],
  ]);

  static readonly Z = new QuantumGate('Z', 'Pauli-Z', [
    [Complex.ONE, Complex.ZERO],
    [Complex.ZERO, Complex.NEG_ONE],
  ]);

  static readonly S = new QuantumGate('S', 'Phase S', [
    [Complex.ONE, Complex.ZERO],
    [Complex.ZERO, Complex.I],
  ]);

  static readonly T = new QuantumGate('T', 'Phase T', [
    [Complex.ONE, Complex.ZERO],
    [Complex.ZERO, new Complex(INV_SQRT2, INV_SQRT2)],
  ]);

  static readonly I = new QuantumGate('U', 'Identity', [
    [Complex.ONE, Complex.ZERO],
    [Complex.ZERO, Complex.ONE],
  ]);

  static getGate(type: GateType, customMatrix?: Complex[][]): QuantumGate {
    switch (type) {
      case 'H':
        return QuantumGate.H;
      case 'X':
        return QuantumGate.X;
      case 'Y':
        return QuantumGate.Y;
      case 'Z':
        return QuantumGate.Z;
      case 'S':
        return QuantumGate.S;
      case 'T':
        return QuantumGate.T;
      case 'U':
        if (customMatrix) {
          return new QuantumGate('U', 'Custom Unitary', customMatrix);
        }
        return QuantumGate.I;
      default:
        return QuantumGate.I;
    }
  }

  /**
   * Applies a single-qubit gate directly to a QuantumState vector.
   * High performance O(2^N) state vector transformation.
   */
  static applySingleQubitGate(
    state: QuantumState,
    targetQubit: number,
    gateMatrix: Complex[][]
  ): void {
    const n = state.numQubits;
    const bitPos = n - 1 - targetQubit;
    const bitMask = 1 << bitPos;

    const u00 = gateMatrix[0][0];
    const u01 = gateMatrix[0][1];
    const u10 = gateMatrix[1][0];
    const u11 = gateMatrix[1][1];

    for (let i = 0; i < state.dimension; i++) {
      // Process pairs where bit is 0
      if ((i & bitMask) === 0) {
        const j = i | bitMask; // pair index where bit is 1
        const a = state.getAmplitude(i);
        const b = state.getAmplitude(j);

        const newA = u00.mul(a).add(u01.mul(b));
        const newB = u10.mul(a).add(u11.mul(b));

        state.setAmplitude(i, newA);
        state.setAmplitude(j, newB);
      }
    }
  }

  /**
   * Applies a Controlled single-qubit gate (e.g. CNOT / CX, Controlled-Z)
   */
  static applyControlledGate(
    state: QuantumState,
    controlQubit: number,
    targetQubit: number,
    gateMatrix: Complex[][]
  ): void {
    const n = state.numQubits;
    const ctrlPos = n - 1 - controlQubit;
    const tgtPos = n - 1 - targetQubit;
    const ctrlMask = 1 << ctrlPos;
    const tgtMask = 1 << tgtPos;

    const u00 = gateMatrix[0][0];
    const u01 = gateMatrix[0][1];
    const u10 = gateMatrix[1][0];
    const u11 = gateMatrix[1][1];

    for (let i = 0; i < state.dimension; i++) {
      // Check if control bit is 1 and target bit is 0
      if ((i & ctrlMask) !== 0 && (i & tgtMask) === 0) {
        const j = i | tgtMask; // corresponding state where target bit is 1
        const a = state.getAmplitude(i);
        const b = state.getAmplitude(j);

        const newA = u00.mul(a).add(u01.mul(b));
        const newB = u10.mul(a).add(u11.mul(b));

        state.setAmplitude(i, newA);
        state.setAmplitude(j, newB);
      }
    }
  }

  /**
   * Applies SWAP gate between qubitA and qubitB.
   */
  static applySwapGate(state: QuantumState, qubitA: number, qubitB: number): void {
    if (qubitA === qubitB) return;
    const n = state.numQubits;
    const posA = n - 1 - qubitA;
    const posB = n - 1 - qubitB;
    const maskA = 1 << posA;
    const maskB = 1 << posB;

    for (let i = 0; i < state.dimension; i++) {
      const bitA = (i & maskA) !== 0 ? 1 : 0;
      const bitB = (i & maskB) !== 0 ? 1 : 0;

      // Swap only when bits differ and bitA is 0 (to visit pair once)
      if (bitA === 0 && bitB === 1) {
        const j = (i | maskA) & ~maskB;
        const ampI = state.getAmplitude(i);
        const ampJ = state.getAmplitude(j);
        state.setAmplitude(i, ampJ);
        state.setAmplitude(j, ampI);
      }
    }
  }

  /**
   * Kronecker (Tensor) product of two matrices A (m x n) and B (p x q).
   */
  static tensorProduct(A: Complex[][], B: Complex[][]): Complex[][] {
    const rowsA = A.length;
    const colsA = A[0].length;
    const rowsB = B.length;
    const colsB = B[0].length;

    const result: Complex[][] = [];
    for (let i = 0; i < rowsA * rowsB; i++) {
      result.push(new Array(colsA * colsB).fill(Complex.ZERO));
    }

    for (let rA = 0; rA < rowsA; rA++) {
      for (let cA = 0; cA < colsA; cA++) {
        const valA = A[rA][cA];
        for (let rB = 0; rB < rowsB; rB++) {
          for (let cB = 0; cB < colsB; cB++) {
            result[rA * rowsB + rB][cA * colsB + cB] = valA.mul(B[rB][cB]);
          }
        }
      }
    }

    return result;
  }

  /**
   * Matrix multiplication of two square complex matrices.
   */
  static matrixMultiply(A: Complex[][], B: Complex[][]): Complex[][] {
    const n = A.length;
    const result: Complex[][] = [];
    for (let i = 0; i < n; i++) {
      result.push(new Array(n).fill(Complex.ZERO));
      for (let j = 0; j < n; j++) {
        let sum = Complex.ZERO;
        for (let k = 0; k < n; k++) {
          sum = sum.add(A[i][k].mul(B[k][j]));
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  /**
   * Create identity matrix of dimension dim.
   */
  static identityMatrix(dim: number): Complex[][] {
    const mat: Complex[][] = [];
    for (let i = 0; i < dim; i++) {
      const row = new Array(dim).fill(Complex.ZERO);
      row[i] = Complex.ONE;
      mat.push(row);
    }
    return mat;
  }
}

export const GATE_REGISTRY: Record<GateType, GateInfo> = {
  H: {
    type: 'H',
    name: 'Hadamard',
    symbol: 'H',
    category: 'single',
    description: 'Creates equal superposition |0⟩ → (|0⟩+|1⟩)/√2. Converts between computational and X basis.',
    numTargets: 1,
    numControls: 0,
    qiskitSyntax: 'qc.h({target})',
    color: 'emerald',
    matrix: QuantumGate.H.matrix,
  },
  X: {
    type: 'X',
    name: 'Pauli-X (NOT)',
    symbol: 'X',
    category: 'single',
    description: 'Bit flip gate. Flips |0⟩ to |1⟩ and |1⟩ to |0⟩ (quantum NOT gate).',
    numTargets: 1,
    numControls: 0,
    qiskitSyntax: 'qc.x({target})',
    color: 'cyan',
    matrix: QuantumGate.X.matrix,
  },
  Y: {
    type: 'Y',
    name: 'Pauli-Y',
    symbol: 'Y',
    category: 'single',
    description: 'Bit and phase flip gate with imaginary phase: |0⟩ → i|1⟩, |1⟩ → -i|0⟩.',
    numTargets: 1,
    numControls: 0,
    qiskitSyntax: 'qc.y({target})',
    color: 'teal',
    matrix: QuantumGate.Y.matrix,
  },
  Z: {
    type: 'Z',
    name: 'Pauli-Z',
    symbol: 'Z',
    category: 'phase',
    description: 'Phase flip gate. Leaves |0⟩ unchanged, flips phase of |1⟩ to -|1⟩.',
    numTargets: 1,
    numControls: 0,
    qiskitSyntax: 'qc.z({target})',
    color: 'indigo',
    matrix: QuantumGate.Z.matrix,
  },
  S: {
    type: 'S',
    name: 'Phase (S / √Z)',
    symbol: 'S',
    category: 'phase',
    description: 'Phase gate (quarter turn around Z axis). Adds π/2 phase to |1⟩: |1⟩ → i|1⟩.',
    numTargets: 1,
    numControls: 0,
    qiskitSyntax: 'qc.s({target})',
    color: 'purple',
    matrix: QuantumGate.S.matrix,
  },
  T: {
    type: 'T',
    name: 'π/8 (T / ∜Z)',
    symbol: 'T',
    category: 'phase',
    description: 'T gate. Adds π/4 phase to |1⟩: |1⟩ → e^(iπ/4)|1⟩. Key for universal fault-tolerant computation.',
    numTargets: 1,
    numControls: 0,
    qiskitSyntax: 'qc.t({target})',
    color: 'pink',
    matrix: QuantumGate.T.matrix,
  },
  CX: {
    type: 'CX',
    name: 'CNOT (Controlled-X)',
    symbol: 'CX',
    category: 'multi',
    description: 'Controlled-NOT. Flips target qubit if and only if control qubit is |1⟩. Generates entanglement.',
    numTargets: 1,
    numControls: 1,
    qiskitSyntax: 'qc.cx({control}, {target})',
    color: 'sky',
  },
  SWAP: {
    type: 'SWAP',
    name: 'SWAP',
    symbol: 'SW',
    category: 'multi',
    description: 'Exchanges the states of two qubits: |ab⟩ → |ba⟩.',
    numTargets: 2,
    numControls: 0,
    qiskitSyntax: 'qc.swap({target1}, {target2})',
    color: 'amber',
  },
  M: {
    type: 'M',
    name: 'Measurement',
    symbol: 'M',
    category: 'measurement',
    description: 'Measures the qubit in the computational basis, collapsing superposition into a classical bit (0 or 1).',
    numTargets: 1,
    numControls: 0,
    qiskitSyntax: 'qc.measure({target}, {cbit})',
    color: 'rose',
  },
  U: {
    type: 'U',
    name: 'Unknown / Custom Gate',
    symbol: 'U',
    category: 'special',
    description: 'A black-box quantum gate for exploration, identification, and tomography challenges.',
    numTargets: 1,
    numControls: 0,
    qiskitSyntax: '# Custom / Black-box Gate U',
    color: 'violet',
  },
};
