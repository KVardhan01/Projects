import { QuantumGate } from '../QuantumGate';
import { QuantumState } from '../QuantumState';

export class YGate {
  static readonly matrix = QuantumGate.Y.matrix;

  static apply(state: QuantumState, target: number): void {
    QuantumGate.applySingleQubitGate(state, target, this.matrix);
  }
}
