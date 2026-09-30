import { AIContext, AIMessage, AIUserIntent, StructuredCircuitData } from '../../types/ai';
import { logger } from '../logger';
import {
  synthesizeQuantumExpertResponse,
  formatQuantumContext,
  detectUserIntent,
} from './quantumExpertEngine';

export interface AITutorChatResult {
  content: string;
  codeSnippet?: string;
  intent: AIUserIntent;
  requiredQubits?: number;
  gates?: string[];
  structuredData?: StructuredCircuitData;
}

export class GeminiService {
  private static apiKey: string = '';

  /**
   * AI Tutor is available via the backend /api/ai/chat proxy with fallback to local quantum expert synthesis.
   */
  static isAvailable(): boolean {
    return true;
  }

  static setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Prompts the AI Quantum Tutor with structured, context-aware workbench data and distinct request intent.
   */
  static async chat(
    userPrompt: string,
    context: AIContext,
    history: AIMessage[] = []
  ): Promise<AITutorChatResult> {
    const formattedCtx = formatQuantumContext(context);
    const enrichedContext: AIContext = {
      ...context,
      numClassicalBits: formattedCtx.numClassicalBits,
      gateDetails: formattedCtx.gateDetails,
    };

    const intent = detectUserIntent(userPrompt);
    logger.info('AITutor', `AI Tutor received prompt: "${userPrompt.slice(0, 60)}" [Intent: ${intent}]`);

    // 1. Primary: Server-side Gemini API Proxy
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userPrompt,
          context: enrichedContext,
          history: history.slice(-6),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.reply && typeof data.reply === 'string') {
          logger.success(
            'AITutor',
            `AI Tutor successfully generated response for: "${userPrompt.slice(0, 40)}"`
          );

          const codeMatch = data.reply.match(/```python([\s\S]*?)```/);
          const extractedCode = data.qiskitCode || (codeMatch ? codeMatch[1].trim() : undefined);

          return {
            content: data.reply,
            codeSnippet: extractedCode,
            intent: data.intent || intent,
            requiredQubits: data.requiredQubits,
            gates: data.gates,
            structuredData: data.structuredData || {
              intent: data.intent || intent,
              request: userPrompt,
              explanation: data.reply,
              qiskitCode: extractedCode,
              requiredQubits: data.requiredQubits,
              gates: data.gates,
            },
          };
        }
      } else {
        logger.warning(
          'AITutor',
          `Server AI endpoint returned HTTP ${response.status}, falling back to quantum reasoning engine.`
        );
      }
    } catch (fetchErr: any) {
      logger.warning(
        'AITutor',
        `Direct server AI fetch failed: ${fetchErr?.message || fetchErr}. Using quantum reasoning fallback.`
      );
    }

    // 2. High-fidelity Built-In Quantum Expert Engine
    const fallbackRes = synthesizeQuantumExpertResponse(userPrompt, enrichedContext);
    logger.info('AITutor', 'Served response via built-in quantum reasoning engine.');

    return {
      content: fallbackRes.reply,
      codeSnippet: fallbackRes.qiskitCode,
      intent: fallbackRes.intent,
      requiredQubits: fallbackRes.requiredQubits,
      gates: fallbackRes.gates,
      structuredData: fallbackRes.structuredData,
    };
  }
}
