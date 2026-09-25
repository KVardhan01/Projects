import { GateType, CircuitModel, CircuitOperation, QubitDefinition } from '../../types/quantum';

export interface ASTNode {
  type: 'QuantumCircuit' | 'GateCall' | 'Measurement' | 'UnsupportedStatement' | 'Comment';
  line?: number;
}

export interface ASTGateCallNode extends ASTNode {
  type: 'GateCall';
  gate: GateType;
  targets: number[];
  controls: number[];
  parameters?: number[];
  moment: number;
}

export interface ASTMeasurementNode extends ASTNode {
  type: 'Measurement';
  targets: number[];
  classicalBits?: number[];
  isMeasureAll: boolean;
  moment: number;
}

export interface ASTUnsupportedNode extends ASTNode {
  type: 'UnsupportedStatement';
  rawText: string;
  reason: string;
}

export interface ASTCommentNode extends ASTNode {
  type: 'Comment';
  comment: string;
}

export interface CircuitAST {
  name: string;
  numQubits: number;
  numClassicalBits: number;
  qubitDeclarations: QubitDefinition[];
  nodes: (ASTGateCallNode | ASTMeasurementNode | ASTUnsupportedNode | ASTCommentNode)[];
  unsupportedWarnings: string[];
}

export class CircuitASTConverter {
  /**
   * Converts CircuitModel into CircuitAST
   */
  static fromModel(circuit: CircuitModel): CircuitAST {
    const nodes: (ASTGateCallNode | ASTMeasurementNode)[] = [];

    // Sort operations by moment
    const sortedOps = [...circuit.operations].sort((a, b) => a.moment - b.moment);

    for (const op of sortedOps) {
      if (op.gate === 'M') {
        nodes.push({
          type: 'Measurement',
          targets: [...op.targets],
          isMeasureAll: false,
          moment: op.moment,
        });
      } else {
        nodes.push({
          type: 'GateCall',
          gate: op.gate,
          targets: [...op.targets],
          controls: [...op.controls],
          moment: op.moment,
        });
      }
    }

    return {
      name: circuit.name,
      numQubits: circuit.numQubits,
      numClassicalBits: circuit.numQubits,
      qubitDeclarations: circuit.qubits.map((q) => ({ ...q })),
      nodes,
      unsupportedWarnings: [],
    };
  }

  /**
   * Converts CircuitAST into CircuitModel
   */
  static toModel(ast: CircuitAST): CircuitModel {
    const operations: CircuitOperation[] = [];

    let opCounter = 0;
    for (const node of ast.nodes) {
      if (node.type === 'GateCall') {
        operations.push({
          id: `op-${opCounter++}`,
          gate: node.gate,
          targets: [...node.targets],
          controls: [...node.controls],
          moment: node.moment,
        });
      } else if (node.type === 'Measurement') {
        for (const tgt of node.targets) {
          operations.push({
            id: `op-${opCounter++}`,
            gate: 'M',
            targets: [tgt],
            controls: [],
            moment: node.moment,
          });
        }
      }
    }

    const numMoments = operations.reduce((max, op) => Math.max(max, op.moment + 1), 6);

    const qubits: QubitDefinition[] =
      ast.qubitDeclarations.length > 0
        ? ast.qubitDeclarations
        : Array.from({ length: ast.numQubits }, (_, i) => ({
            index: i,
            name: `q${i}`,
            initialValue: 0,
          }));

    return {
      id: `circuit-${Date.now()}`,
      name: ast.name || 'Quantum Circuit',
      numQubits: Math.max(1, ast.numQubits),
      numMoments: Math.max(4, numMoments),
      qubits,
      operations,
    };
  }
}
