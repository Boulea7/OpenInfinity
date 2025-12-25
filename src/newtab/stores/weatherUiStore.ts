/**
 * Weather UI Store
 *
 * Manages the UI state for weather components, specifically the expand/collapse
 * state of CompactWeather. This allows the weather system icon to trigger
 * the expansion of the compact weather widget.
 */

import { create } from 'zustand';

interface WeatherUiState {
  // Whether the CompactWeather widget is expanded
  isExpanded: boolean;
}

interface WeatherUiActions {
  // Set the expanded state directly
  setExpanded: (expanded: boolean) => void;
  // Toggle the expanded state
  toggle: () => void;
}

export const useWeatherUiStore = create<WeatherUiState & WeatherUiActions>((set) => ({
  isExpanded: false,

  setExpanded: (expanded: boolean) => set({ isExpanded: expanded }),

  toggle: () => set((state) => ({ isExpanded: !state.isExpanded })),
}));
