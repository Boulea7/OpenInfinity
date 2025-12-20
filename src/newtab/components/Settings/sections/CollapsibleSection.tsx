/**
 * CollapsibleSection - A collapsible container for settings sections
 * Features:
 * - Square corners (as per design spec)
 * - +/- toggle button
 * - Smooth height animation
 * - Persist collapse state via settingsStore
 */

import React, { useRef, useEffect, useState } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';

export interface CollapsibleSectionProps {
  /** Unique section ID for state persistence */
  id: string;
  /** Section title displayed in header */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Section content */
  children: React.ReactNode;
  /** Custom class name for the section */
  className?: string;
  /** Whether to show divider at bottom */
  showDivider?: boolean;
  /** Default collapsed state (only used if no persisted state) */
  defaultCollapsed?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  subtitle,
  children,
  className = '',
  showDivider: _showDivider = true,
  defaultCollapsed = false,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get collapse state from store
  const collapsedSections = useSettingsStore((state) => state.collapsedSections);
  const toggleSectionCollapse = useSettingsStore((state) => state.toggleSectionCollapse);

  // Determine if section is collapsed (use persisted state or default)
  const isCollapsed = collapsedSections[id] ?? defaultCollapsed;

  // Measure content height on mount and when content changes
  useEffect(() => {
    const measureHeight = () => {
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        setContentHeight(height);
        setIsInitialized(true);
      }
    };

    // Initial measurement
    measureHeight();

    // Observe content changes for dynamic height updates
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        measureHeight();
      });

      resizeObserver.observe(contentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [children]);

  // Handle toggle
  const handleToggle = () => {
    toggleSectionCollapse(id);
  };

  return (
    <div
      className={`
        bg-white dark:bg-gray-900
        rounded-xl
        ${className}
      `}
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={handleToggle}
        className="
          w-full flex items-center justify-between
          px-5 py-4
          text-left
          rounded-xl
          hover:bg-gray-50 dark:hover:bg-gray-800/50
          transition-colors duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400
        "
        aria-expanded={!isCollapsed}
        aria-controls={`section-content-${id}`}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Toggle icon */}
        <div className="
          ml-4 flex-shrink-0
          w-6 h-6 flex items-center justify-center
          text-gray-400 dark:text-gray-500
          text-lg font-light select-none
        ">
          {isCollapsed ? '+' : '—'}
        </div>
      </button>

      {/* Content - collapsible */}
      <div
        ref={wrapperRef}
        id={`section-content-${id}`}
        className={`overflow-hidden ${isInitialized ? 'transition-all duration-300 ease-in-out' : ''}`}
        style={{
          maxHeight: isCollapsed ? 0 : contentHeight,
          opacity: isCollapsed ? 0 : 1,
        }}
      >
        <div ref={contentRef} className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
