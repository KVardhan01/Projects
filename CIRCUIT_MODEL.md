# Normalized Circuit Model & AST Representation

## 1. Normalized Internal Circuit Model

All platform tools (Visual Canvas, Quantum Simulator, Qiskit Generator, Qiskit Parser, Assessment Engine, and Gemini Context) consume a normalized JSON circuit structure:

```json
{
  "id": "bell-state",
  "name": "Bell State |Φ+⟩",
  "numQubits": 2,
  "numMoments": 2,
  "qubits": [
    { "index": 0, "name": "q0", "initialValue": 0 },
    { "index": 1, "name": "q1", "initialValue": 0 }
  ],
  "operations": [
    {
      "id": "op-0",
      "gate": "H",
      "targets": [0],
      "controls": [],
      "moment": 0
    },
    {
      "id": "op-1",
      "gate": "CX",
      "targets": [1],
      "controls": [0],
      "moment": 1
    }
  ]
}
```

## 2. Circuit AST (Abstract Syntax Tree)

The `CircuitAST` preserves semantic information across language boundaries:
- `GateCallNode`: Single and multi-qubit unitary operations with target and control lists
- `MeasurementNode`: Classical register mappings and measure-all directives
- `UnsupportedStatementNode`: Preserves non-visual Qiskit statements without breaking synchronization
- `CommentNode`: Comments and metadata
