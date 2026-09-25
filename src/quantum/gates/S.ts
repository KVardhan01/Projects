import { QuantumGate } from '../QuantumGate';
import { QuantumState } from '../QuantumState';

export class SGate {
  static readonly matrix = QuantumGate.S.matrix;

  static apply(state: QuantumState, target: number): void {
    QuantumGate.applySingleQubitGate(state, target, this.matrix);
  }
}
