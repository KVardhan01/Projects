import { QuantumGate } from '../QuantumGate';
import { QuantumState } from '../QuantumState';

export class XGate {
  static readonly matrix = QuantumGate.X.matrix;

  static apply(state: QuantumState, target: number): void {
    QuantumGate.applySingleQubitGate(state, target, this.matrix);
  }
}
