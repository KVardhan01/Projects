# Developer Guide

## Prerequisites
- Node.js 20+
- npm 10+

## Scripts

```bash
# Start local development server with hot reload
npm run dev

# Run TypeScript linting and type checks
npm run lint

# Compile production bundle
npm run build

# Preview production build locally
npm run preview
```

## Adding New Quantum Gates
1. Define the unitary matrix in `src/quantum/QuantumGate.ts`
2. Register the gate in `GATE_REGISTRY`
3. Create wrapper in `src/quantum/gates/<Name>.ts`
4. Update `QuantumCircuitSimulator.applyOperation` and `QiskitGenerator`
