/**
 * Application version and metadata
 * Read from extension manifest at runtime
 */

const manifest = globalThis.chrome?.runtime?.getManifest?.();

// Prefer the manifest version (source of truth for extensions)
export const APP_VERSION = manifest?.version || '1.0.0';
export const APP_NAME = manifest?.name || 'OpenInfinity';
export const APP_DESCRIPTION = manifest?.description || '';
