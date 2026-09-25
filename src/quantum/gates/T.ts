import { QuantumGate } from '../QuantumGate';
import { QuantumState } from '../QuantumState';

export class TGate {
  static readonly matrix = QuantumGate.T.matrix;

  static apply(state: QuantumState, target: number): void {
    QuantumGate.applySingleQubitGate(state, target, this.matrix);
  }
}
