import { QuantumGate } from '../QuantumGate';
import { QuantumState } from '../QuantumState';

export class HGate {
  static readonly matrix = QuantumGate.H.matrix;

  static apply(state: QuantumState, target: number): void {
    QuantumGate.applySingleQubitGate(state, target, this.matrix);
  }
}
