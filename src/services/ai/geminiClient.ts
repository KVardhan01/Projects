import { AIContext, AIMessage } from '../../types/ai';
import { logger } from '../logger';
import { synthesizeQuantumExpertResponse, formatQuantumContext } from './quantumExpertEngine';

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
   * Prompts the AI Quantum Tutor with structured, context-aware workbench data.
   */
  static async chat(userPrompt: string, context: AIContext, history: AIMessage[] = []): Promise<string> {
    const formattedCtx = formatQuantumContext(context);
    const enrichedContext: AIContext = {
      ...context,
      numClassicalBits: formattedCtx.numClassicalBits,
      gateDetails: formattedCtx.gateDetails,
    };

    logger.info('AITutor', `AI Tutor received prompt: "${userPrompt.slice(0, 60)}..."`);

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
          logger.success('AITutor', `AI Tutor successfully generated response for: "${userPrompt.slice(0, 40)}"`);
          return data.reply;
        }
      } else {
        logger.warning('AITutor', `Server AI endpoint returned HTTP ${response.status}, falling back to quantum reasoning engine.`);
      }
    } catch (fetchErr: any) {
      logger.warning('AITutor', `Direct server AI fetch failed: ${fetchErr?.message || fetchErr}. Using quantum reasoning fallback.`);
    }

    // 2. High-fidelity Built-In Quantum Expert Engine
    const fallbackReply = synthesizeQuantumExpertResponse(userPrompt, enrichedContext);
    logger.info('AITutor', 'Served response via built-in quantum reasoning engine.');
    return fallbackReply;
  }
}
