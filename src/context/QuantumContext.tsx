import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CircuitModel,
  CircuitOperation,
  GateType,
  SimulationResult,
  NoiseSettings,
  QuantumBackendType,
} from '../types/quantum';
import { BrowserQuantumBackend } from '../quantum/backends/BrowserBackend';
import { NoiseModel } from '../quantum/NoiseModel';
import { QiskitGenerator } from '../quantum/parser/QiskitGenerator';
import { QiskitParser } from '../quantum/parser/QiskitParser';
import { LocalDatabase } from '../services/storage/localDatabase';

const defaultCircuit: CircuitModel = {
  id: 'circuit-bell-interactive',
  name: 'Bell State |Φ+⟩',
  numQubits: 2,
  numMoments: 5,
  qubits: [
    { index: 0, name: 'q0', initialValue: 0 },
    { index: 1, name: 'q1', initialValue: 0 },
  ],
  operations: [
    { id: 'op-0', gate: 'H', targets: [0], controls: [], moment: 0 },
    { id: 'op-1', gate: 'CX', targets: [1], controls: [0], moment: 1 },
  ],
};

interface QuantumContextType {
  circuit: CircuitModel;
  simulation: SimulationResult | null;
  isSimulating: boolean;
  shots: number;
  noiseSettings: NoiseSettings;
  activeBackend: QuantumBackendType;
  qiskitCode: string;
  selectedGate: GateType | null;
  canUndo: boolean;
  canRedo: boolean;
  validationErrors: string[];
  qiskitWarnings: string[];
  simulationError: string | null;
  syncSource: 'visual' | 'code';
  addGate: (gate: GateType, target: number, moment: number, control?: number) => void;
  removeGate: (opId: string) => void;
  moveGate: (opId: string, newTarget: number, newMoment: number) => void;
  addQubit: () => void;
  removeQubit: (index: number) => void;
  toggleInitialValue: (index: number) => void;
  clearCircuit: () => void;
  resetToModel: (model: CircuitModel) => void;
  setShots: (shots: number) => void;
  setNoiseSettings: (settings: Partial<NoiseSettings>) => void;
  setActiveBackend: (backend: QuantumBackendType) => void;
  setSelectedGate: (gate: GateType | null) => void;
  runSimulation: () => Promise<SimulationResult | null>;
  updateFromQiskit: (code: string) => { success: boolean; errors: string[] };
  undo: () => void;
  redo: () => void;
  saveCircuit: () => void;
  loadCircuit: (id: string) => void;
  clearErrors: () => void;
}

const QuantumContext = createContext<QuantumContextType | undefined>(undefined);

export const QuantumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [circuit, setCircuit] = useState<CircuitModel>(defaultCircuit);
  const [history, setHistory] = useState<CircuitModel[]>([defaultCircuit]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [shots, setShots] = useState<number>(1024);
  const [noiseSettings, setNoiseSettingsState] = useState<NoiseSettings>(NoiseModel.DEFAULT_SETTINGS);
  const [activeBackend, setActiveBackend] = useState<QuantumBackendType>('browser-simulator');
  const [selectedGate, setSelectedGate] = useState<GateType | null>('H');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [qiskitWarnings, setQiskitWarnings] = useState<string[]>([]);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [syncSource, setSyncSource] = useState<'visual' | 'code'>('visual');

  const [backendInstance] = useState(() => new BrowserQuantumBackend());

  const pushHistory = (newCircuit: CircuitModel, source: 'visual' | 'code' = 'visual') => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newCircuit);
    if (nextHistory.length > 30) nextHistory.shift();
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setSyncSource(source);
    setCircuit(newCircuit);
  };

  const runSimulation = useCallback(async (): Promise<SimulationResult | null> => {
    setIsSimulating(true);
    setSimulationError(null);
    try {
      // 1. Validate circuit integrity
      if (circuit.numQubits < 1) {
        throw new Error('Circuit must contain at least 1 qubit wire.');
      }
      for (const op of circuit.operations) {
        for (const t of op.targets) {
          if (t >= circuit.numQubits) {
            throw new Error(`Target qubit q${t} is out of bounds for ${circuit.numQubits}-qubit circuit.`);
          }
        }
        for (const c of op.controls) {
          if (c >= circuit.numQubits) {
            throw new Error(`Control qubit q${c} is out of bounds for ${circuit.numQubits}-qubit circuit.`);
          }
        }
      }

      // 2. Execute via internal TypeScript simulator
      const result = await backendInstance.simulate(circuit, shots, noiseSettings);
      setSimulation(result);
      setValidationErrors([]);
      setSimulationError(null);
      return result;
    } catch (err: any) {
      const errorMsg =
        err.message ||
        'Simulation Error: The circuit contains an unsupported operation. Please check the Python/Qiskit code or circuit.';
      setSimulationError(
        `Simulation Error\n${errorMsg}\nPlease check the Python/Qiskit code or circuit.`
      );
      setValidationErrors([errorMsg]);
      return null;
    } finally {
      setIsSimulating(false);
    }
  }, [circuit, shots, noiseSettings, backendInstance]);

  // Reactive simulation
  useEffect(() => {
    runSimulation();
  }, [circuit, shots, noiseSettings]);

  const addGate = (gate: GateType, target: number, moment: number, control?: number) => {
    // Remove conflicting gate at target and moment
    const filtered = circuit.operations.filter(
      (op) => !(op.moment === moment && op.targets.includes(target))
    );

    const controls = control !== undefined ? [control] : [];
    const newOp: CircuitOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      gate,
      targets: [target],
      controls,
      moment,
    };

    const maxMoment = Math.max(circuit.numMoments, moment + 2);
    const updated: CircuitModel = {
      ...circuit,
      numMoments: maxMoment,
      operations: [...filtered, newOp],
    };
    pushHistory(updated, 'visual');
  };

  const removeGate = (opId: string) => {
    const updated: CircuitModel = {
      ...circuit,
      operations: circuit.operations.filter((op) => op.id !== opId),
    };
    pushHistory(updated, 'visual');
  };

  const moveGate = (opId: string, newTarget: number, newMoment: number) => {
    const op = circuit.operations.find((o) => o.id === opId);
    if (!op) return;

    const filtered = circuit.operations.filter(
      (o) => o.id !== opId && !(o.moment === newMoment && o.targets.includes(newTarget))
    );

    const movedOp: CircuitOperation = {
      ...op,
      targets: [newTarget],
      moment: newMoment,
    };

    const updated: CircuitModel = {
      ...circuit,
      numMoments: Math.max(circuit.numMoments, newMoment + 2),
      operations: [...filtered, movedOp],
    };
    pushHistory(updated, 'visual');
  };

  const addQubit = () => {
    if (circuit.numQubits >= 8) return;
    const newIdx = circuit.numQubits;
    const updated: CircuitModel = {
      ...circuit,
      numQubits: newIdx + 1,
      qubits: [...circuit.qubits, { index: newIdx, name: `q${newIdx}`, initialValue: 0 }],
    };
    pushHistory(updated, 'visual');
  };

  const removeQubit = (index: number) => {
    if (circuit.numQubits <= 1) return;
    const newOps = circuit.operations
      .filter((op) => !op.targets.includes(index) && !op.controls.includes(index))
      .map((op) => ({
        ...op,
        targets: op.targets.map((t) => (t > index ? t - 1 : t)),
        controls: op.controls.map((c) => (c > index ? c - 1 : c)),
      }));

    const newQubits = circuit.qubits
      .filter((q) => q.index !== index)
      .map((q, i) => ({ ...q, index: i, name: `q${i}` }));

    const updated: CircuitModel = {
      ...circuit,
      numQubits: newQubits.length,
      qubits: newQubits,
      operations: newOps,
    };
    pushHistory(updated, 'visual');
  };

  const toggleInitialValue = (index: number) => {
    const updated: CircuitModel = {
      ...circuit,
      qubits: circuit.qubits.map((q) =>
        q.index === index ? { ...q, initialValue: (q.initialValue === 0 ? 1 : 0) as 0 | 1 } : q
      ),
    };
    pushHistory(updated, 'visual');
  };

  const clearCircuit = () => {
    const updated: CircuitModel = {
      ...circuit,
      operations: [],
    };
    pushHistory(updated, 'visual');
  };

  const resetToModel = (model: CircuitModel) => {
    pushHistory(model, 'visual');
  };

  const setNoiseSettings = (settings: Partial<NoiseSettings>) => {
    setNoiseSettingsState((prev) => ({ ...prev, ...settings }));
  };

  /**
   * Bidirectional sync: Python/Qiskit Code -> Qiskit Parser -> Internal Circuit Model -> Visual Circuit
   */
  const updateFromQiskit = (code: string): { success: boolean; errors: string[] } => {
    const parsed = QiskitParser.parse(code, circuit);
    setQiskitWarnings(parsed.warnings);

    if (parsed.errors.length > 0) {
      setValidationErrors(parsed.errors);
      setSimulationError(
        `Simulation Error\n${parsed.errors.join('\n')}\nPlease check the Python/Qiskit code or circuit.`
      );
      // Keep last valid visual circuit
      return { success: false, errors: parsed.errors };
    }

    setValidationErrors([]);
    setSimulationError(null);
    pushHistory(parsed.circuit, 'code');
    return { success: true, errors: [] };
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSyncSource('visual');
      setCircuit(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSyncSource('visual');
      setCircuit(history[historyIndex + 1]);
    }
  };

  const saveCircuit = () => {
    LocalDatabase.saveCircuit(circuit);
  };

  const loadCircuit = (id: string) => {
    const all = LocalDatabase.getCircuits();
    const found = all.find((c) => c.id === id);
    if (found) {
      pushHistory(found, 'visual');
    }
  };

  const clearErrors = () => {
    setValidationErrors([]);
    setSimulationError(null);
  };

  // Pure Python Qiskit code generated from the canonical internal circuit model
  const qiskitCode = QiskitGenerator.generate(circuit);

  return (
    <QuantumContext.Provider
      value={{
        circuit,
        simulation,
        isSimulating,
        shots,
        noiseSettings,
        activeBackend,
        qiskitCode,
        selectedGate,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        validationErrors,
        qiskitWarnings,
        simulationError,
        syncSource,
        addGate,
        removeGate,
        moveGate,
        addQubit,
        removeQubit,
        toggleInitialValue,
        clearCircuit,
        resetToModel,
        setShots,
        setNoiseSettings,
        setActiveBackend,
        setSelectedGate,
        runSimulation,
        updateFromQiskit,
        undo,
        redo,
        saveCircuit,
        loadCircuit,
        clearErrors,
      }}
    >
      {children}
    </QuantumContext.Provider>
  );
};

export const useQuantum = () => {
  const context = useContext(QuantumContext);
  if (!context) {
    throw new Error('useQuantum must be used within a QuantumProvider');
  }
  return context;
};
