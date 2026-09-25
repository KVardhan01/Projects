import { QuantumGate } from '../QuantumGate';
import { QuantumState } from '../QuantumState';

export class SWAPGate {
  static apply(state: QuantumState, qubitA: number, qubitB: number): void {
    QuantumGate.applySwapGate(state, qubitA, qubitB);
  }
}
