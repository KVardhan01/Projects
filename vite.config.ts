import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function qubifyLoggingPlugin() {
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
  };

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

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), qubifyLoggingPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['@monaco-editor/react', 'monaco-editor'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
