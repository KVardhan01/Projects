import { QuantumState } from './QuantumState';
import { XGate } from './gates/X';
import { ZGate } from './gates/Z';
import { YGate } from './gates/Y';
import { NoiseSettings } from '../types/quantum';

export class NoiseModel {
  static readonly DEFAULT_SETTINGS: NoiseSettings = {
    enabled: false,
    bitFlipRate: 0.05,
    phaseFlipRate: 0.05,
    depolarizingRate: 0.05,
    readoutErrorRate: 0.05,
  };

  /**
   * Applies single-qubit quantum channel noise stochastically to state.
   * In a state-vector simulator, stochastic quantum trajectory sampling mimics the open system master equation.
   */
  static applyNoise(state: QuantumState, qubit: number, settings: NoiseSettings): void {
    if (!settings.enabled) return;

    // Bit-flip noise channel: rho -> (1-p)rho + p X rho X
    if (settings.bitFlipRate > 0 && Math.random() < settings.bitFlipRate) {
      XGate.apply(state, qubit);
    }

    // Phase-flip noise channel: rho -> (1-p)rho + p Z rho Z
    if (settings.phaseFlipRate > 0 && Math.random() < settings.phaseFlipRate) {
      ZGate.apply(state, qubit);
    }

    // Depolarizing noise channel: with prob p, apply X, Y, or Z uniformly with prob p/3
    if (settings.depolarizingRate > 0 && Math.random() < settings.depolarizingRate) {
      const rand = Math.random();
      if (rand < 1 / 3) {
        XGate.apply(state, qubit);
      } else if (rand < 2 / 3) {
        YGate.apply(state, qubit);
      } else {
        ZGate.apply(state, qubit);
      }
    }
  }
}
