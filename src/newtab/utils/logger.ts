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
