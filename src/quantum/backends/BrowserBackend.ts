import { QuantumBackend } from './QuantumBackend';
import { CircuitModel, SimulationResult, NoiseSettings, QuantumBackendType } from '../../types/quantum';
import { QuantumCircuitSimulator } from '../QuantumCircuitSimulator';
import { NoiseModel } from '../NoiseModel';

export class BrowserQuantumBackend implements QuantumBackend {
  readonly id: QuantumBackendType = 'browser-simulator';
  readonly name = 'In-Browser Quantum State Vector Simulator';
  readonly description = 'High-precision native TypeScript complex state-vector engine running directly inside the client browser.';
  readonly isAvailable = true;
  readonly maxQubits = 10;

  async simulate(
    circuit: CircuitModel,
    shots: number = 1024,
    noiseSettings: NoiseSettings = NoiseModel.DEFAULT_SETTINGS
  ): Promise<SimulationResult> {
    // Return via Promise to keep async backend contract and avoid thread blocking
    return new Promise((resolve, reject) => {
      try {
        const result = QuantumCircuitSimulator.simulate(circuit, shots, noiseSettings);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }

  getMetadata() {
    return {
      version: '2.5.0-native',
      precision: 'Complex128 (Float64 Re, Float64 Im)',
      features: [
        'State-vector evolution',
        'Bloch sphere projection',
        'Stochastic NISQ noise channels',
        'Controlled multi-qubit gates',
        'Arbitrary measurement shot sampling',
        'Unitary matrix reconstruction',
      ],
      documentationUrl: 'https://en.wikipedia.org/wiki/Quantum_circuit',
    };
  }
}
