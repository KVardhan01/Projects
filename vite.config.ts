import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  formatQuantumContext,
  synthesizeQuantumExpertResponse,
} from './src/services/ai/quantumExpertEngine';

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
      const userPrompt = payload.prompt || '';
      const context = payload.context || {};
      const history = payload.history || [];

      if (!userPrompt || typeof userPrompt !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Missing prompt in request' }));
      }

      appendLog('INFO', 'AITutor', `Received question: "${userPrompt.slice(0, 80)}"`);

      // Format workbench quantum context
      const formatted = formatQuantumContext(context);

      const systemInstruction = `You are the AI Quantum Study Companion & Tutor for Qubify, an interactive quantum computing learning platform.
You are an expert quantum physicist and quantum computing software engineer.
Your persona is encouraging, precise, mathematically grounded yet intuitive.

CRITICAL QUANTUM CODE DIRECTIVE:
1. All executable quantum circuits MUST BE PYTHON + QISKIT ONLY.
2. NEVER generate TypeScript, JavaScript, JSX, or other languages as circuit code.
3. Always format quantum circuits using standard Python Qiskit markdown code blocks:
\`\`\`python
from qiskit import QuantumCircuit

qc = QuantumCircuit(...)
...
\`\`\`
4. Qubify automatically generates an "Apply to Visual Circuit" button for every \`\`\`python ... \`\`\` code block. When the user asks to:
   - "apply GHZ States in circuit" or "build a GHZ state"
   - "apply Bell state" or "entangle qubits"
   - "create superposition"
   - "fix my code" or "repair circuit"
   - "add gates" or "change the circuit"
   YOU MUST provide the complete, runnable Python/Qiskit code block so the student can immediately click "Apply to Visual Circuit" to update their canvas!

CURRENT WORKBENCH CONTEXT:
1. Current number of qubits: ${formatted.numQubits}
2. Current number of classical bits: ${formatted.numClassicalBits}
3. Current circuit gates (${formatted.gateCount} total):
${formatted.gateDetails}
4. Current Python / Qiskit Code:
\`\`\`python
${formatted.activeCode}
\`\`\`
5. Current Simulation Results:
   - Probabilities: ${formatted.probabilitiesStr}
   - Measurement Counts: ${formatted.measurementCountsStr}
6. Active Simulation / Validation Errors: ${formatted.simulationError}
7. Lesson / Exercise Goal: ${formatted.exerciseGoal}
8. Student Level: ${formatted.studentLevel}

GUIDELINES FOR YOUR RESPONSE:
1. Context Awareness: Explicitly inspect and address the student's active circuit above.
2. Physics Intuition: Explain the physical state, Dirac ket notation (e.g. |GHZ⟩ = (|000⟩ + |111⟩)/√2), and gate mechanics.
3. Standard Qiskit: Use standard methods (qc.h, qc.x, qc.y, qc.z, qc.s, qc.t, qc.cx, qc.swap, qc.measure, qc.measure_all).
`;

      const apiKey = process.env.GEMINI_API_KEY || '';
      let replyText = '';

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
            contents.push({
              role: 'user',
              parts: [{ text: userPrompt }],
            });

            const genResponse = await ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction,
              },
            });

            if (genResponse && genResponse.text) {
              replyText = genResponse.text;
              appendLog('SUCCESS', 'AITutor', `Generated response using model ${modelName} for "${userPrompt.slice(0, 40)}"`);
              break;
            }
          } catch (modelErr: any) {
            console.warn(`[AITutor] Model ${modelName} encountered error:`, modelErr?.message || modelErr);
          }
        }
      }

      if (!replyText) {
        // Use quantum expert synthesis engine
        replyText = synthesizeQuantumExpertResponse(userPrompt, context);
        appendLog('INFO', 'AITutor', `Served response via quantum reasoning engine for "${userPrompt.slice(0, 40)}"`);
      }

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ success: true, reply: replyText }));
    } catch (err: any) {
      console.error('[AITutor] Error processing AI chat request:', err);
      // Fallback
      try {
        const fallback = synthesizeQuantumExpertResponse(req.url, {});
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ success: true, reply: fallback }));
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
