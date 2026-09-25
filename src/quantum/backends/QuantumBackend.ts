import { CircuitModel, SimulationResult, NoiseSettings, QuantumBackendType } from '../../types/quantum';

export interface QuantumBackend {
  readonly id: QuantumBackendType;
  readonly name: string;
  readonly description: string;
  readonly isAvailable: boolean;
  readonly maxQubits: number;

  simulate(
    circuit: CircuitModel,
    shots?: number,
    noiseSettings?: NoiseSettings
  ): Promise<SimulationResult>;

  getMetadata(): {
    version: string;
    precision: string;
    features: string[];
    documentationUrl?: string;
  };
}
