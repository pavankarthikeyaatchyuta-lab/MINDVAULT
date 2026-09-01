/**
 * Safe Structured Logger for MindVault
 * 
 * CRITICAL PRIVACY & SECURITY RULES:
 * - NEVER log journal contents or user text.
 * - NEVER log Gemini prompts containing private context.
 * - NEVER log Gemini responses containing personal recollections.
 * - NEVER log Firebase ID tokens, Authorization headers, or JWTs.
 * - NEVER log API keys or secrets.
 * - NEVER log exact GPS coordinates.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  service?: string;
  action?: string;
  status?: number | string;
  durationMs?: number;
  uid?: string; // Logged as hashed or truncated for privacy
  errorCode?: string;
  [key: string]: any;
}

function sanitizeContext(context?: LogContext): Record<string, any> {
  if (!context) return {};

  const sanitized: Record<string, any> = {};
  const sensitiveKeys = [
    'authorization',
    'token',
    'idtoken',
    'key',
    'apikey',
    'secret',
    'password',
    'prompt',
    'response',
    'content',
    'journal',
    'message',
    'messages',
    'text',
  ];

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED_FOR_PRIVACY]';
    } else if (key === 'uid' && typeof value === 'string') {
      // Truncate UID for privacy in application logs
      sanitized[key] = value.length > 8 ? `${value.slice(0, 6)}...` : '[REDACTED_UID]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizeContext(context),
  };

  const output = JSON.stringify(logEntry);

  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'debug':
      if (process.env.NODE_ENV !== 'production') {
        console.debug(output);
      }
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  info: (message: string, context?: LogContext) => formatLog('info', message, context),
  warn: (message: string, context?: LogContext) => formatLog('warn', message, context),
  error: (message: string, context?: LogContext) => formatLog('error', message, context),
  debug: (message: string, context?: LogContext) => formatLog('debug', message, context),
};
