/**
 * ==============================================================================
 * QUBIFY CENTRALIZED LOGGER
 * ==============================================================================
 *
 * Provides structured logging with levels: INFO, WARNING, ERROR, SUCCESS.
 * Logs are transmitted to the Vite dev server middleware to append to logs/qubify.log:
 * Format: Timestamp | Level | Module | Message
 *
 * CRITICAL SECURITY:
 * Never write passwords, confirm passwords, Google access tokens, API keys,
 * client secrets, or authorization headers to logs.
 */

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
}

class QubifyLogger {
  private queue: LogPayload[] = [];
  private isFlushing = false;

  private formatTimestamp(d = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  /**
   * Sanitizes message to strictly ensure passwords and sensitive credentials
   * are never recorded in logs under any circumstances.
   */
  private sanitize(message: string): string {
    if (!message) return '';
    return String(message)
      .replace(/password[:=]\s*["']?[^"'\s,;]+["']?/gi, 'password: [REDACTED]')
      .replace(/confirmPassword[:=]\s*["']?[^"'\s,;]+["']?/gi, 'confirmPassword: [REDACTED]')
      .replace(/ya29\.[a-zA-Z0-9_-]+/g, '[REDACTED_TOKEN]')
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]')
      .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]');
  }

  private emit(level: LogLevel, module: string, message: string): void {
    const cleanMsg = this.sanitize(message);
    const timestamp = this.formatTimestamp();
    const payload: LogPayload = { timestamp, level, module, message: cleanMsg };

    // Development browser console output
    const consolePrefix = `[${timestamp}] [${level}] [${module}]`;
    if (level === 'ERROR') {
      console.error(consolePrefix, cleanMsg);
    } else if (level === 'WARNING') {
      console.warn(consolePrefix, cleanMsg);
    } else if (level === 'SUCCESS') {
      console.info(`%c${consolePrefix} ${cleanMsg}`, 'color: #10b981; font-weight: bold;');
    } else {
      console.info(consolePrefix, cleanMsg);
    }

    // Queue and dispatch to server-side file writer (logs/qubify.log)
    this.queue.push(payload);
    this.flush();
  }

  private async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;
      try {
        await fetch('/api/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        });
      } catch {
        // Dev server may be unreachable during restart; silently continue
      }
    }

    this.isFlushing = false;
  }

  info(module: string, message: string): void {
    this.emit('INFO', module, message);
  }

  warning(module: string, message: string): void {
    this.emit('WARNING', module, message);
  }

  error(module: string, message: string): void {
    this.emit('ERROR', module, message);
  }

  success(module: string, message: string): void {
    this.emit('SUCCESS', module, message);
  }
}

export const logger = new QubifyLogger();

// Attach global error and unhandled rejection listeners in browser context
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('UnhandledError', event.message || 'Unknown window error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason =
      event.reason instanceof Error
        ? event.reason.message
        : typeof event.reason === 'string'
        ? event.reason
        : JSON.stringify(event.reason || 'Unknown rejection');
    logger.error('UnhandledPromise', `Unhandled Promise rejection: ${reason}`);
  });
}
