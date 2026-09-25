import { QuantumGate } from '../QuantumGate';
import { QuantumState } from '../QuantumState';

export class CXGate {
  static readonly matrix = QuantumGate.X.matrix;

  static apply(state: QuantumState, control: number, target: number): void {
    QuantumGate.applyControlledGate(state, control, target, this.matrix);
  }
}
