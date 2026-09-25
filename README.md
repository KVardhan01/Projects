# Qubify
### AI-Powered Quantum Algorithm Learning Platform

A comprehensive, fully functional educational web application built with React, TypeScript, and Tailwind CSS. The platform combines interactive quantum circuit design, a native in-browser state-vector quantum simulator, automated assessment engines, formal unitary equivalence checking, bidirectional Qiskit Python synchronization, and an AI Study Companion powered by Gemini.

---

## Key System Features

1. **In-Browser Quantum State Vector Simulator**
   - High-precision native TypeScript complex number arithmetic (`Complex.ts`)
   - Complete state-vector evolution up to 10 qubits without server dependencies
   - Stochastic NISQ noise modeling (Bit-Flip, Phase-Flip, Depolarizing, and Readout errors)
   - Real-time 3D Bloch sphere projections with polar and Cartesian coordinate readouts
   - Probabilistic measurement sampling (10, 100, 512, 1024, or custom shots)

2. **Reversible Quantum Gate Set**
   - **Single-Qubit**: Hadamard ($H$), Pauli-$X$ (NOT), Pauli-$Y$, Pauli-$Z$, Phase ($S$), $\pi/8$ ($T$)
   - **Multi-Qubit & Entangling**: Controlled-NOT ($CX$ / CNOT), $SWAP$
   - **Measurement**: Projective measurement ($M$) onto the computational basis
   - **Custom / Black-Box**: Unitary gate $U$ for quantum process tomography exercises

3. **Curriculum & Progressive Learning Path**
   - **Module 1**: Foundations of Quantum Information (Qubits, State Vectors, Superposition, Probability Amplitudes, Measurement)
   - **Module 2**: Quantum Gates & Rotations ($X, Y, Z, H, S, T$)
   - **Module 3**: Multi-Qubit Circuits & Controlled Operations (CNOT, SWAP)
   - **Module 4**: Quantum Entanglement & Bell States ($|\Phi^+\rangle$)
   - **Module 5**: Quantum Algorithms (Grover's Search Algorithm & 2-Qubit Quantum Fourier Transform)
   - **Module 6**: Advanced Topics (Formal Unitary Equivalence, Circuit Optimization, and NISQ Decoherence)

4. **12 Educational Challenge Types with Automated Assessment**
   - Probabilistic Gate Exercise
   - Circuit Construction Challenge
   - Equivalent Circuit Synthesis
   - Circuit Gate Optimization
   - Unknown Black-Box Gate Identification
   - Qiskit Code-to-Circuit Challenge
   - Bell State Entanglement Challenge
   - Grover Amplitude Amplification
   - Quantum Fourier Transform (QFT)
   - Measurement Statistical Convergence
   - State Vector Phase Targeting
   - Gate Discrimination (Pauli-Y vs Pauli-Z)

5. **Formal Equivalence & Assessment Engine**
   - **Probability Behavioral Equivalence**: Evaluates output computational distributions within tolerance $\epsilon$
   - **Formal Unitary Matrix Equivalence**: Reconstructs the complete $2^n \times 2^n$ unitary matrix and evaluates fidelity:
     $$\frac{|\text{Tr}(U_{\text{student}}^\dagger U_{\text{reference}})|}{2^n} = 1.0$$
   - Accepts multiple distinct, mathematically valid solutions

6. **Bidirectional Qiskit Python Synchronization**
   - Internal Circuit AST (Abstract Syntax Tree) representation
   - Deterministic Qiskit Python code generation
   - Safe Python parser translating standard Qiskit instructions into the visual canvas

7. **Gemini AI Study Companion & Tutor**
   - Real context injection (active circuit, gates, moments, state vector probabilities, student level, recent mistakes)
   - Progressive hints (Concept -> Strategy -> Concrete step)
   - AI Circuit Debugging ("Why did my circuit produce this result?")
   - AI Optimization suggestions ("Can this circuit be simplified?")
   - AI Code Generation with "Apply to Visual Circuit" confirmation

8. **Role-Based Access Control (RBAC)**
   - **Student**: Learning path, circuit lab, automated exercises, quizzes, progress, achievements
   - **Instructor**: Cohort analytics, student submission inspector, custom exercise builder, feedback dispatch
   - **Administrator**: User governance, role assignment, Google Sheets v4 configuration, system diagnostics

9. **Persistence & Authentication**
   - Google Identity Services authentication
   - Persistent relational data store backed by Google Sheets API v4 (19 tabs)
   - High-fidelity LocalStorage Demo Mode for offline evaluation

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (optional for Demo Mode)
cp .env.example .env

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` to launch the platform.
