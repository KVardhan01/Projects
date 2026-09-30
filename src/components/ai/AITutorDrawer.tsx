import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Lightbulb,
  Bug,
  Zap,
  Code2,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useQuantum } from '../../context/QuantumContext';
import { GeminiService } from '../../services/ai/geminiClient';
import { AIMessage, AIContext } from '../../types/ai';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { QuantumCircuitSimulator } from '../../quantum/QuantumCircuitSimulator';

interface AITutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle?: string;
  moduleTitle?: string;
  exerciseGoal?: string;
}

export const AITutorDrawer: React.FC<AITutorDrawerProps> = ({
  isOpen,
  onClose,
  lessonTitle,
  moduleTitle,
  exerciseGoal,
}) => {
  const {
    circuit,
    simulation,
    qiskitCode,
    updateFromQiskit,
    applyGeneratedCircuit,
    simulationError,
    validationErrors,
  } = useQuantum();

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **AI Quantum Study Companion**.

I am monitoring your active circuit with **${circuit.numQubits} qubit(s)** and **${circuit.operations.length} gate(s)**.

How can I help you today? You can choose a quick topic below or type any question!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [appliedCodeNotice, setAppliedCodeNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickQuestions = [
    { label: 'What is superposition?', icon: Lightbulb },
    { label: 'Explain the X gate.', icon: Zap },
    { label: 'Why did my circuit produce this result?', icon: Bug },
    { label: 'Give me a hint.', icon: Lightbulb },
    { label: 'Explain this Qiskit code.', icon: Code2 },
    { label: 'Can this circuit be simplified?', icon: RefreshCw },
  ];

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isThinking) return;

    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    const measurementOps = circuit.operations.filter((op) => op.gate === 'M');
    const numClassicalBits = measurementOps.length > 0 ? measurementOps.length : 0;

    // Check circuit validation directly to capture any instantaneous layout conflicts (e.g. moment collisions)
    const circuitValidation = QuantumCircuitSimulator.validateCircuit(circuit);
    const activeErrors: string[] = [];
    if (simulationError) activeErrors.push(simulationError);
    if (validationErrors && validationErrors.length > 0) activeErrors.push(...validationErrors);
    if (!circuitValidation.isValid) activeErrors.push(...circuitValidation.errors);
    const uniqueErrors = Array.from(new Set(activeErrors));
    const activeSimulationError = uniqueErrors.length > 0 ? uniqueErrors.join('; ') : undefined;

    const context: AIContext = {
      lessonTitle: lessonTitle || circuit.name,
      moduleTitle,
      circuit,
      code: qiskitCode,
      simulation: simulation || undefined,
      simulationError: activeSimulationError,
      validationErrors: uniqueErrors,
      exerciseGoal,
      studentLevel: 'beginner',
      numClassicalBits,
    };

    try {
      const chatRes = await GeminiService.chat(userText, context, messages);
      const replyContent = chatRes.content;
      const codeSnippet =
        chatRes.codeSnippet || chatRes.content.match(/```python([\s\S]*?)```/)?.[1]?.trim();

      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        codeSnippet,
        intent: chatRes.intent,
        structuredData: chatRes.structuredData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an issue analyzing your circuit. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleApplyCircuit = (msg: AIMessage) => {
    let result: { success: boolean; errors: string[] };

    if (msg.structuredData && msg.structuredData.action === 'apply_to_visual_circuit') {
      result = applyGeneratedCircuit(msg.structuredData);
    } else if (msg.codeSnippet) {
      result = updateFromQiskit(msg.codeSnippet);
    } else {
      result = { success: false, errors: ['No circuit data found'] };
    }

    if (result.success) {
      const hasNoise = Boolean(msg.structuredData?.noiseSettings?.enabled);
      setAppliedCodeNotice(
        hasNoise
          ? 'Applied circuit & depolarizing noise model to visual canvas!'
          : 'Applied circuit from Qiskit code!'
      );
    } else {
      setAppliedCodeNotice(`Could not apply: ${result.errors[0] || 'Invalid code'}`);
    }
    setTimeout(() => setAppliedCodeNotice(null), 3000);
  };

  const handleApplyCode = (code: string) => {
    updateFromQiskit(code);
    setAppliedCodeNotice('Applied circuit from Qiskit code!');
    setTimeout(() => setAppliedCodeNotice(null), 3000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 max-w-full bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-slate-400">
              Study Companion
            </div>
            <div className="font-semibold text-sm text-slate-100 flex items-center gap-2">
              <span>Ask the Tutor</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {appliedCodeNotice && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-300 text-xs px-4 py-2 flex items-center gap-1.5 font-medium">
          <Check className="w-3.5 h-3.5" />
          <span>{appliedCodeNotice}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl p-3 leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
              }`}
            >
              {msg.role === 'assistant' ? (
                <MarkdownRenderer content={msg.content} />
              ) : (
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
              )}

              {/* Actionable Circuit Generation / Debugging Panel */}
              {(msg.structuredData?.action === 'apply_to_visual_circuit' ||
                (msg.codeSnippet &&
                  msg.structuredData?.isSupportedBySimulator !== false &&
                  msg.structuredData?.action !== 'explain_limitation' &&
                  (msg.intent === 'generate_circuit' ||
                    msg.intent === 'debug_circuit' ||
                    msg.intent === 'modify_circuit'))) && (
                <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                  <div className="text-[10px] uppercase tracking-wider text-cyan-400 mb-1 font-mono flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Generated Qiskit circuit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {msg.structuredData?.noiseSettings?.enabled && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-mono">
                          Depolarizing Noise ({msg.structuredData.noiseSettings.depolarizingRate || 0.25})
                        </span>
                      )}
                      {(msg.structuredData?.qubits || msg.structuredData?.requiredQubits) && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono">
                          {msg.structuredData?.qubits || msg.structuredData?.requiredQubits} Qubit
                          {(msg.structuredData?.qubits || msg.structuredData?.requiredQubits || 0) > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {(msg.codeSnippet || msg.structuredData?.qiskitCode) && (
                    <pre className="bg-slate-950 p-2 rounded text-[11px] font-mono text-cyan-300 overflow-x-auto border border-slate-800 max-h-48 leading-relaxed">
                      {msg.codeSnippet || msg.structuredData?.qiskitCode}
                    </pre>
                  )}
                  <button
                    onClick={() => handleApplyCircuit(msg)}
                    className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/10 active:scale-[0.99]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to Visual Circuit</span>
                  </button>
                </div>
              )}

              {/* Informative notice if circuit cannot be represented in current simulator (e.g. Werner mixed state) */}
              {msg.structuredData?.isSupportedBySimulator === false && (
                <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-semibold text-amber-300 text-xs">
                        Simulator Limitation Notice
                      </div>
                      <div className="text-[11px] text-amber-200/90 leading-relaxed">
                        {msg.structuredData.unsupportedReason ||
                          'This quantum state is a statistical mixed state requiring density-matrix simulation. Qubify operates on pure state-vectors, so it cannot be directly applied as a static visual circuit.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`text-[9px] mt-1 text-right ${
                  msg.role === 'user' ? 'text-cyan-200' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-md bg-cyan-600 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-2.5 items-center text-slate-400 text-xs italic py-2">
            <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            </div>
            <span>Analyzing circuit and formulating response...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Questions */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40">
        <div className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider mb-2">
          Suggested Topics
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.label)}
                className="text-[11px] bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Icon className="w-3 h-3 text-cyan-400" />
                <span>{q.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this lesson or circuit..."
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="p-2 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
