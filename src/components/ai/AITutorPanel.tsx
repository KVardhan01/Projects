import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  Bug,
  Zap,
  Code2,
  Check,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { useQuantum } from '../../context/QuantumContext';
import { GeminiService } from '../../services/ai/geminiClient';
import { AIMessage, AIContext } from '../../types/ai';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { QuantumCircuitSimulator } from '../../quantum/QuantumCircuitSimulator';

interface AITutorPanelProps {
  lessonTitle?: string;
  moduleTitle?: string;
  exerciseGoal?: string;
}

export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  lessonTitle,
  moduleTitle,
  exerciseGoal,
}) => {
  const {
    circuit,
    simulation,
    qiskitCode,
    simulationError,
    updateFromQiskit,
    validationErrors,
  } = useQuantum();

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **AI Quantum Study Companion**.

I am monitoring your active circuit with **${circuit.numQubits} qubit(s)** and **${circuit.operations.length} gate(s)**.

Ask me anything about your circuit, quantum mechanics, or Qiskit code!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const quickQuestions = [
    { label: 'Explain this circuit', icon: Sparkles },
    { label: 'Why am I getting this result?', icon: Bug },
    { label: 'Fix my code', icon: Wrench },
    { label: 'What does this H gate do?', icon: Lightbulb },
    { label: 'Why is my Bell state incorrect?', icon: Zap },
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
    if (validationErrors.length > 0) activeErrors.push(...validationErrors);
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
    } catch {
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

  const handleApplyCode = (code: string) => {
    const result = updateFromQiskit(code);
    if (result.success) {
      setAppliedNotice('Successfully synchronized circuit with visual canvas!');
    } else {
      setAppliedNotice(`Could not apply: ${result.errors[0] || 'Invalid code'}`);
    }
    setTimeout(() => setAppliedNotice(null), 3500);
  };

  return (
    <div className="flex flex-col h-[780px] bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden font-sans">
      {/* AI Tutor Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider">
                AI TUTOR
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Ask anything about your circuit
            </div>
          </div>
        </div>

        {/* Circuit summary tag */}
        <div className="text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
          {circuit.numQubits}Q • {circuit.operations.length} Gates
        </div>
      </div>

      {/* Applied notification */}
      {appliedNotice && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs px-4 py-2 flex items-center gap-2 font-medium animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{appliedNotice}</span>
        </div>
      )}

      {/* Active simulation error banner if present */}
      {(simulationError || validationErrors.length > 0) && (
        <div className="bg-rose-950/80 border-b border-rose-800/80 p-3 text-xs text-rose-200 flex items-start justify-between gap-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-300">Simulation / Code Notice</div>
              <div className="text-[11px] text-rose-300/90 font-mono line-clamp-2">
                {simulationError || validationErrors[0]}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleSendMessage('Fix my code and explain this simulation error')}
            className="shrink-0 px-2 py-1 rounded bg-rose-500/30 hover:bg-rose-500/40 border border-rose-500/50 text-rose-200 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
          >
            <Wrench className="w-3 h-3" />
            <span>Fix Code</span>
          </button>
        </div>
      )}

      {/* Chat Messages History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            )}
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed shadow-md ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-tr-none'
                  : 'bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-none'
              }`}
            >
              {msg.role === 'assistant' ? (
                <MarkdownRenderer content={msg.content} onApplyCode={handleApplyCode} />
              ) : (
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
              )}

              {/* Pure Python Qiskit code snippet (only shown separately if not already embedded in markdown) */}
              {msg.codeSnippet && !msg.content.includes(msg.codeSnippet) && (
                <div className="mt-3 pt-2.5 border-t border-slate-800">
                  <div className="text-[10px] uppercase tracking-wider text-cyan-400 mb-1.5 font-mono font-bold flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Generated Qiskit circuit</span>
                    </div>
                    {msg.structuredData?.requiredQubits && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                        {msg.structuredData.requiredQubits} Qubit{msg.structuredData.requiredQubits > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <pre className="bg-slate-900 p-2.5 rounded-xl text-[11px] font-mono text-cyan-200 overflow-x-auto border border-slate-800 leading-relaxed">
                    {msg.codeSnippet}
                  </pre>
                  <button
                    onClick={() => handleApplyCode(msg.codeSnippet!)}
                    className="mt-2 w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/10"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to Visual Circuit</span>
                  </button>
                </div>
              )}

              <div
                className={`text-[9px] mt-1.5 text-right ${
                  msg.role === 'user' ? 'text-cyan-200' : 'text-slate-500 font-mono'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-cyan-600 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-2.5 items-center text-slate-400 text-xs italic py-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            </div>
            <span>Analyzing circuit and quantum physics context...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider mb-2 font-mono">
          Quick Questions
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.label)}
                className="text-[11px] bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Icon className="w-3 h-3 text-cyan-400" />
                <span>{q.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="p-3 border-t border-slate-800 bg-slate-950/90 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your circuit..."
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
