/**
 * Search Store
 *
 * Centralized search state management to prevent
 * unnecessary re-renders in parent components.
 */

import { create } from 'zustand';

interface SearchState {
  query: string;
  setQuery: (query: string) => void;
  clearQuery: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  setQuery: (query: string) => set({ query }),
  clearQuery: () => set({ query: '' }),
}));
