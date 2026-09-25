import { Complex } from '../quantum/ComplexNumber';

export type GateType =
  | 'H'
  | 'X'
  | 'Y'
  | 'Z'
  | 'S'
  | 'T'
  | 'CX'
  | 'SWAP'
  | 'M'
  | 'U'; // Generic unitary / unknown gate

export interface GateInfo {
  type: GateType;
  name: string;
  symbol: string;
  category: 'single' | 'phase' | 'multi' | 'measurement' | 'special';
  description: string;
  numTargets: number;
  numControls: number;
  qiskitSyntax: string;
  matrix?: Complex[][];
  color: string;
}

export interface QubitDefinition {
  index: number;
  name: string;
  initialValue: 0 | 1;
}

export interface CircuitOperation {
  id: string;
  gate: GateType;
  targets: number[];
  controls: number[];
  moment: number;
  params?: Record<string, number>;
  customMatrix?: Complex[][]; // For unknown gate challenges
  isUnknown?: boolean;
}

export interface CircuitModel {
  id: string;
  name: string;
  description?: string;
  numQubits: number;
  numMoments: number;
  qubits: QubitDefinition[];
  operations: CircuitOperation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BasisState {
  binary: string;
  decimal: number;
  amplitude: Complex;
  probability: number;
  phase: number;
}

export interface SimulationResult {
  stateVector: Complex[];
  basisStates: BasisState[];
  probabilities: Record<string, number>;
  shots: number;
  measurementCounts: Record<string, number>;
  measurementHistory: string[];
  sampledAt: number;
  noiseApplied: boolean;
  executionTimeMs: number;
  blochSpheres: Record<number, BlochVector>;
}

export interface BlochVector {
  theta: number; // polar angle [0, pi]
  phi: number; // azimuthal angle [0, 2pi)
  x: number;
  y: number;
  z: number;
  p0: number;
  p1: number;
}

export interface NoiseSettings {
  enabled: boolean;
  bitFlipRate: number; // 0 to 1
  phaseFlipRate: number;
  depolarizingRate: number;
  readoutErrorRate: number;
}

export type QuantumBackendType =
  | 'browser-simulator'
  | 'qiskit-aer'
  | 'cirq'
  | 'pennylane'
  | 'qbraid'
  | 'ibm-hardware';

export interface QuantumBackendInfo {
  id: QuantumBackendType;
  name: string;
  description: string;
  isAvailable: boolean;
  statusMessage: string;
  maxQubits: number;
}
