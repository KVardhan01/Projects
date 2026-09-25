# Quantum Simulator Technical Documentation

## Mathematical Foundations

The Qubify state-vector engine implements pure state evolution in the $2^n$-dimensional Hilbert space $\mathcal{H}^{\otimes n}$.

### 1. Complex Number Representation
Complex numbers $z = a + bi$ are represented by `Complex.ts` with double-precision floating-point arithmetic (IEEE 754 float64 for real and imaginary components). Polar conversion, conjugation, addition, subtraction, multiplication, division, and complex exponentiation are implemented natively.

### 2. State Vector Evolution
For an $n$-qubit circuit, the state vector is initialized to $|\psi_0\rangle = |0\rangle^{\otimes n} = (1, 0, \dots, 0)^T$ (or custom initial states).

Single-qubit operations $U \in U(2)$ are applied in $O(2^n)$ time without allocating full $2^n \times 2^n$ matrices:
For target qubit $k$ (with mask $2^{n-1-k}$), pairs of basis states $(|i_0\rangle, |i_1\rangle)$ differing only at bit $k$ are updated via:
$$\begin{pmatrix} \alpha'_{i_0} \\ \alpha'_{i_1} \end{pmatrix} = \begin{pmatrix} U_{00} & U_{01} \\ U_{10} & U_{11} \end{pmatrix} \begin{pmatrix} \alpha_{i_0} \\ \alpha_{i_1} \end{pmatrix}$$

### 3. Entangling & Controlled Gates
For controlled operations (e.g. CNOT), the target transformation is conditionally applied only to basis indices where the control bit is 1.

### 4. Reduced Density Matrix & Bloch Sphere Projection
For single-qubit Bloch sphere visualization, the partial trace over all other qubits is computed to extract the single-qubit density matrix:
$$\rho = \begin{pmatrix} \rho_{00} & \rho_{01} \\ \rho_{10} & \rho_{11} \end{pmatrix}$$
The Bloch vector coordinates are derived from Pauli expectation values:
$$x = 2 \text{Re}(\rho_{01}), \quad y = 2 \text{Im}(\rho_{01}), \quad z = \rho_{00} - \rho_{11}$$

### 5. Unitary Equivalence Engine
For circuits without measurement, the full unitary transformation $U$ is reconstructed by evolving each computational basis state $|k\rangle$. Formal equivalence up to global phase $\phi$ is checked via Hilbert-Schmidt inner product:
$$\text{Fidelity} = \frac{|\text{Tr}(U_{\text{student}}^\dagger U_{\text{ref}})|}{2^n} \ge 1 - \epsilon$$
