/**
 * Location permission manager
 * Handles permission state tracking and retry logic
 */

/**
 * Check current location permission status
 */
export async function checkLocationPermission(): Promise<PermissionState> {
  try {
    if (!navigator.permissions) {
      return 'prompt';
    }

    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state;
  } catch (error) {
    console.warn('Failed to check location permission:', error);
    return 'prompt';
  }
}

/**
 * Watch for location permission changes
 * @param callback Function to call when permission state changes
 * @returns Cleanup function to stop watching
 */
export function watchLocationPermission(
  callback: (state: PermissionState) => void
): () => void {
  if (!navigator.permissions) {
    return () => {};
  }

  let cleanup: (() => void) | null = null;
  let isAborted = false; // Flag to handle race condition

  const setupWatch = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: 'geolocation' as PermissionName
      });

      // If already aborted before setup completes, don't add listener
      if (isAborted) return;

      const handleChange = () => {
        callback(permissionStatus.state);
      };

      permissionStatus.addEventListener('change', handleChange);

      cleanup = () => {
        permissionStatus.removeEventListener('change', handleChange);
      };
    } catch (error) {
      console.warn('Failed to watch location permission:', error);
    }
  };

  setupWatch();

  return () => {
    isAborted = true; // Mark as aborted to prevent late setup
    if (cleanup) cleanup();
  };
}
