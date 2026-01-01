/**
 * Logger Utility
 *
 * Development-only logging with production suppression.
 * Provides consistent log formatting across the application.
 */

const IS_DEV = import.meta.env.DEV;
const LOG_PREFIX = '[OpenInfinity]';

/**
 * Create a scoped logger with module prefix
 */
export function createLogger(module: string) {
  const prefix = `${LOG_PREFIX}[${module}]`;

  return {
    debug: (...args: unknown[]) => {
      if (IS_DEV) console.debug(prefix, ...args);
    },
    info: (...args: unknown[]) => {
      if (IS_DEV) console.info(prefix, ...args);
    },
    warn: (...args: unknown[]) => {
      // Warnings always log (may indicate issues in production)
      console.warn(prefix, ...args);
    },
    error: (...args: unknown[]) => {
      // Errors always log
      console.error(prefix, ...args);
    },
  };
}

/**
 * Rate-limited logger - prevents log spam from high-frequency events
 *
 * @param module - Module name for log prefix
 * @param intervalMs - Minimum interval between same logs (default: 1000ms)
 */
export function createRateLimitedLogger(module: string, intervalMs = 1000) {
  const logger = createLogger(module);
  const lastLogTime = new Map<string, number>();
  const MAX_CACHE_SIZE = 100; // Prevent memory leak from unlimited Map growth

  const rateLimitedMethod = (logFn: (...args: unknown[]) => void) => {
    return (...args: unknown[]) => {
      // Use first argument as key (usually a string message)
      // Avoid JSON.stringify for performance - just use string conversion
      const key = String(args[0] || '');
      const now = Date.now();
      const last = lastLogTime.get(key) || 0;

      if (now - last > intervalMs) {
        logFn(...args);
        lastLogTime.set(key, now);

        // Cleanup old entries to prevent memory leak
        if (lastLogTime.size > MAX_CACHE_SIZE) {
          const oldestKey = lastLogTime.keys().next().value;
          if (oldestKey !== undefined) {
            lastLogTime.delete(oldestKey);
          }
        }
      }
    };
  };

  return {
    debug: rateLimitedMethod(logger.debug),
    info: rateLimitedMethod(logger.info),
    warn: logger.warn,   // warn/error should not be rate-limited
    error: logger.error,
  };
}

/**
 * Global logger instance
 * Use createLogger() for module-specific logging
 */
export const logger = {
  /**
   * Debug level - only in development
   */
  debug: (...args: unknown[]) => {
    if (IS_DEV) console.debug(LOG_PREFIX, ...args);
  },

  /**
   * Info level - only in development
   */
  info: (...args: unknown[]) => {
    if (IS_DEV) console.info(LOG_PREFIX, ...args);
  },

  /**
   * Warning level - always logs
   */
  warn: (...args: unknown[]) => {
    console.warn(LOG_PREFIX, ...args);
  },

  /**
   * Error level - always logs
   */
  error: (...args: unknown[]) => {
    console.error(LOG_PREFIX, ...args);
  },

  /**
   * Time measurement - only in development
   */
  time: (label: string) => {
    if (IS_DEV) console.time(`${LOG_PREFIX} ${label}`);
  },

  /**
   * Time measurement end - only in development
   */
  timeEnd: (label: string) => {
    if (IS_DEV) console.timeEnd(`${LOG_PREFIX} ${label}`);
  },

  /**
   * Group logs - only in development
   */
  group: (label: string) => {
    if (IS_DEV) console.group(`${LOG_PREFIX} ${label}`);
  },

  /**
   * End log group - only in development
   */
  groupEnd: () => {
    if (IS_DEV) console.groupEnd();
  },
};

export default logger;
