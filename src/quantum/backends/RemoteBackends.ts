import { QuantumBackendInfo, QuantumBackendType } from '../../types/quantum';

export const REMOTE_BACKENDS_INFO: QuantumBackendInfo[] = [
  {
    id: 'browser-simulator',
    name: 'Browser State Vector Simulator',
    description: 'Native TypeScript Complex128 engine executing directly in the client browser with zero latency.',
    isAvailable: true,
    statusMessage: 'Ready (Active Backend)',
    maxQubits: 10,
  },
  {
    id: 'qiskit-aer',
    name: 'IBM Qiskit Aer (Remote Worker)',
    description: 'High-performance C++ simulator for noisy quantum circuits via cloud microservice.',
    isAvailable: false,
    statusMessage: 'Remote Python execution requires dedicated Cloud Run backend (unsupported in frontend-only build).',
    maxQubits: 32,
  },
  {
    id: 'cirq',
    name: 'Google Cirq (Remote Engine)',
    description: 'Google Quantum AI open-source framework for NISQ algorithms and Sycamore processor emulation.',
    isAvailable: false,
    statusMessage: 'Remote Python service not configured. Switch to In-Browser Simulator.',
    maxQubits: 28,
  },
  {
    id: 'pennylane',
    name: 'Xanadu PennyLane (Differentiable)',
    description: 'Quantum machine learning and variational quantum circuit gradient engine.',
    isAvailable: false,
    statusMessage: 'Requires external Python PyTorch/JAX runtime.',
    maxQubits: 24,
  },
  {
    id: 'qbraid',
    name: 'qBraid Cloud Platform',
    description: 'Unified quantum cloud access to diverse quantum processors and simulators.',
    isAvailable: false,
    statusMessage: 'Requires qBraid API credentials and cloud proxy.',
    maxQubits: 36,
  },
  {
    id: 'ibm-hardware',
    name: 'IBM Quantum Eagle / Heron QPU',
    description: 'Superconducting transmon quantum processor accessed via IBM Quantum Runtime.',
    isAvailable: false,
    statusMessage: 'Requires IBM Quantum API token and cloud queue dispatch.',
    maxQubits: 127,
  },
];
