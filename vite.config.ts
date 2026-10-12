import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  formatQuantumContext,
  synthesizeQuantumExpertResponse,
  detectUserIntent,
  extractQiskitCodeDetails,
  extractErrorDetails,
} from './src/services/ai/quantumExpertEngine';
import { QuantumCircuitSimulator } from './src/quantum/QuantumCircuitSimulator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.resolve(__dirname, 'logs');
const logFile = path.join(logDir, 'qubify.log');

// Immediately ensure logs directory and file exist in the project root on Vite startup
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '', 'utf-8');
  }
} catch (initErr) {
  console.warn('Failed to initialize logs directory:', initErr);
}

const appendLog = (level: string, moduleName: string, message: string, timestamp?: string) => {
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const defaultTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const timeStr = timestamp || defaultTime;

    // Defense-in-depth sanitization: strip any sensitive credentials
    const cleanMessage = String(message || '')
      .replace(/password[:=]\s*["']?[^"'\s,;]+["']?/gi, 'password: [REDACTED]')
      .replace(/confirmPassword[:=]\s*["']?[^"'\s,;]+["']?/gi, 'confirmPassword: [REDACTED]')
      .replace(/ya29\.[a-zA-Z0-9_-]+/g, '[REDACTED_TOKEN]')
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]')
      .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]');

    const entry = `${timeStr} | ${String(level).toUpperCase()} | ${moduleName || 'System'} | ${cleanMessage}\n`;
    fs.appendFileSync(logFile, entry, 'utf-8');
  } catch (err) {
    console.warn('Error appending log to file:', err);
  }
};

function qubifyLoggingPlugin() {
  const handleLogMiddleware = (req: any, res: any, next: any) => {
    const isLogEndpoint =
      req.url &&
      (req.url === '/__qubify_log' ||
        req.url.startsWith('/__qubify_log?') ||
        req.url === '/api/log' ||
        req.url.startsWith('/api/log?'));

    if (isLogEndpoint && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          appendLog(data.level || 'INFO', data.module || 'App', data.message || '', data.timestamp);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
    } else {
      next();
    }
  };

  return {
    name: 'qubify-centralized-logger',
    configureServer(server: any) {
      server.middlewares.use(handleLogMiddleware);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handleLogMiddleware);
    },
  };
}

const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwvKXR90qNvHimyJPT1eddrT296sXP9cUfrrviA0xj8g5p3y8Bgsi6Owmgv4T7rwohU/exec';

function qubifyGoogleSheetsProxyPlugin() {
  const getTargetUrl = () => {
    return (
      process.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
      process.env.GOOGLE_APPS_SCRIPT_URL ||
      DEFAULT_APPS_SCRIPT_URL
    );
  };

  const handleProxy = async (req: any, res: any, next: any) => {
    const isGoogleSheetsEndpoint =
      req.url &&
      (req.url === '/api/google-sheets' ||
        req.url.startsWith('/api/google-sheets?') ||
        req.url.startsWith('/api/google-sheets/'));

    if (!isGoogleSheetsEndpoint) {
      return next();
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      return res.end();
    }

    try {
      let bodyText = '';
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        bodyText = await new Promise<string>((resolve, reject) => {
          let data = '';
          req.on('data', (chunk: any) => {
            data += chunk;
          });
          req.on('end', () => resolve(data));
          req.on('error', reject);
        });
      }

      const appsScriptUrl = getTargetUrl();
      const queryIndex = req.url.indexOf('?');
      const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';
      const target = queryString
        ? `${appsScriptUrl}${appsScriptUrl.includes('?') ? '&' : '?'}${queryString.slice(1)}`
        : appsScriptUrl;

      // Forward request from Vite server to Google Apps Script using automatic redirect following
      const incomingContentType = req.headers['content-type'] || 'application/json';
      const fetchRes = await fetch(target, {
        method: req.method || 'POST',
        headers: {
          'Content-Type': incomingContentType,
        },
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : bodyText,
        redirect: 'follow',
      });

      const responseText = await fetchRes.text();
      const contentType = fetchRes.headers.get('content-type') || 'application/json; charset=utf-8';

      res.writeHead(fetchRes.status, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      res.end(responseText);
    } catch (proxyErr: any) {
      console.error('[Vite Proxy] Error proxying to Google Apps Script:', proxyErr);
      res.writeHead(502, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(
        JSON.stringify({
          success: false,
          error: 'ProxyError',
          message: `Vite server proxy failed to reach Google Apps Script: ${proxyErr?.message || proxyErr}`,
        })
      );
    }
  };

  return {
    name: 'qubify-google-sheets-proxy',
    configureServer(server: any) {
      server.middlewares.use(handleProxy);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handleProxy);
    },
  };
}

function qubifyGeminiPlugin() {
  const handleAiChat = async (req: any, res: any, next: any) => {
    const isAiEndpoint =
      req.url &&
      (req.url === '/api/ai/chat' ||
        req.url.startsWith('/api/ai/chat?') ||
        req.url.startsWith('/api/ai/chat/'));

    if (!isAiEndpoint) {
      return next();
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      return res.end();
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    }

    let userPrompt = '';
    let context: any = {};

    try {
      const bodyText = await new Promise<string>((resolve, reject) => {
        let data = '';
        req.on('data', (chunk: any) => {
          data += chunk;
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });

      const payload = JSON.parse(bodyText || '{}');
      userPrompt = payload.prompt || '';
      context = payload.context || {};
      const history = payload.history || [];

      if (!userPrompt || typeof userPrompt !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Missing prompt in request' }));
      }

      const intent = detectUserIntent(userPrompt, context);
      appendLog('INFO', 'AITutor', `Received question: "${userPrompt.slice(0, 80)}" | Intent: ${intent}`);

      // Extract error details if an active error exists or validate circuit directly
      let rawError =
        context.simulationError ||
        (context.validationErrors && context.validationErrors.length > 0
          ? context.validationErrors.join('; ')
          : '');

      if (!rawError && context.circuit) {
        const val = QuantumCircuitSimulator.validateCircuit(context.circuit);
        if (!val.isValid && val.errors.length > 0) {
          rawError = val.errors.join('; ');
        }
      }

      const errDetails = rawError ? extractErrorDetails(rawError, context.circuit) : undefined;

      // Format workbench quantum context
      const formatted = formatQuantumContext(context);

      const systemInstruction = `You are the AI Quantum Study Companion & Tutor for Qubify, an interactive quantum computing learning platform.
You are an expert quantum physicist and quantum computing software engineer.
Your persona is encouraging, precise, mathematically grounded yet intuitive.

CRITICAL ARCHITECTURE DIRECTIVE:
1. The USER REQUEST is your PRIMARY TASK. The latest user message has the HIGHEST PRIORITY.
2. The CURRENT WORKBENCH STATE provided below represents only the current editor state for your reference. Do NOT blindly describe or explain the current workbench circuit unless the user explicitly asks for an explanation of their current circuit!
3. All user-facing executable quantum circuits MUST BE PYTHON + QISKIT ONLY.
4. Always format quantum circuits using standard Python Qiskit markdown code blocks:
\`\`\`python
from qiskit import QuantumCircuit

qc = QuantumCircuit(...)
...
\`\`\`
Write circuit code directly as top-level sequential statements without wrapping in Python functions or classes, so Qubify's parser can apply it directly to the visual canvas.

STRICT RESPONSE PRIORITY RULES:
1. Current Circuit / Simulation Error Diagnosis (HIGHEST PRIORITY):
If the user asks why their circuit or state is failing / has an issue / not working, or if an active circuit validation error exists:
- You MUST prioritize diagnosing this EXACT ERROR over generic educational information!
- DO NOT give a long generic textbook explanation of what the state or concept is (e.g. do NOT explain Werner state mathematical definition, density matrix, p-values, or separability criteria).
- Answer WHAT failed, WHY it failed, WHERE it failed, and HOW to fix it in 3 to 8 direct sentences.
- Clarify that this is a circuit layout/time-slot validation conflict in the editor, and does NOT mean that the underlying quantum concept or state itself is invalid.

2. Explicit Debugging / Fix Request:
When asked to fix or debug the circuit, diagnose the issue and provide the corrected code in a \`\`\`python ... \`\`\` code block.

3. Explicit Circuit Generation / Modification Request:
When asked to create/make/build a quantum state or circuit (and NOT asking why it fails), provide:
1. What the requested quantum state/circuit is.
2. The required number of qubits.
3. The gates required.
4. The complete runnable Python/Qiskit code.
5. Concise explanation of why those gates create the requested state.
6. Explicit comparison with current circuit: state whether the current circuit can/needs to be modified.

4. Specific Question About Current Circuit: Walk through active gates and physical function.
5. Specific Question About Simulation Results: Analyze active circuit probabilities and measurements.
6. Conceptual Question: Provide an intuitive educational explanation ONLY when the user explicitly asks for conceptual understanding.

DETECTED REQUEST INTENT: "${intent}"

${
  intent === 'error_diagnosis'
    ? `CRITICAL ERROR-DIAGNOSIS INSTRUCTION:
The user is asking why their circuit or simulation is failing/has an issue: "${userPrompt}".
Active circuit error detected: "${errDetails?.rawError || rawError}".

You MUST prioritize diagnosing this EXACT ERROR over generic educational explanations!
DO NOT give a long generic textbook explanation of what the state or concept is (e.g. do NOT explain Werner state mathematical definition, density matrix, p-values, or separability criteria).
The user is asking why THEIR CIRCUIT has an issue!

Your answer MUST directly explain:
1. WHAT failed: The exact validation or simulation error ("${errDetails?.rawError || rawError}").
2. WHY it failed: The physical and layout reason (e.g., in this circuit representation, a single qubit wire cannot execute multiple operations simultaneously in the same discrete time slot/moment).
3. WHERE it failed: Specifically identify wire q${errDetails?.affectedQubit ?? 0} and moment ${errDetails?.affectedMoment ?? 2}${
        errDetails?.conflictingGates && errDetails.conflictingGates.length > 0
          ? ` with conflicting gates: ${errDetails.conflictingGates.join(' and ')}`
          : ''
      }.
4. HOW to fix it: Actionable instructions (e.g. move one of the overlapping gates to the next sequential moment, or serialize the gates).
5. Clarify that this is a circuit layout/time-slot validation conflict in the editor, and does NOT mean that the underlying quantum concept or state itself is invalid.

Keep your response concise, clear, and direct (between 3 to 8 sentences). Answer the user's immediate question first!`
    : intent === 'generate_circuit'
    ? `The user is requesting the CREATION/GENERATION of a quantum state or circuit: "${userPrompt}".
You MUST fulfill this request by providing:
1. What the requested quantum state/circuit is.
2. The required number of qubits.
3. The gates required.
4. The complete, runnable Python/Qiskit code in a standard \`\`\`python ... \`\`\` code block.
5. A concise explanation of why those gates create the requested state.
6. A comparison with the current circuit: explicitly state whether the current circuit can/needs to be modified or replaced to produce it.
7. Simulator Compatibility Note:
- For pure states (e.g. Bell state, GHZ state, W state, Teleportation, Superposition, Grover, Deutsch-Jozsa), note that the circuit is fully supported by Qubify and ready to be applied to the visual canvas.
- For Werner states specifically: Explain that an exact Werner state is an open-system statistical mixed state ρ_W(p) = p |Ψ-⟩⟨Ψ-| + ((1-p)/4) I₄ requiring density-matrix simulation. Qubify operates on pure state vectors and cannot simulate exact mixed states. DO NOT label a pure Bell state as a Werner state, and state clearly that exact Werner-state preparation cannot be applied to the visual canvas.
Do NOT claim that the circuit was changed unless the application actually changes the circuit.`
    : intent === 'explain_circuit'
    ? `The user wants you to explain their CURRENT circuit. Walk through their active gates and explain their physical function.`
    : intent === 'analyze_simulation'
    ? `The user is asking about their simulation results or measurement probabilities. Analyze the active circuit and probabilities.`
    : intent === 'debug_circuit'
    ? `The user is reporting an error or asking to debug their circuit. Diagnose the issue and provide the corrected code in a \`\`\`python ... \`\`\` code block.`
    : intent === 'modify_circuit'
    ? `The user wants to modify their existing circuit. Explain the change and provide the updated complete Qiskit code in a \`\`\`python ... \`\`\` code block.`
    : `Answer the conceptual quantum question with physical intuition and mathematical grounding.`
}

CURRENT WORKBENCH STATE (For reference only - do NOT confuse with user request):
- Current Circuit Register: ${formatted.numQubits} qubit(s), ${formatted.numClassicalBits} classical bit(s)
- Current Gates (${formatted.gateCount} total):
${formatted.gateDetails}
- Current Qiskit Code:
\`\`\`python
${formatted.activeCode}
\`\`\`
- Current Simulation:
  * Probabilities: ${formatted.probabilitiesStr}
  * Measurements: ${formatted.measurementCountsStr}
- Simulation / Validation Errors: ${formatted.simulationError}
- Lesson / Exercise Goal: ${formatted.exerciseGoal}
- Student Level: ${formatted.studentLevel}
`;

      const apiKey = process.env.GEMINI_API_KEY || '';
      let replyText = '';
      let rawGeminiOutput = '';
      let usedModel = '';

      const circuitActionDeclaration = {
        name: 'circuit_action',
        description:
          'Propose or execute a quantum circuit action. Call this tool whenever the user requests creating, generating, building, giving, adding, modifying, or applying a quantum state or circuit (e.g. Bell state, GHZ state, W state, teleportation, Werner state, custom gates). Do NOT call this tool for purely conceptual questions.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            actionType: {
              type: Type.STRING,
              description: 'Action type: "generate_circuit", "modify_circuit", or "explain_limitation"',
            },
            circuitName: {
              type: Type.STRING,
              description: 'Name of the circuit or quantum state (e.g. "Bell State", "GHZ State", "Werner State")',
            },
            qubits: {
              type: Type.INTEGER,
              description: 'Number of qubits required for this circuit',
            },
            qiskitCode: {
              type: Type.STRING,
              description: 'Complete, runnable Python Qiskit code for the circuit',
            },
            operations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: 'Gate type: H, X, Y, Z, S, T, CX, SWAP, M',
                  },
                  qubits: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: 'Target or [control, target] qubit wire indices (0-indexed)',
                  },
                },
                required: ['type', 'qubits'],
              },
              description: 'Ordered list of gate operations',
            },
            explanation: {
              type: Type.STRING,
              description: 'Educational explanation of how the circuit produces the requested state',
            },
            isSupportedBySimulator: {
              type: Type.BOOLEAN,
              description:
                'Whether this quantum state can be simulated on Qubify\'s pure state-vector simulator. MUST be FALSE for statistical mixed states such as Werner states.',
            },
            unsupportedReason: {
              type: Type.STRING,
              description:
                'If isSupportedBySimulator is false, state why (e.g. "Werner states are statistical mixed states requiring density-matrix simulation. Qubify operates on pure state vectors.")',
            },
          },
          required: ['actionType', 'circuitName', 'qubits', 'explanation', 'isSupportedBySimulator'],
        },
      };

      let qiskitCode: string | undefined;
      let requiredQubits: number | undefined;
      let qubits: number | undefined;
      let gates: any[] | undefined;
      let action: 'apply_to_visual_circuit' | 'explain_limitation' | 'none' = 'none';
      let isSupportedBySimulator = true;
      let unsupportedReason: string | undefined;
      let noiseSettings: any = undefined;

      const pLower = userPrompt.toLowerCase();
      const isWernerRequest = pLower.includes('werner');

      if (apiKey && apiKey.trim().length > 5) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        // Try primary model gemini-3.8-flash, fallback to gemini-3.1-flash-lite if 503 or transient unavailability
        const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

        for (const modelName of candidateModels) {
          try {
            const contents: any[] = [];
            if (Array.isArray(history) && history.length > 0) {
              const recent = history.slice(-4);
              for (const h of recent) {
                if (h.role === 'user' || h.role === 'assistant') {
                  contents.push({
                    role: h.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: h.content || '' }],
                  });
                }
              }
            }
            const userText =
              intent === 'error_diagnosis'
                ? `LATEST USER QUESTION (HIGHEST PRIORITY):
"${userPrompt}"

ACTIVE CIRCUIT ERROR:
"${errDetails?.rawError || rawError}"
AFFECTED QUBIT: q${errDetails?.affectedQubit ?? 0}
AFFECTED MOMENT: moment ${errDetails?.affectedMoment ?? 2}
CONFLICTING GATES: ${errDetails?.conflictingGates.join(', ') || 'multiple gates'}
ACTIVE QISKIT CODE:
${formatted.activeCode}

PRIORITY INSTRUCTION: The user is asking why their circuit has an issue / is failing. You MUST diagnose the active circuit error above directly in 3 to 8 sentences. Explain WHAT failed, WHY it failed, WHERE it failed, and HOW to fix it. DO NOT give a generic textbook definition or mathematical derivation of the quantum state concept!`
                : `USER REQUEST:\n"${userPrompt}"\n\nINTENT: ${intent}\n\nPlease fulfill this user request following the guidelines.`;

            contents.push({
              role: 'user',
              parts: [{ text: userText }],
            });

            const genResponse = await ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction,
                tools: [{ functionDeclarations: [circuitActionDeclaration] }],
              },
            });

            const functionCalls = genResponse.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
              const call = functionCalls[0];
              const args: any = call.args || {};
              rawGeminiOutput = JSON.stringify(call);
              usedModel = modelName;

              qubits = args.qubits;
              requiredQubits = args.qubits;
              qiskitCode = args.qiskitCode;
              gates = args.operations;
              isSupportedBySimulator = args.isSupportedBySimulator !== false;
              unsupportedReason = args.unsupportedReason;
              replyText =
                genResponse.text ||
                args.explanation ||
                `### ${args.circuitName || 'Quantum Circuit'}\n\n${args.explanation || ''}`;

              if (isWernerRequest && (intent === 'generate_circuit' || intent === 'modify_circuit')) {
                action = 'explain_limitation';
                isSupportedBySimulator = false;
                unsupportedReason =
                  "Exact Werner-state preparation is not supported by Qubify's simulator because Werner states are statistical mixed states requiring density-matrix simulation. Qubify operates on pure state vectors.";
              } else if (
                isSupportedBySimulator &&
                (args.actionType === 'generate_circuit' ||
                  args.actionType === 'modify_circuit' ||
                  intent === 'generate_circuit' ||
                  intent === 'modify_circuit')
              ) {
                action = 'apply_to_visual_circuit';
              } else if (!isSupportedBySimulator) {
                action = 'explain_limitation';
              }
              break;
            } else if (genResponse && genResponse.text) {
              replyText = genResponse.text;
              rawGeminiOutput = genResponse.text;
              usedModel = modelName;

              const codeMatch = replyText.match(/```python([\s\S]*?)```/);
              if (codeMatch) {
                qiskitCode = codeMatch[1].trim();
                const details = extractQiskitCodeDetails(qiskitCode);
                requiredQubits = details.requiredQubits;
                qubits = details.requiredQubits;
                gates = details.structuredGates;
                isSupportedBySimulator = details.isSupportedBySimulator;
                unsupportedReason = details.unsupportedReason;
              }

              if (isWernerRequest && (intent === 'generate_circuit' || intent === 'modify_circuit')) {
                action = 'explain_limitation';
                isSupportedBySimulator = false;
                unsupportedReason =
                  "Exact Werner-state preparation is not supported by Qubify's simulator because Werner states are statistical mixed states requiring density-matrix simulation. Qubify operates on pure state vectors.";
              } else if (
                isSupportedBySimulator &&
                (intent === 'generate_circuit' || intent === 'modify_circuit' || intent === 'debug_circuit')
              ) {
                action = 'apply_to_visual_circuit';
              }
              break;
            }
          } catch (modelErr: any) {
            console.warn(`[AITutor] Model ${modelName} encountered error:`, modelErr?.message || modelErr);
          }
        }
      }

      // If Gemini did not return a response or was unavailable/quota-limited, fall back to quantum expert synthesis
      if (!replyText || (!qiskitCode && (intent === 'generate_circuit' || intent === 'modify_circuit') && !isWernerRequest)) {
        const expertRes = synthesizeQuantumExpertResponse(userPrompt, context);
        if (!replyText) replyText = expertRes.reply;
        if (!rawGeminiOutput) rawGeminiOutput = '(Synthesized via quantum expert engine)';
        qiskitCode = expertRes.qiskitCode;
        requiredQubits = expertRes.requiredQubits;
        qubits = expertRes.requiredQubits;
        gates = expertRes.structuredData?.gates || expertRes.gates;
        noiseSettings = expertRes.structuredData?.noiseSettings;
        action = expertRes.structuredData?.action || (expertRes.qiskitCode ? 'apply_to_visual_circuit' : 'none');
        isSupportedBySimulator = expertRes.structuredData?.isSupportedBySimulator !== false;
        unsupportedReason = expertRes.structuredData?.unsupportedReason;
        appendLog('INFO', 'AITutor', `Served response via quantum expert reasoning engine for "${userPrompt.slice(0, 40)}"`);
      } else if (isWernerRequest && (intent === 'generate_circuit' || intent === 'modify_circuit')) {
        action = 'explain_limitation';
        isSupportedBySimulator = false;
        unsupportedReason =
          "Exact Werner-state preparation is not supported by Qubify's simulator because Werner states are statistical mixed states requiring density-matrix simulation. Qubify operates on pure state vectors.";
      }

      const circuitActionDetected = action === 'apply_to_visual_circuit' || action === 'explain_limitation';
      const applyActionCreated = action === 'apply_to_visual_circuit';

      // Required Step 2 temporary debug logging block
      const debugBlock = [
        '==================================================',
        'AI USER MESSAGE:',
        userPrompt,
        '',
        'GEMINI RAW RESPONSE:',
        rawGeminiOutput ? rawGeminiOutput.slice(0, 300) : '(None)',
        '',
        'PARSED AI RESPONSE:',
        replyText ? replyText.slice(0, 300) : '(None)',
        '',
        'CIRCUIT ACTION DETECTED:',
        String(circuitActionDetected),
        '',
        'ACTION TYPE:',
        action,
        '',
        'OPERATIONS:',
        JSON.stringify(gates || []),
        '',
        'APPLY ACTION CREATED:',
        String(applyActionCreated),
        '',
        'CIRCUIT MODEL UPDATE CALLED:',
        'false (Ready for user Apply button click)',
        '==================================================',
      ].join('\n');

      console.log(debugBlock);
      appendLog('INFO', 'AITutor-DEBUG', debugBlock);

      const structuredData: any = {
        intent,
        action,
        request: userPrompt,
        explanation: replyText,
        qiskitCode,
        qubits: qubits || requiredQubits,
        requiredQubits: requiredQubits || qubits,
        gates,
        noiseSettings,
        canModifyCurrentCircuit: action === 'apply_to_visual_circuit',
        isSupportedBySimulator,
        unsupportedReason,
      };

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(
        JSON.stringify({
          success: true,
          intent,
          action,
          request: userPrompt,
          reply: replyText,
          explanation: replyText,
          qiskitCode,
          qubits: qubits || requiredQubits,
          requiredQubits: requiredQubits || qubits,
          gates,
          isSupportedBySimulator,
          unsupportedReason,
          structuredData,
        })
      );
    } catch (err: any) {
      console.error('[AITutor] Error processing AI chat request:', err);
      try {
        const expertFallback = synthesizeQuantumExpertResponse(userPrompt || req.url, context || {});
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(
          JSON.stringify({
            success: true,
            intent: expertFallback.intent,
            request: userPrompt,
            reply: expertFallback.reply,
            explanation: expertFallback.reply,
            qiskitCode: expertFallback.qiskitCode,
            requiredQubits: expertFallback.requiredQubits,
            gates: expertFallback.gates,
            structuredData: expertFallback.structuredData,
          })
        );
      } catch {
        res.writeHead(500, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ success: false, error: err?.message || 'AI Tutor Error' }));
      }
    }
  };

  return {
    name: 'qubify-gemini-tutor',
    configureServer(server: any) {
      server.middlewares.use(handleAiChat);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handleAiChat);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      qubifyLoggingPlugin(),
      qubifyGoogleSheetsProxyPlugin(),
      qubifyGeminiPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['@monaco-editor/react', 'monaco-editor'],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      cors: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
