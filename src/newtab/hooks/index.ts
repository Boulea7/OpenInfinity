/**
 * =====================================================================================
 *
 *    ██████╗ ██████╗ ███████╗███╗   ██╗    ██╗███╗   ██╗███████╗██╗███╗   ██╗██╗████████╗██╗   ██╗
 *   ██╔═══██╗██╔══██╗██╔════╝████╗  ██║    ██║████╗  ██║██╔════╝██║████╗  ██║██║╚══██╔══╝╚██╗ ██╔╝
 *   ██║   ██║██████╔╝█████╗  ██╔██╗ ██║    ██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║██║   ██║    ╚████╔╝
 *   ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║    ██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║██║   ██║     ╚██╔╝
 *   ╚██████╔╝██║     ███████╗██║ ╚████║    ██║██║ ╚████║██║     ██║██║ ╚████║██║   ██║      ██║
 *    ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝    ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝      ╚═╝
 *
 *   OpenInfinity - Your Infinite New Tab Experience
 *
 * =====================================================================================
 *   Copyright (c) 2024-2026 OpenInfinity Team. All rights reserved.
 *   Licensed under the MIT License
 *   GitHub: https://github.com/OpenInfinity/OpenInfinity
 * =====================================================================================
 */

/**
 * @fileoverview Core Hooks Library - Reusable React Hooks Collection
 *
 * This module exports a comprehensive collection of reusable React hooks that provide
 * common functionality across the OpenInfinity application. The hooks are organized
 * into two categories:
 *
 * ## Widget-Specific Hooks (External Modules)
 *
 * These hooks are domain-specific and handle complex state management for widgets:
 * - {@link useTodos} - Todo list CRUD operations with priority management
 * - {@link useNotes} - Notes/memo functionality with persistence
 * - {@link useWeather} - Weather data fetching and caching
 * - {@link useBookmarks} - Chrome bookmarks integration
 * - {@link useHistory} - Browser history access and search
 * - {@link useFolderMerge} - Bookmark folder merging operations
 *
 * ## Utility Hooks (This Module)
 *
 * General-purpose hooks for common patterns:
 * - {@link useClickOutside} - Detect clicks outside an element
 * - {@link useKeyboard} - Keyboard shortcut handling
 * - {@link useLocalStorage} - LocalStorage with JSON serialization
 * - {@link useDebounce} - Debounce rapidly changing values
 * - {@link useThrottle} - Throttle function calls
 * - {@link useWindowSize} - Responsive window dimensions
 * - {@link useIntersectionObserver} - Viewport intersection detection
 * - {@link usePrevious} - Access previous render value
 * - {@link useMediaQuery} - CSS media query matching
 * - {@link useDarkMode} - Dark mode preference detection
 * - {@link useAsync} - Async operation state management
 * - {@link useClipboard} - Clipboard read/write operations
 *
 * ## Usage Example
 *
 * ```tsx
 * import {
 *   useClickOutside,
 *   useKeyboard,
 *   useDebounce,
 *   useTodos,
 * } from '@/hooks';
 *
 * function MyComponent() {
 *   const { todos, addTodo } = useTodos();
 *   const debouncedSearch = useDebounce(searchTerm, 300);
 *   const dropdownRef = useClickOutside(() => setOpen(false));
 *
 *   useKeyboard('Escape', () => setOpen(false));
 *
 *   return <div ref={dropdownRef}>...</div>;
 * }
 * ```
 *
 * @module hooks
 * @version 1.0.0
 * @author OpenInfinity Team
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// =============================================================================
// Widget-Specific Hook Exports
// =============================================================================

/**
 * Re-export widget-specific hooks from their dedicated modules.
 * These hooks handle complex domain-specific logic and state management.
 */
export { useTodos, type TodoPriority } from './useTodos';
export { useNotes } from './useNotes';
export { useWeather } from './useWeather';
export { useBookmarks } from './useBookmarks';
export { useHistory } from './useHistory';
export { useFolderMerge, type MergeStatus, type MergeState, type UseFolderMergeReturn } from './useFolderMerge';

// =============================================================================
// DOM Interaction Hooks
// =============================================================================

/**
 * Detects clicks outside of a referenced element.
 *
 * Useful for implementing dropdown menus, modals, popovers, and other
 * components that should close when clicking outside of them.
 *
 * @template T - The HTML element type (extends HTMLElement)
 * @param callback - Function to call when a click occurs outside the element.
 *                   Should be memoized with useCallback to prevent unnecessary re-subscriptions.
 *
 * @returns A ref object to attach to the target element
 *
 * @example Basic dropdown menu
 * ```tsx
 * function Dropdown({ onClose }) {
 *   const ref = useClickOutside<HTMLDivElement>(onClose);
 *
 *   return (
 *     <div ref={ref} className="dropdown-menu">
 *       <button>Option 1</button>
 *       <button>Option 2</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example With memoized callback
 * ```tsx
 * function Modal() {
 *   const [isOpen, setIsOpen] = useState(true);
 *
 *   // Memoize the callback to prevent re-subscriptions
 *   const handleClose = useCallback(() => setIsOpen(false), []);
 *   const modalRef = useClickOutside<HTMLDivElement>(handleClose);
 *
 *   if (!isOpen) return null;
 *   return <div ref={modalRef}>Modal Content</div>;
 * }
 * ```
 *
 * @remarks
 * - Uses `mousedown` event for immediate response (before `click`)
 * - The callback should be memoized to avoid re-creating event listeners
 * - Returns null-initialized ref that's safe to use before element mounts
 */
export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    /**
     * Handle mousedown events and check if click is outside the ref element.
     * Uses contains() to check if the click target is a descendant of the ref.
     */
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback]);

  return ref;
}

// =============================================================================
// Keyboard Interaction Hooks
// =============================================================================

/**
 * Configuration options for keyboard shortcut handling.
 *
 * @property ctrl - Require Ctrl key to be pressed
 * @property shift - Require Shift key to be pressed
 * @property alt - Require Alt key to be pressed
 * @property meta - Require Meta key (Cmd on Mac, Win on Windows) to be pressed
 * @property preventDefault - Prevent default browser behavior for the key
 */
interface UseKeyboardOptions {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  preventDefault?: boolean;
}

/**
 * Handles keyboard shortcuts with optional modifier keys.
 *
 * Sets up a global keyboard event listener that triggers the callback
 * when the specified key combination is pressed. Automatically cleans up
 * the listener when the component unmounts or dependencies change.
 *
 * @param key - The key to listen for (e.g., 'Escape', 'Enter', 'a')
 *              Case-insensitive comparison is used.
 * @param callback - Function to call when the key combination is pressed.
 *                   Receives the KeyboardEvent as an argument.
 * @param options - Configuration for modifier keys and behavior
 * @param options.ctrl - Require Ctrl key (default: false)
 * @param options.shift - Require Shift key (default: false)
 * @param options.alt - Require Alt key (default: false)
 * @param options.meta - Require Meta key (default: false)
 * @param options.preventDefault - Prevent default behavior (default: false)
 *
 * @example Simple escape handler
 * ```tsx
 * function Modal({ onClose }) {
 *   useKeyboard('Escape', onClose);
 *
 *   return <div>Modal Content</div>;
 * }
 * ```
 *
 * @example Save shortcut (Ctrl+S)
 * ```tsx
 * function Editor({ onSave }) {
 *   useKeyboard('s', onSave, { ctrl: true, preventDefault: true });
 *
 *   return <textarea>...</textarea>;
 * }
 * ```
 *
 * @example Multiple modifier keys (Ctrl+Shift+P)
 * ```tsx
 * function App() {
 *   useKeyboard('p', () => openCommandPalette(), {
 *     ctrl: true,
 *     shift: true,
 *     preventDefault: true,
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 *
 * @remarks
 * - Modifier keys are matched exactly: if `ctrl: true`, the Ctrl key MUST be pressed;
 *   if `ctrl: false` (default), the Ctrl key MUST NOT be pressed
 * - Key comparison is case-insensitive
 * - Uses `keydown` event for immediate response
 */
export function useKeyboard(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: UseKeyboardOptions = {}
): void {
  useEffect(() => {
    /**
     * Handle keydown events and check if the key combination matches.
     * Performs exact matching for all modifier keys.
     */
    function handleKeyDown(event: KeyboardEvent) {
      const matchesKey = event.key.toLowerCase() === key.toLowerCase();
      const matchesCtrl = options.ctrl ? event.ctrlKey : !event.ctrlKey;
      const matchesShift = options.shift ? event.shiftKey : !event.shiftKey;
      const matchesAlt = options.alt ? event.altKey : !event.altKey;
      const matchesMeta = options.meta ? event.metaKey : !event.metaKey;

      if (matchesKey && matchesCtrl && matchesShift && matchesAlt && matchesMeta) {
        if (options.preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, options.ctrl, options.shift, options.alt, options.meta, options.preventDefault]);
}

// =============================================================================
// Storage Hooks
// =============================================================================

/**
 * Synchronizes state with localStorage with automatic JSON serialization.
 *
 * Provides a useState-like API that persists data to localStorage. The value
 * is automatically serialized to JSON on write and parsed on read. Handles
 * errors gracefully by falling back to the initial value.
 *
 * @template T - The type of the stored value
 * @param key - The localStorage key to use for persistence
 * @param initialValue - The default value if no stored value exists
 *
 * @returns A tuple of [storedValue, setValue] similar to useState
 *
 * @example Basic usage
 * ```tsx
 * function Settings() {
 *   const [theme, setTheme] = useLocalStorage('theme', 'light');
 *
 *   return (
 *     <select value={theme} onChange={(e) => setTheme(e.target.value)}>
 *       <option value="light">Light</option>
 *       <option value="dark">Dark</option>
 *     </select>
 *   );
 * }
 * ```
 *
 * @example With complex objects
 * ```tsx
 * interface UserPrefs {
 *   fontSize: number;
 *   notifications: boolean;
 * }
 *
 * function Preferences() {
 *   const [prefs, setPrefs] = useLocalStorage<UserPrefs>('userPrefs', {
 *     fontSize: 14,
 *     notifications: true,
 *   });
 *
 *   return (
 *     <div>
 *       <input
 *         type="range"
 *         value={prefs.fontSize}
 *         onChange={(e) => setPrefs(prev => ({
 *           ...prev,
 *           fontSize: Number(e.target.value)
 *         }))}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * - Values are JSON serialized, so functions and circular references won't work
 * - Reading happens only on initial mount (not real-time sync across tabs)
 * - Errors during read/write are caught and logged to console
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Memoized setter that syncs to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Support functional updates like useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// =============================================================================
// Timing Hooks
// =============================================================================

/**
 * Debounces a rapidly changing value.
 *
 * Returns a debounced version of the input value that only updates after
 * the specified delay has passed without the value changing. Useful for
 * reducing API calls or expensive computations triggered by user input.
 *
 * @template T - The type of the value to debounce
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds
 *
 * @returns The debounced value
 *
 * @example Search input debouncing
 * ```tsx
 * function SearchBox() {
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery = useDebounce(query, 300);
 *
 *   // API call only triggers when user stops typing for 300ms
 *   useEffect(() => {
 *     if (debouncedQuery) {
 *       searchApi(debouncedQuery);
 *     }
 *   }, [debouncedQuery]);
 *
 *   return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
 * }
 * ```
 *
 * @example Filter with debouncing
 * ```tsx
 * function FilteredList({ items }) {
 *   const [filter, setFilter] = useState('');
 *   const debouncedFilter = useDebounce(filter, 200);
 *
 *   // Expensive filtering only runs after debounce
 *   const filtered = useMemo(
 *     () => items.filter(item => item.name.includes(debouncedFilter)),
 *     [items, debouncedFilter]
 *   );
 *
 *   return (
 *     <div>
 *       <input value={filter} onChange={(e) => setFilter(e.target.value)} />
 *       {filtered.map(item => <Item key={item.id} {...item} />)}
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * - The debounced value always lags behind the source value
 * - Changing the delay will reset the debounce timer
 * - Timer is properly cleaned up on unmount
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    // Clean up the timer if value or delay changes before it fires
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttles a callback function to execute at most once per delay period.
 *
 * Returns a throttled version of the callback that limits how often it can
 * be called. Unlike debounce, throttle ensures the function is called at
 * regular intervals if triggered repeatedly.
 *
 * @template T - The function type to throttle
 * @param callback - The function to throttle
 * @param delay - The minimum time between calls in milliseconds
 *
 * @returns A throttled version of the callback
 *
 * @example Throttled scroll handler
 * ```tsx
 * function InfiniteScroll() {
 *   const handleScroll = useThrottle((e) => {
 *     console.log('Scroll position:', window.scrollY);
 *   }, 100);
 *
 *   useEffect(() => {
 *     window.addEventListener('scroll', handleScroll);
 *     return () => window.removeEventListener('scroll', handleScroll);
 *   }, [handleScroll]);
 *
 *   return <div>Long content...</div>;
 * }
 * ```
 *
 * @example Throttled resize handler
 * ```tsx
 * function ResponsiveChart() {
 *   const handleResize = useThrottle(() => {
 *     redrawChart();
 *   }, 250);
 *
 *   useEffect(() => {
 *     window.addEventListener('resize', handleResize);
 *     return () => window.removeEventListener('resize', handleResize);
 *   }, [handleResize]);
 *
 *   return <canvas ref={chartRef} />;
 * }
 * ```
 *
 * @remarks
 * - Uses trailing edge: if called during delay, schedules execution after delay
 * - First call executes immediately if delay has passed
 * - Timeout is cleaned up on unmount
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  // Track when the function was last executed
  const lastRan = useRef(Date.now());
  // Store pending timeout for cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    ((...args) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRan.current;

      if (timeSinceLastRun >= delay) {
        // Enough time has passed, execute immediately
        lastRan.current = now;
        callback(...args);
      } else {
        // Schedule execution for when delay has passed
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          lastRan.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastRun);
      }
    }) as T,
    [callback, delay]
  );
}

// =============================================================================
// Window & Viewport Hooks
// =============================================================================

/**
 * Return type for useWindowSize hook.
 *
 * @property width - Current window inner width in pixels
 * @property height - Current window inner height in pixels
 */
interface WindowSize {
  width: number;
  height: number;
}

/**
 * Tracks the current window dimensions.
 *
 * Returns the current window width and height, automatically updating
 * when the window is resized. Useful for responsive layouts and
 * conditional rendering based on viewport size.
 *
 * @returns Object containing current window width and height
 *
 * @example Responsive layout
 * ```tsx
 * function ResponsiveNav() {
 *   const { width } = useWindowSize();
 *   const isMobile = width < 768;
 *
 *   return isMobile ? <MobileNav /> : <DesktopNav />;
 * }
 * ```
 *
 * @example Canvas sizing
 * ```tsx
 * function FullscreenCanvas() {
 *   const { width, height } = useWindowSize();
 *   const canvasRef = useRef<HTMLCanvasElement>(null);
 *
 *   useEffect(() => {
 *     if (canvasRef.current) {
 *       canvasRef.current.width = width;
 *       canvasRef.current.height = height;
 *     }
 *   }, [width, height]);
 *
 *   return <canvas ref={canvasRef} />;
 * }
 * ```
 *
 * @remarks
 * - Uses window.innerWidth and window.innerHeight
 * - Updates synchronously on resize (consider throttling for performance)
 * - Initial value is captured on mount
 */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    /**
     * Update state with current window dimensions on resize.
     */
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Observes when an element enters or leaves the viewport.
 *
 * Uses the Intersection Observer API to detect when a referenced element
 * becomes visible in the viewport. Useful for lazy loading, infinite scroll,
 * animations on scroll, and analytics tracking.
 *
 * @template T - The HTML element type (extends HTMLElement)
 * @param options - IntersectionObserver configuration options
 *
 * @returns A tuple of [ref, isIntersecting]
 *
 * @example Lazy loading images
 * ```tsx
 * function LazyImage({ src, alt }) {
 *   const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>();
 *   const [loaded, setLoaded] = useState(false);
 *
 *   useEffect(() => {
 *     if (isVisible && !loaded) {
 *       setLoaded(true);
 *     }
 *   }, [isVisible, loaded]);
 *
 *   return (
 *     <div ref={ref}>
 *       {loaded ? <img src={src} alt={alt} /> : <Placeholder />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Infinite scroll trigger
 * ```tsx
 * function InfiniteList({ items, loadMore }) {
 *   const [sentinelRef, isVisible] = useIntersectionObserver<HTMLDivElement>();
 *
 *   useEffect(() => {
 *     if (isVisible) {
 *       loadMore();
 *     }
 *   }, [isVisible, loadMore]);
 *
 *   return (
 *     <div>
 *       {items.map(item => <Item key={item.id} {...item} />)}
 *       <div ref={sentinelRef} className="sentinel" />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example With custom threshold
 * ```tsx
 * function AnimatedCard({ children }) {
 *   const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
 *     threshold: 0.5, // 50% visible before triggering
 *     rootMargin: '-50px',
 *   });
 *
 *   return (
 *     <div ref={ref} className={isVisible ? 'fade-in' : 'hidden'}>
 *       {children}
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * - The observer is set up when the element mounts and cleaned up on unmount
 * - Options changes will recreate the observer
 * - isIntersecting is false until the element is attached and observed
 */
export function useIntersectionObserver<T extends HTMLElement>(
  options?: IntersectionObserverInit
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Create observer with callback that updates intersection state
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isIntersecting];
}

// =============================================================================
// State History Hooks
// =============================================================================

/**
 * Returns the previous value of a variable from the last render.
 *
 * Useful for comparing current and previous values in effects, or for
 * implementing undo functionality. The value is stored in a ref that
 * persists across renders.
 *
 * @template T - The type of the tracked value
 * @param value - The current value to track
 *
 * @returns The value from the previous render, or undefined on first render
 *
 * @example Tracking value changes
 * ```tsx
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   const prevCount = usePrevious(count);
 *
 *   return (
 *     <div>
 *       <p>Current: {count}</p>
 *       <p>Previous: {prevCount ?? 'N/A'}</p>
 *       <button onClick={() => setCount(c => c + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Effect with comparison
 * ```tsx
 * function UserProfile({ userId }) {
 *   const prevUserId = usePrevious(userId);
 *
 *   useEffect(() => {
 *     if (prevUserId !== undefined && prevUserId !== userId) {
 *       // User changed, reset some state
 *       resetScrollPosition();
 *     }
 *   }, [userId, prevUserId]);
 *
 *   return <Profile userId={userId} />;
 * }
 * ```
 *
 * @remarks
 * - Returns undefined on the first render
 * - Uses a ref so doesn't cause re-renders
 * - Value is updated after render completes
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  // Update the ref with current value after render
  useEffect(() => {
    ref.current = value;
  }, [value]);

  // Return the previous value (from before the effect runs)
  return ref.current;
}

// =============================================================================
// Media Query Hooks
// =============================================================================

/**
 * Evaluates a CSS media query and tracks its match state.
 *
 * Returns true if the media query matches, false otherwise. Automatically
 * updates when the match state changes (e.g., window resize, orientation change).
 *
 * @param query - A valid CSS media query string (e.g., '(min-width: 768px)')
 *
 * @returns True if the media query matches, false otherwise
 *
 * @example Responsive breakpoint
 * ```tsx
 * function ResponsiveLayout() {
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 *   const isTablet = useMediaQuery('(min-width: 768px)');
 *
 *   if (isDesktop) return <DesktopLayout />;
 *   if (isTablet) return <TabletLayout />;
 *   return <MobileLayout />;
 * }
 * ```
 *
 * @example Feature detection
 * ```tsx
 * function TouchAwareComponent() {
 *   const hasHover = useMediaQuery('(hover: hover)');
 *   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 *
 *   return (
 *     <div className={hasHover ? 'with-hover-effects' : ''}>
 *       {!prefersReducedMotion && <AnimatedElement />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * - SSR-safe: returns false if window is undefined
 * - Uses matchMedia.addEventListener for efficient updates
 * - Query string should be valid CSS media query syntax
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // SSR safety check
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    /**
     * Update match state when media query result changes.
     */
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Detects if the user's system prefers dark mode.
 *
 * A convenience wrapper around useMediaQuery that specifically checks
 * for the 'prefers-color-scheme: dark' media query.
 *
 * @returns True if the user prefers dark mode, false otherwise
 *
 * @example Theme switching
 * ```tsx
 * function App() {
 *   const prefersDark = useDarkMode();
 *   const [theme, setTheme] = useState(prefersDark ? 'dark' : 'light');
 *
 *   // Sync with system preference
 *   useEffect(() => {
 *     setTheme(prefersDark ? 'dark' : 'light');
 *   }, [prefersDark]);
 *
 *   return (
 *     <ThemeProvider theme={theme}>
 *       <MainContent />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 *
 * @remarks
 * - Automatically updates when system preference changes
 * - Can be used as initial value for a theme state
 */
export function useDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

// =============================================================================
// Async Operation Hooks
// =============================================================================

/**
 * Return type for useAsync hook.
 *
 * @template T - The type of the async operation result
 * @property data - The resolved data, or null if not yet resolved
 * @property loading - Whether the async operation is in progress
 * @property error - The error if the operation failed, or null
 * @property execute - Function to manually trigger the async operation
 */
interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
}

/**
 * Manages state for async operations with loading and error handling.
 *
 * Provides a standardized way to handle async operations with automatic
 * loading state management and error capture. The async function can be
 * triggered manually via the returned execute function.
 *
 * @template T - The type of the async operation result
 * @param asyncFn - The async function to execute
 * @param deps - Dependency array for memoizing the execute function
 *
 * @returns Object containing data, loading, error states, and execute function
 *
 * @example Manual execution
 * ```tsx
 * function UserProfile({ userId }) {
 *   const { data: user, loading, error, execute } = useAsync(
 *     () => fetchUser(userId),
 *     [userId]
 *   );
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <div>
 *       {user && <Profile user={user} />}
 *       <button onClick={execute}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example With immediate execution
 * ```tsx
 * function DataTable() {
 *   const { data, loading, error, execute } = useAsync(
 *     () => fetchTableData(),
 *     []
 *   );
 *
 *   // Execute on mount
 *   useEffect(() => {
 *     execute();
 *   }, [execute]);
 *
 *   if (loading) return <TableSkeleton />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return <Table data={data} />;
 * }
 * ```
 *
 * @remarks
 * - Does NOT execute automatically - call execute() to start
 * - Error state is cleared when execute() is called
 * - asyncFn is stored in a ref to avoid adding it to execute deps
 */
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: unknown[] = []
): UseAsyncResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to always get the latest asyncFn without adding it to deps
  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;

  // Memoized execute function with provided deps
  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFnRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, execute };
}

// =============================================================================
// Clipboard Hooks
// =============================================================================

/**
 * Return type for useClipboard hook.
 *
 * @property copied - Whether content was recently copied (resets after 2s)
 * @property copy - Function to copy text to clipboard
 */
interface UseClipboardResult {
  copied: boolean;
  copy: (text: string) => Promise<void>;
}

/**
 * Provides clipboard copy functionality with feedback state.
 *
 * Uses the modern Clipboard API to copy text and provides a temporary
 * 'copied' state for UI feedback. The copied state automatically resets
 * after 2 seconds.
 *
 * @returns Object containing copied state and copy function
 *
 * @example Copy button with feedback
 * ```tsx
 * function CopyButton({ text }) {
 *   const { copied, copy } = useClipboard();
 *
 *   return (
 *     <button onClick={() => copy(text)}>
 *       {copied ? 'Copied!' : 'Copy'}
 *     </button>
 *   );
 * }
 * ```
 *
 * @example Code block with copy
 * ```tsx
 * function CodeBlock({ code }) {
 *   const { copied, copy } = useClipboard();
 *
 *   return (
 *     <div className="code-block">
 *       <pre>{code}</pre>
 *       <button
 *         className={copied ? 'success' : ''}
 *         onClick={() => copy(code)}
 *       >
 *         <ClipboardIcon />
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * - Uses navigator.clipboard API (requires HTTPS in production)
 * - copied state automatically resets after 2 seconds
 * - Handles errors gracefully (sets copied to false on failure)
 * - Timeout is properly cleaned up on unmount
 */
export function useClipboard(): UseClipboardResult {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup timeout on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Memoized copy function
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      // Clear any existing timeout
      clearTimeout(timeoutRef.current);
      // Reset copied state after 2 seconds
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  return { copied, copy };
}
