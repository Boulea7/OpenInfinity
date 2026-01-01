/**
 * Folder Merge Hook
 * Manages the state machine for drag-and-drop folder merging with 500ms hover delay
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Merge operation status states
 * - idle: No drag operation in progress
 * - dragging: An icon is being dragged
 * - hovering: Dragged icon is hovering over a target (timer started)
 * - merge_ready: 500ms hover completed, ready to merge
 */
export type MergeStatus = 'idle' | 'dragging' | 'hovering' | 'merge_ready';

/**
 * Complete merge state including source, target, and animation progress
 */
export interface MergeState {
  status: MergeStatus;
  sourceIconId: string | null;
  targetIconId: string | null;
  hoverStartTime: number | null;
  position: { x: number; y: number } | null;
  progress: number; // 0-1 for progress ring animation
}

/**
 * Return type for useFolderMerge hook
 */
export interface UseFolderMergeReturn {
  state: MergeState;
  startDrag: (iconId: string) => void;
  enterTarget: (targetId: string, position: { x: number; y: number }) => void;
  leaveTarget: () => void;
  confirmMerge: () => { sourceId: string; targetId: string; position: { x: number; y: number } } | null;
  cancelDrag: () => void;
  isMergeTarget: (iconId: string) => boolean;
  isMergeReady: boolean;
}

// Hover delay before triggering merge_ready state (in milliseconds)
const HOVER_DELAY_MS = 500;

// Progress update interval for smooth animation (60fps)
const PROGRESS_UPDATE_INTERVAL_MS = 16;

/**
 * Initial state for the merge state machine
 */
const initialState: MergeState = {
  status: 'idle',
  sourceIconId: null,
  targetIconId: null,
  hoverStartTime: null,
  position: null,
  progress: 0,
};

/**
 * Hook for managing folder merge state machine
 * Implements 500ms hover delay with real-time progress updates for UI feedback
 */
export function useFolderMerge(): UseFolderMergeReturn {
  const [state, setState] = useState<MergeState>(initialState);

  // Use refs to avoid re-renders during high-frequency timer updates
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Clear all timers (hover delay and progress animation)
   */
  const clearTimers = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  /**
   * Start dragging an icon
   * Transitions from idle to dragging state
   */
  const startDrag = useCallback((iconId: string) => {
    clearTimers();
    setState({
      ...initialState,
      status: 'dragging',
      sourceIconId: iconId,
    });
  }, [clearTimers]);

  /**
   * Enter a potential merge target
   * Starts the 500ms hover timer and progress animation
   */
  const enterTarget = useCallback((targetId: string, position: { x: number; y: number }) => {
    setState(prev => {
      // Only allow entering target while dragging
      if (prev.status !== 'dragging' && prev.status !== 'hovering') {
        return prev;
      }

      // Cannot merge with self
      if (prev.sourceIconId === targetId) {
        return prev;
      }

      // Already hovering over this target, ignore
      if (prev.targetIconId === targetId && prev.status === 'hovering') {
        return prev;
      }

      return {
        ...prev,
        status: 'hovering',
        targetIconId: targetId,
        hoverStartTime: Date.now(),
        position,
        progress: 0,
      };
    });

    // Clear any existing timers before starting new ones
    clearTimers();

    // Start progress animation interval (updates every 16ms for smooth 60fps)
    progressIntervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.status !== 'hovering' || !prev.hoverStartTime) {
          return prev;
        }

        const elapsed = Date.now() - prev.hoverStartTime;
        const progress = Math.min(1, elapsed / HOVER_DELAY_MS);

        return {
          ...prev,
          progress,
        };
      });
    }, PROGRESS_UPDATE_INTERVAL_MS);

    // Start hover delay timer
    hoverTimerRef.current = setTimeout(() => {
      setState(prev => {
        if (prev.status !== 'hovering') {
          return prev;
        }

        return {
          ...prev,
          status: 'merge_ready',
          progress: 1,
        };
      });

      // Stop progress animation once merge_ready is reached
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }, HOVER_DELAY_MS);
  }, [clearTimers]);

  /**
   * Leave the current merge target
   * Resets to dragging state and clears timers
   */
  const leaveTarget = useCallback(() => {
    clearTimers();

    setState(prev => {
      // Only reset if we were hovering or merge_ready
      if (prev.status !== 'hovering' && prev.status !== 'merge_ready') {
        return prev;
      }

      return {
        ...prev,
        status: 'dragging',
        targetIconId: null,
        hoverStartTime: null,
        position: null,
        progress: 0,
      };
    });
  }, [clearTimers]);

  /**
   * Confirm the merge operation
   * Returns merge info if merge_ready, otherwise returns null
   */
  const confirmMerge = useCallback((): { sourceId: string; targetId: string; position: { x: number; y: number } } | null => {
    const currentState = state;

    // Can only confirm when merge is ready
    if (currentState.status !== 'merge_ready') {
      return null;
    }

    // Validate all required fields are present
    if (!currentState.sourceIconId || !currentState.targetIconId || !currentState.position) {
      return null;
    }

    const result = {
      sourceId: currentState.sourceIconId,
      targetId: currentState.targetIconId,
      position: currentState.position,
    };

    // Reset state after confirmation
    clearTimers();
    setState(initialState);

    return result;
  }, [state, clearTimers]);

  /**
   * Cancel the drag operation entirely
   * Resets to initial idle state
   */
  const cancelDrag = useCallback(() => {
    clearTimers();
    setState(initialState);
  }, [clearTimers]);

  /**
   * Check if a specific icon is the current merge target
   * Useful for highlighting the target icon during hover
   */
  const isMergeTarget = useCallback((iconId: string): boolean => {
    return (
      (state.status === 'hovering' || state.status === 'merge_ready') &&
      state.targetIconId === iconId
    );
  }, [state.status, state.targetIconId]);

  /**
   * Check if merge is ready to be confirmed
   */
  const isMergeReady = state.status === 'merge_ready';

  return {
    state,
    startDrag,
    enterTarget,
    leaveTarget,
    confirmMerge,
    cancelDrag,
    isMergeTarget,
    isMergeReady,
  };
}
