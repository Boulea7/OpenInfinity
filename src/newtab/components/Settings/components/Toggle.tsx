/**
 * Toggle - Reusable toggle switch component for settings
 * Features:
 * - Pill-shaped toggle design
 * - Dark mode support
 * - Disabled state
 * - Accessible with ARIA attributes
 */

import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;  // Optional description text below label
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}) => (
  <div className={`flex items-center justify-between py-3 ${className}`}>
    <div className="flex flex-col">
      <span
        className={`text-sm ${
          disabled
            ? 'text-gray-400 dark:text-gray-500'
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {label}
      </span>
      {description && (
        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {description}
        </span>
      )}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${checked ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full
          bg-white dark:bg-gray-900
          transition-transform duration-200
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  </div>
);

export default Toggle;
