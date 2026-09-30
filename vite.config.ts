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

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), qubifyLoggingPlugin(), qubifyGoogleSheetsProxyPlugin()],
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
