import { QuantumGate } from '../QuantumGate';
import { QuantumState } from '../QuantumState';

export class ZGate {
  static readonly matrix = QuantumGate.Z.matrix;

  static apply(state: QuantumState, target: number): void {
    QuantumGate.applySingleQubitGate(state, target, this.matrix);
  }
}
