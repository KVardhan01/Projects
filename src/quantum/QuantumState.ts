import { Complex } from './ComplexNumber';
import { BasisState, BlochVector } from '../types/quantum';

export class QuantumState {
  readonly numQubits: number;
  readonly dimension: number;
  private vector: Complex[];

  constructor(numQubits: number, initialValues?: (0 | 1)[]) {
    if (numQubits < 1 || numQubits > 12) {
      throw new Error(`Number of qubits must be between 1 and 12 (got ${numQubits})`);
    }
    this.numQubits = numQubits;
    this.dimension = 1 << numQubits;
    this.vector = new Array(this.dimension).fill(null).map(() => Complex.ZERO);

    // Default to |00...0> or set according to initialValues
    let initialIndex = 0;
    if (initialValues && initialValues.length === numQubits) {
      for (let i = 0; i < numQubits; i++) {
        if (initialValues[i] === 1) {
          // Qubit 0 is MSB or LSB? Standard convention: qubit 0 is highest or lowest bit.
          // Let's adopt standard big-endian convention:
          // |q_0 q_1 ... q_{n-1}> where bit (n - 1 - i) corresponds to q_i.
          initialIndex |= 1 << (numQubits - 1 - i);
        }
      }
    }
    this.vector[initialIndex] = Complex.ONE;
  }

  static fromVector(vector: Complex[]): QuantumState {
    const dim = vector.length;
    const numQubits = Math.round(Math.log2(dim));
    if ((1 << numQubits) !== dim) {
      throw new Error(`Vector length ${dim} must be a power of 2`);
    }
    const state = new QuantumState(numQubits);
    state.vector = vector.map((c) => new Complex(c.re, c.im));
    return state;
  }

  clone(): QuantumState {
    const copy = new QuantumState(this.numQubits);
    copy.vector = this.vector.map((c) => new Complex(c.re, c.im));
    return copy;
  }

  getVector(): Complex[] {
    return this.vector.map((c) => new Complex(c.re, c.im));
  }

  getAmplitude(index: number): Complex {
    return this.vector[index] || Complex.ZERO;
  }

  setAmplitude(index: number, amp: Complex): void {
    this.vector[index] = amp;
  }

  normalize(): void {
    let normSq = 0;
    for (let i = 0; i < this.dimension; i++) {
      normSq += this.vector[i].magnitudeSquared();
    }
    if (normSq === 0) {
      throw new Error('Cannot normalize zero vector');
    }
    const norm = Math.sqrt(normSq);
    for (let i = 0; i < this.dimension; i++) {
      this.vector[i] = this.vector[i].div(norm);
    }
  }

  getProbabilities(): number[] {
    return this.vector.map((amp) => amp.magnitudeSquared());
  }

  getBasisStates(): BasisState[] {
    const states: BasisState[] = [];
    for (let i = 0; i < this.dimension; i++) {
      const binary = i.toString(2).padStart(this.numQubits, '0');
      const amp = this.vector[i];
      const prob = amp.magnitudeSquared();
      const phase = amp.phase();
      states.push({
        binary,
        decimal: i,
        amplitude: amp,
        probability: prob,
        phase,
      });
    }
    return states;
  }

  /**
   * Computes reduced single-qubit Bloch Sphere coordinates for qubitIndex.
   * Uses partial trace for multi-qubit systems.
   */
  getBlochVector(qubitIndex: number): BlochVector {
    if (qubitIndex < 0 || qubitIndex >= this.numQubits) {
      throw new Error(`Invalid qubit index: ${qubitIndex}`);
    }

    const bitPos = this.numQubits - 1 - qubitIndex;
    let rho00 = 0;
    let rho11 = 0;
    let rho01 = Complex.ZERO;

    // Partial trace over all other qubits
    for (let i = 0; i < this.dimension; i++) {
      const bit = (i >> bitPos) & 1;
      const ampI = this.vector[i];
      const prob = ampI.magnitudeSquared();

      if (bit === 0) {
        rho00 += prob;
        // Find corresponding state with bit 1
        const j = i | (1 << bitPos);
        const ampJ = this.vector[j];
        // rho01 += amp(0) * amp(1)*
        rho01 = rho01.add(ampI.mul(ampJ.conjugate()));
      } else {
        rho11 += prob;
      }
    }

    // Pauli expectation values:
    // <X> = 2 * Re(rho01)
    // <Y> = 2 * Im(rho01) (or -2 Im depending on convention; rho = 1/2 [I + r.sigma])
    // <Z> = rho00 - rho11
    const x = 2 * rho01.re;
    const y = 2 * rho01.im;
    const z = rho00 - rho11;

    // Spherical coordinates
    const r = Math.sqrt(x * x + y * y + z * z);
    const safeZ = Math.max(-1, Math.min(1, r > 0 ? z / r : 0));
    const theta = Math.acos(safeZ);
    let phi = Math.atan2(y, x);
    if (phi < 0) phi += 2 * Math.PI;

    return {
      theta,
      phi,
      x: Math.abs(x) < 1e-7 ? 0 : x,
      y: Math.abs(y) < 1e-7 ? 0 : y,
      z: Math.abs(z) < 1e-7 ? 0 : z,
      p0: rho00,
      p1: rho11,
    };
  }

  innerProduct(other: QuantumState): Complex {
    if (this.dimension !== other.dimension) {
      throw new Error('Dimension mismatch for inner product');
    }
    let sum = Complex.ZERO;
    for (let i = 0; i < this.dimension; i++) {
      sum = sum.add(this.vector[i].conjugate().mul(other.vector[i]));
    }
    return sum;
  }

  fidelity(other: QuantumState): number {
    const ip = this.innerProduct(other);
    return ip.magnitudeSquared();
  }

  sampleMeasurements(shots: number, readoutError: number = 0): {
    counts: Record<string, number>;
    history: string[];
  } {
    const probs = this.getProbabilities();
    const cdf: number[] = [];
    let cum = 0;
    for (let i = 0; i < probs.length; i++) {
      cum += probs[i];
      cdf.push(cum);
    }
    // Ensure final element is 1.0 to avoid precision issues
    cdf[cdf.length - 1] = 1.0;

    const counts: Record<string, number> = {};
    const history: string[] = [];

    // Initialize all basis states with 0
    for (let i = 0; i < this.dimension; i++) {
      const bitStr = i.toString(2).padStart(this.numQubits, '0');
      counts[bitStr] = 0;
    }

    for (let s = 0; s < shots; s++) {
      const r = Math.random();
      let chosenIdx = 0;
      for (let i = 0; i < cdf.length; i++) {
        if (r <= cdf[i]) {
          chosenIdx = i;
          break;
        }
      }

      // Convert to binary string
      let bitArr = chosenIdx.toString(2).padStart(this.numQubits, '0').split('');

      // Apply readout error if configured
      if (readoutError > 0) {
        for (let b = 0; b < bitArr.length; b++) {
          if (Math.random() < readoutError) {
            bitArr[b] = bitArr[b] === '0' ? '1' : '0';
          }
        }
      }

      const outcome = bitArr.join('');
      counts[outcome] = (counts[outcome] || 0) + 1;
      if (history.length < 100) {
        // Keep last/first 100 for display table
        history.push(outcome);
      }
    }

    return { counts, history };
  }
}
