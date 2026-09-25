# AI Study Companion & Gemini Integration

## Context-Aware Architecture

Unlike generic chat assistants, the Qubify AI Tutor dynamically inspects the user's active canvas before generating responses.

### 1. Injected Context Parameters

1. **Active Circuit Geometry**: Total qubits, active gate sequence, controls, and targets.
2. **Current Simulation Results**: Exact computational basis state probabilities, non-zero amplitudes, and sampling count.
3. **Curriculum Target**: Lesson objective or exercise challenge target behavior.
4. **Student Telemetry**: Knowledge level (Beginner/Intermediate/Advanced) and historical mistake patterns.

### 2. Progressive Hint System

Hints are released incrementally to preserve learning rigor:
- **Hint 1**: Physical concept and Bloch sphere orientation intuition.
- **Hint 2**: Algorithmic strategy and gate sequence hint.
- **Hint 3**: Specific wire and moment placement suggestion.

### 3. Safety & Integrity Principles

- AI-generated Qiskit code is never executed automatically; users must explicitly review and click **Apply to Visual Circuit**.
- All empirical claims are grounded in the simulator output rather than hallucinatory approximations.
