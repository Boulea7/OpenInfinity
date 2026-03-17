/**
 * Search Store Module
 *
 * Centralized state management for the search bar input value.
 * This store exists to prevent unnecessary re-renders in parent components
 * when the search query changes during typing.
 *
 * By isolating the search query state, only the search bar component
 * and components that explicitly subscribe to the query will re-render
 * when the user types.
 *
 * @module stores/searchStore
 *
 * @example
 * ```tsx
 * import { useSearchStore } from '@/stores/searchStore';
 *
 * function SearchBar() {
 *   const { query, setQuery, clearQuery } = useSearchStore();
 *
 *   const handleSubmit = () => {
 *     // Perform search with query
 *     console.log('Searching for:', query);
 *     // Optionally clear after search
 *     clearQuery();
 *   };
 *
 *   return (
 *     <input
 *       value={query}
 *       onChange={(e) => setQuery(e.target.value)}
 *       onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
 *     />
 *   );
 * }
 * ```
 */

import { create } from 'zustand';

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Search Store State and Actions
 *
 * Combined interface for the search store's state and actions.
 * Kept simple intentionally as this store has a single responsibility.
 *
 * @interface SearchState
 */
interface SearchState {
  /**
   * Current search query string.
   * Empty string when no search is in progress.
   */
  query: string;

  /**
   * Updates the search query.
   * @param query - New query string to set
   */
  setQuery: (query: string) => void;

  /**
   * Clears the search query to empty string.
   * Convenience method for resetting the search bar.
   */
  clearQuery: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Store Implementation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Search Store
 *
 * Minimal Zustand store for managing search query state.
 * Does not persist to storage as search queries are ephemeral.
 *
 * @example
 * ```tsx
 * // In a React component
 * const { query, setQuery } = useSearchStore();
 *
 * // Outside React (e.g., in event handlers)
 * useSearchStore.getState().clearQuery();
 * ```
 */
export const useSearchStore = create<SearchState>((set) => ({
  // ─────────────────────────────────────────────────────────────────────────────
  // Initial State
  // ─────────────────────────────────────────────────────────────────────────────

  /** Initial query is empty */
  query: '',

  // ─────────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Sets the search query to the provided value.
   * Triggers re-render only in components subscribed to query.
   */
  setQuery: (query: string) => set({ query }),

  /**
   * Resets the search query to empty string.
   * Useful after search submission or when clearing the search bar.
   */
  clearQuery: () => set({ query: '' }),
}));
