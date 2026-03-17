type ChunkRecoveryOptions = {
  maxReloads?: number;
  sessionStorageKey?: string;
};

function getMessage(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') {
    return value.message;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function looksLikeDynamicImportFetchFailure(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('failed to fetch dynamically imported module') ||
    normalized.includes('importing a module script failed') ||
    normalized.includes('chunkloaderror')
  );
}

function getReloadCount(key: string): number {
  try {
    const raw = sessionStorage.getItem(key);
    const parsed = Number.parseInt(raw ?? '0', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function setReloadCount(key: string, value: number): void {
  try {
    sessionStorage.setItem(key, String(value));
  } catch {
    // Ignore storage errors (e.g. disabled storage).
  }
}

/**
 * Recover from stale cached entrypoints after extension updates.
 * When a page keeps an old JS chunk URL, dynamic import can fail with:
 * "Failed to fetch dynamically imported module .../assets/<chunk>-<hash>.js".
 * A single reload usually resolves the mismatch by loading the latest entrypoint.
 */
export function installChunkLoadRecovery(options: ChunkRecoveryOptions = {}): void {
  if (typeof window === 'undefined') return;
  if (typeof sessionStorage === 'undefined') return;

  const sessionStorageKey = options.sessionStorageKey ?? 'openinfinity:chunk-recovery:reload-count';
  const maxReloads = options.maxReloads ?? 1;

  const maybeReload = (message: string) => {
    if (!looksLikeDynamicImportFetchFailure(message)) return;

    const count = getReloadCount(sessionStorageKey);
    if (count >= maxReloads) return;

    setReloadCount(sessionStorageKey, count + 1);
    console.warn('[ChunkRecovery] Detected dynamic import failure, reloading:', message);
    window.location.reload();
  };

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    maybeReload(getMessage(event.reason));
  });

  window.addEventListener('error', (event: Event) => {
    if (!(event instanceof ErrorEvent)) return;
    maybeReload(event.message || getMessage(event.error));
  });
}

