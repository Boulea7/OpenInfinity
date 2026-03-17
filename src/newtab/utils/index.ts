/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██████╗ ██████╗ ███████╗███╗   ██╗    ██╗███╗   ██╗███████╗██╗███╗   ██║
 * ║  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║    ██║████╗  ██║██╔════╝██║████╗  ██║
 * ║  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║    ██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║
 * ║  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║    ██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║
 * ║  ╚██████╔╝██║     ███████╗██║ ╚████║    ██║██║ ╚████║██║     ██║██║ ╚████║
 * ║   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝    ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══║
 * ║                                                                           ║
 * ║  OpenInfinity - Your Infinite New Tab Experience                          ║
 * ║                                                                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Copyright (c) 2024-2026 OpenInfinity Team. All rights reserved.          ║
 * ║  Licensed under the MIT License                                           ║
 * ║  GitHub: https://github.com/OpenInfinity/OpenInfinity                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Common Utility Functions
 *
 * This module provides a collection of commonly used utility functions
 * for the OpenInfinity extension. It includes helpers for:
 *
 * - CSS class management (Tailwind CSS integration)
 * - Function rate limiting (debounce, throttle)
 * - Date/time formatting with localization
 * - URL validation and manipulation
 * - Favicon URL generation
 * - File operations (base64 conversion, download)
 * - Clipboard operations
 * - Color utilities
 * - Number formatting
 *
 * @module utils/index
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getCurrentUiLanguage, getLocaleFromUiLanguage } from '../../shared/locale';

// ============================================================================
// CSS Class Utilities
// ============================================================================

/**
 * Merges Tailwind CSS classes with conflict resolution.
 *
 * Combines clsx for conditional class composition with tailwind-merge
 * for intelligent handling of Tailwind CSS class conflicts.
 * This ensures that later classes override earlier conflicting ones.
 *
 * @description Combines and deduplicates Tailwind CSS classes
 * @param {...ClassValue[]} inputs - Class values to merge (strings, objects, arrays)
 * @returns {string} The merged class string
 *
 * @example
 * ```tsx
 * // Basic usage
 * cn('px-2 py-1', 'px-4')
 * // Result: 'py-1 px-4' (px-4 overrides px-2)
 *
 * // Conditional classes
 * cn('base-class', isActive && 'active', { 'disabled': isDisabled })
 *
 * // In a component
 * <div className={cn(
 *   'flex items-center',
 *   variant === 'primary' && 'bg-blue-500',
 *   className
 * )}>
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Function Rate Limiting
// ============================================================================

/**
 * Creates a debounced version of a function.
 *
 * The debounced function delays invoking the original function until after
 * the specified delay has elapsed since the last time it was called.
 * Useful for handling rapid events like typing or window resizing.
 *
 * @description Delays function execution until after a pause in calls
 * @template T - The function type
 * @param {T} fn - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {(...args: Parameters<T>) => void} The debounced function
 *
 * @example
 * ```ts
 * // Debounce search input
 * const debouncedSearch = debounce((query: string) => {
 *   fetchSearchResults(query);
 * }, 300);
 *
 * // In an input handler
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 *
 * // Debounce window resize handler
 * const handleResize = debounce(() => {
 *   recalculateLayout();
 * }, 150);
 *
 * window.addEventListener('resize', handleResize);
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    // Clear any pending execution
    clearTimeout(timeoutId);
    // Schedule new execution after delay
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Creates a throttled version of a function.
 *
 * The throttled function will only execute at most once per specified
 * time limit, regardless of how many times it's called. Useful for
 * rate-limiting expensive operations during continuous events.
 *
 * @description Limits function execution to once per time period
 * @template T - The function type
 * @param {T} fn - The function to throttle
 * @param {number} limit - The minimum time between executions in milliseconds
 * @returns {(...args: Parameters<T>) => void} The throttled function
 *
 * @example
 * ```ts
 * // Throttle scroll handler
 * const throttledScroll = throttle(() => {
 *   updateScrollPosition();
 * }, 100);
 *
 * window.addEventListener('scroll', throttledScroll);
 *
 * // Throttle API calls
 * const throttledSync = throttle(async () => {
 *   await syncToServer();
 * }, 5000);
 *
 * document.addEventListener('input', throttledSync);
 * ```
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      // Reset throttle flag after limit period
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================================
// Date/Time Formatting
// ============================================================================

/**
 * Formats a date to a localized date string.
 *
 * Uses the current UI language setting to determine the locale
 * for formatting. Supports custom Intl.DateTimeFormat options.
 *
 * @description Formats date according to user's locale
 * @param {Date | number} date - The date to format (Date object or timestamp)
 * @param {Intl.DateTimeFormatOptions} [options] - Optional formatting options
 * @returns {string} The localized date string
 *
 * @example
 * ```ts
 * // Default format
 * formatDate(new Date())
 * // Result (en-US): "1/15/2024"
 * // Result (zh-CN): "2024/1/15"
 *
 * // With options
 * formatDate(Date.now(), {
 *   weekday: 'long',
 *   year: 'numeric',
 *   month: 'long',
 *   day: 'numeric'
 * })
 * // Result (en-US): "Monday, January 15, 2024"
 *
 * // From timestamp
 * formatDate(1705334400000)
 * ```
 */
export function formatDate(
  date: Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const locale = getLocaleFromUiLanguage(getCurrentUiLanguage());
  return d.toLocaleDateString(locale, options);
}

/**
 * Formats a date to a localized time string.
 *
 * Uses the current UI language setting to determine the locale.
 * Default format is 2-digit hour and minute (e.g., "14:30" or "2:30 PM").
 *
 * @description Formats time according to user's locale
 * @param {Date | number} date - The date to format (Date object or timestamp)
 * @param {Intl.DateTimeFormatOptions} [options] - Optional formatting options (merged with defaults)
 * @returns {string} The localized time string
 *
 * @example
 * ```ts
 * // Default format (2-digit hour:minute)
 * formatTime(new Date())
 * // Result (en-US): "2:30 PM"
 * // Result (zh-CN): "14:30"
 *
 * // With seconds
 * formatTime(Date.now(), { second: '2-digit' })
 * // Result: "2:30:45 PM"
 *
 * // 24-hour format
 * formatTime(Date.now(), { hour12: false })
 * // Result: "14:30"
 * ```
 */
export function formatTime(
  date: Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const locale = getLocaleFromUiLanguage(getCurrentUiLanguage());
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

/**
 * Formats a date as a relative time string.
 *
 * Returns human-readable relative time like "Just now", "5 minutes ago",
 * "2 hours ago", "3 days ago", etc. Falls back to absolute date format
 * for dates older than 7 days.
 *
 * Uses Intl.RelativeTimeFormat for localized output based on UI language.
 *
 * @description Formats date as relative time (e.g., "2 hours ago")
 * @param {Date | number} date - The date to format (Date object or timestamp)
 * @returns {string} The relative time string
 *
 * @example
 * ```ts
 * // Very recent (< 60 seconds)
 * formatRelativeTime(Date.now() - 30000)
 * // Result (en): "Just now"
 * // Result (zh): "刚刚"
 *
 * // Minutes ago
 * formatRelativeTime(Date.now() - 5 * 60 * 1000)
 * // Result: "5 minutes ago"
 *
 * // Hours ago
 * formatRelativeTime(Date.now() - 3 * 60 * 60 * 1000)
 * // Result: "3 hours ago"
 *
 * // Days ago
 * formatRelativeTime(Date.now() - 2 * 24 * 60 * 60 * 1000)
 * // Result: "2 days ago"
 *
 * // Older than 7 days - falls back to date format
 * formatRelativeTime(Date.now() - 10 * 24 * 60 * 60 * 1000)
 * // Result: "1/5/2024"
 * ```
 */
export function formatRelativeTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const locale = getLocaleFromUiLanguage(getCurrentUiLanguage());
  const lang = getCurrentUiLanguage();

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  // Less than 60 seconds - show "Just now"
  if (diffSec < 60) {
    return lang === 'zh' ? '刚刚' : 'Just now';
  }

  // Use RelativeTimeFormat for localized relative time
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  // Return appropriate relative time based on magnitude
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  if (diffHour < 24) return rtf.format(-diffHour, 'hour');
  if (diffDay < 7) return rtf.format(-diffDay, 'day');

  // Fallback to absolute date for older dates
  return formatDate(d);
}

// ============================================================================
// URL Utilities
// ============================================================================

/**
 * Validates if a string is a valid URL.
 *
 * Uses the URL constructor to check if the string can be parsed
 * as a valid URL. Returns false for invalid URLs instead of throwing.
 *
 * @description Checks if a string is a valid URL
 * @param {string} url - The string to validate
 * @returns {boolean} True if valid URL, false otherwise
 *
 * @example
 * ```ts
 * isValidUrl('https://example.com')       // true
 * isValidUrl('http://localhost:3000')     // true
 * isValidUrl('ftp://files.example.com')   // true
 * isValidUrl('example.com')               // false (no protocol)
 * isValidUrl('not a url')                 // false
 * isValidUrl('')                          // false
 * ```
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL by ensuring it has a protocol.
 *
 * - Returns empty string for empty input
 * - Preserves existing http:// or https:// protocols
 * - Preserves other protocols (ftp://, file://, etc.)
 * - Adds https:// to URLs without a protocol
 *
 * @description Ensures URL has a protocol (defaults to https://)
 * @param {string} url - The URL to normalize
 * @returns {string} The normalized URL with protocol
 *
 * @example
 * ```ts
 * normalizeUrl('example.com')           // 'https://example.com'
 * normalizeUrl('www.example.com')       // 'https://www.example.com'
 * normalizeUrl('https://example.com')   // 'https://example.com' (unchanged)
 * normalizeUrl('http://example.com')    // 'http://example.com' (unchanged)
 * normalizeUrl('ftp://files.com')       // 'ftp://files.com' (unchanged)
 * normalizeUrl('')                      // ''
 * ```
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';

  // Already has http:// or https:// protocol
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Has other protocol (ftp://, file://, chrome://, etc.)
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return url;
  }

  // Add https by default for protocol-less URLs
  return `https://${url}`;
}

/**
 * Extracts the domain (hostname) from a URL.
 *
 * Normalizes the URL first to handle protocol-less inputs.
 * Returns the original string if URL parsing fails.
 *
 * @description Extracts hostname from a URL string
 * @param {string} url - The URL to extract domain from
 * @returns {string} The domain/hostname, or original string on failure
 *
 * @example
 * ```ts
 * extractDomain('https://www.example.com/path')  // 'www.example.com'
 * extractDomain('example.com/path')              // 'example.com'
 * extractDomain('https://sub.domain.com:8080')   // 'sub.domain.com'
 * extractDomain('invalid')                       // 'invalid' (fallback)
 * ```
 */
export function extractDomain(url: string): string {
  try {
    const normalized = normalizeUrl(url);
    const urlObj = new URL(normalized);
    return urlObj.hostname;
  } catch {
    // Return original string if URL parsing fails
    return url;
  }
}

// ============================================================================
// Favicon URL Generators
// ============================================================================

/**
 * Generates a favicon URL using DuckDuckGo's favicon service.
 *
 * DuckDuckGo provides a free, reliable favicon service that doesn't
 * require API keys. Note: The size parameter is accepted but ignored
 * as DuckDuckGo doesn't support custom sizes.
 *
 * @description Gets favicon URL from DuckDuckGo service
 * @param {string} url - The URL to get favicon for
 * @param {number} [_size=64] - Size parameter (unused, for API compatibility)
 * @returns {string} The DuckDuckGo favicon URL
 *
 * @example
 * ```ts
 * getFaviconUrl('https://github.com')
 * // Result: 'https://icons.duckduckgo.com/ip3/github.com.ico'
 *
 * // In an img tag
 * <img src={getFaviconUrl(website.url)} alt="favicon" />
 * ```
 */
export function getFaviconUrl(url: string, _size: number = 64): string {
  const domain = extractDomain(url);
  // DuckDuckGo favicon service - free, no API key needed
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

/**
 * Generates a high-quality logo URL using Clearbit's Logo API.
 *
 * Clearbit provides high-resolution company logos in SVG/PNG format.
 * Returns empty string if domain extraction fails (safety fallback).
 *
 * @description Gets high-quality company logo from Clearbit
 * @param {string} url - The URL to get logo for
 * @param {number} [size=256] - Logo size in pixels
 * @returns {string} The Clearbit logo URL, or empty string on failure
 *
 * @example
 * ```ts
 * getClearbitLogoUrl('https://github.com')
 * // Result: 'https://logo.clearbit.com/github.com?size=256'
 *
 * getClearbitLogoUrl('https://google.com', 128)
 * // Result: 'https://logo.clearbit.com/google.com?size=128'
 *
 * getClearbitLogoUrl('invalid')
 * // Result: '' (empty string for invalid input)
 * ```
 */
export function getClearbitLogoUrl(url: string, size: number = 256): string {
  const domain = extractDomain(url);
  // Return empty string if domain extraction failed
  if (!domain || domain === url) return '';
  return `https://logo.clearbit.com/${domain}?size=${size}`;
}

/**
 * Generates a favicon URL using Google's favicon service.
 *
 * Google's service supports custom sizes and provides good quality
 * favicons. Default size is 256px for Retina display support (2x scaling).
 *
 * @description Gets favicon URL from Google's service with size support
 * @param {string} url - The URL to get favicon for
 * @param {number} [size=256] - Favicon size in pixels (supports various sizes)
 * @returns {string} The Google favicon URL
 *
 * @example
 * ```ts
 * getGoogleFaviconUrl('https://github.com')
 * // Result: 'https://www.google.com/s2/favicons?domain=github.com&sz=256'
 *
 * getGoogleFaviconUrl('https://google.com', 32)
 * // Result: 'https://www.google.com/s2/favicons?domain=google.com&sz=32'
 *
 * // For high-DPI displays
 * const size = window.devicePixelRatio > 1 ? 64 : 32;
 * const faviconUrl = getGoogleFaviconUrl(url, size);
 * ```
 */
export function getGoogleFaviconUrl(url: string, size: number = 256): string {
  const domain = extractDomain(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Converts a File object to a base64 data URL string.
 *
 * Uses FileReader to asynchronously read the file and convert it
 * to a data URL format suitable for use in img src attributes or storage.
 *
 * @description Converts File to base64 data URL
 * @param {File} file - The file to convert
 * @returns {Promise<string>} A promise resolving to the base64 data URL
 * @throws {Error} If file reading fails
 *
 * @example
 * ```ts
 * // In a file input handler
 * const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *   const file = e.target.files?.[0];
 *   if (file) {
 *     const base64 = await fileToBase64(file);
 *     setImageSrc(base64);
 *   }
 * };
 *
 * // Result format: 'data:image/png;base64,iVBORw0KGgo...'
 * ```
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Downloads data as a file to the user's device.
 *
 * Creates a temporary blob URL, triggers a download via a hidden link,
 * and cleans up resources afterwards. Supports both string data and Blob objects.
 *
 * @description Triggers browser download of data as a file
 * @param {string | Blob} data - The data to download (string or Blob)
 * @param {string} filename - The filename for the download
 * @param {string} [type='application/json'] - MIME type for string data
 * @returns {void}
 *
 * @example
 * ```ts
 * // Download JSON data
 * downloadFile(
 *   JSON.stringify(config, null, 2),
 *   'config.json',
 *   'application/json'
 * );
 *
 * // Download text file
 * downloadFile('Hello, World!', 'hello.txt', 'text/plain');
 *
 * // Download existing Blob
 * const blob = new Blob([imageData], { type: 'image/png' });
 * downloadFile(blob, 'image.png');
 *
 * // Download backup data
 * downloadFile(backupJson, `backup-${Date.now()}.json`);
 * ```
 */
export function downloadFile(
  data: string | Blob,
  filename: string,
  type: string = 'application/json'
): void {
  // Convert string to Blob if necessary
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data;

  // Create temporary URL for the blob
  const url = URL.createObjectURL(blob);

  // Create hidden link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Clipboard Operations
// ============================================================================

/**
 * Copies text to the system clipboard.
 *
 * Uses the modern Clipboard API when available, with a fallback
 * to the legacy execCommand method for older browsers.
 *
 * @description Copies text to clipboard with fallback support
 * @param {string} text - The text to copy
 * @returns {Promise<boolean>} A promise resolving to true if successful, false otherwise
 *
 * @example
 * ```ts
 * // Basic usage
 * const success = await copyToClipboard('Hello, World!');
 * if (success) {
 *   showToast('Copied to clipboard!');
 * }
 *
 * // Copy URL
 * await copyToClipboard(window.location.href);
 *
 * // In a button handler
 * <button onClick={() => copyToClipboard(shareLink)}>
 *   Copy Link
 * </button>
 * ```
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Try modern Clipboard API first
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers or restricted contexts
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Position off-screen to avoid visual flash
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Pauses execution for a specified duration.
 *
 * Creates a promise that resolves after the specified delay.
 * Useful for adding delays in async/await code or for testing.
 *
 * @description Async sleep/delay function
 * @param {number} ms - The duration to sleep in milliseconds
 * @returns {Promise<void>} A promise that resolves after the delay
 *
 * @example
 * ```ts
 * // Add delay between operations
 * await doFirstThing();
 * await sleep(1000); // Wait 1 second
 * await doSecondThing();
 *
 * // Polling with delay
 * while (condition) {
 *   await checkStatus();
 *   await sleep(500);
 * }
 *
 * // Animation delay
 * setVisible(true);
 * await sleep(300);
 * setAnimating(false);
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Generates a random hex color string.
 *
 * Produces a valid 6-character hex color code prefixed with #.
 * Useful for generating placeholder colors or random theming.
 *
 * @description Generates a random hex color code
 * @returns {string} A random hex color string (e.g., '#a3f2c1')
 *
 * @example
 * ```ts
 * const color = randomColor();
 * // Result: '#a3f2c1' (random)
 *
 * // Generate random background colors
 * const tags = items.map(item => ({
 *   ...item,
 *   color: item.color || randomColor()
 * }));
 * ```
 */
export function randomColor(): string {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
}

/**
 * Determines if a hex color is light or dark.
 *
 * Uses the perceived brightness formula (ITU-R BT.601) to calculate
 * whether a color appears light or dark to human eyes. Useful for
 * determining appropriate text color for a given background.
 *
 * Formula: brightness = (R * 299 + G * 587 + B * 114) / 1000
 *
 * @description Checks if a color is perceptually light
 * @param {string} color - The hex color string (with or without #)
 * @returns {boolean} True if the color is light, false if dark
 *
 * @example
 * ```ts
 * isLightColor('#ffffff')  // true (white)
 * isLightColor('#000000')  // false (black)
 * isLightColor('#ff0000')  // false (red)
 * isLightColor('#ffff00')  // true (yellow)
 *
 * // Choose text color based on background
 * const textColor = isLightColor(bgColor) ? '#000000' : '#ffffff';
 *
 * // In styles
 * <div style={{
 *   backgroundColor: tagColor,
 *   color: isLightColor(tagColor) ? 'black' : 'white'
 * }}>
 * ```
 */
export function isLightColor(color: string): boolean {
  // Remove # prefix if present
  const hex = color.replace('#', '');

  // Parse RGB components
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate perceived brightness using ITU-R BT.601 formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Threshold of 128 (half of 256) for light/dark distinction
  return brightness > 128;
}

// ============================================================================
// Number Utilities
// ============================================================================

/**
 * Clamps a number between a minimum and maximum value.
 *
 * Ensures the value stays within the specified bounds.
 * Equivalent to: Math.min(Math.max(value, min), max)
 *
 * @description Restricts a number to a specified range
 * @param {number} value - The value to clamp
 * @param {number} min - The minimum allowed value
 * @param {number} max - The maximum allowed value
 * @returns {number} The clamped value
 *
 * @example
 * ```ts
 * clamp(5, 0, 10)    // 5 (within range)
 * clamp(-5, 0, 10)   // 0 (below min)
 * clamp(15, 0, 10)   // 10 (above max)
 *
 * // Clamp slider value
 * const volume = clamp(userInput, 0, 100);
 *
 * // Clamp position within bounds
 * const x = clamp(mouseX, 0, containerWidth);
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Formats a byte count as a human-readable string.
 *
 * Converts bytes to the most appropriate unit (Bytes, KB, MB, GB)
 * with the specified number of decimal places.
 *
 * @description Converts bytes to human-readable size string
 * @param {number} bytes - The number of bytes to format
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} The formatted size string (e.g., '1.5 MB')
 *
 * @example
 * ```ts
 * formatBytes(0)           // '0 Bytes'
 * formatBytes(1024)        // '1 KB'
 * formatBytes(1536, 1)     // '1.5 KB'
 * formatBytes(1048576)     // '1 MB'
 * formatBytes(1073741824)  // '1 GB'
 *
 * // Display storage usage
 * const usedSpace = formatBytes(storageData.used);
 * const totalSpace = formatBytes(storageData.total);
 * console.log(`Used: ${usedSpace} / ${totalSpace}`);
 * ```
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  // Calculate appropriate unit index
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Format with specified decimal places
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
