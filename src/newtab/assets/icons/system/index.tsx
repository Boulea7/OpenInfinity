/**
 * System Icon Components Registry
 *
 * Provides React components for system icon SVGs with colorful designs.
 * Each icon has a white background with colored icon artwork.
 */

// SystemIconId type used for static type safety in SystemIconComponents mapping

interface IconProps {
  className?: string;
  size?: number;
}

// Weather icon - dynamic background (handled separately)
export function WeatherIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sun */}
      <circle cx="18" cy="18" r="7" fill="#FCD34D" />
      <path
        d="M18 6V9M18 27V30M30 18H27M9 18H6M27.5 8.5L25.5 10.5M10.5 25.5L8.5 27.5M27.5 27.5L25.5 25.5M10.5 10.5L8.5 8.5"
        stroke="#FCD34D"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Cloud - scaled to fit within viewBox */}
      <path
        d="M26 30C26 27.2 28.2 25 31 25C31.27 25 31.54 25.02 31.8 25.06C32.25 23.17 34 21.8 36.1 21.8C38.47 21.8 40.4 23.73 40.4 26.1C40.4 26.42 40.37 26.73 40.31 27.03C41.53 27.68 42.3 28.95 42.3 30.4C42.3 32.43 40.58 34.08 38.44 34.08H27.72C25.25 34.08 23.24 32.07 23.24 29.6C23.24 27.33 24.93 25.45 27.11 25.17"
        fill="white"
        stroke="#94A3B8"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// Todo icon
export function TodoIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="8" y="8" width="32" height="32" rx="4" fill="#EEF2FF" stroke="#6366F1" strokeWidth="2" />
      <path d="M14 18L18 22L26 14" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 26L18 30L26 22" stroke="#A5B4FC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="30" y1="18" x2="36" y2="18" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="26" x2="36" y2="26" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="34" x2="36" y2="34" stroke="#C7D2FE" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Notes icon
export function NotesIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="6" width="28" height="36" rx="3" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
      <line x1="16" y1="14" x2="32" y2="14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="20" x2="32" y2="20" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="26" x2="28" y2="26" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="32" x2="24" y2="32" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Settings icon - Grey gear design
export function SettingsIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="settingsGray" x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9CA3AF" />
          <stop offset="1" stopColor="#6B7280" />
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M38.97 22.14C38.58 21.16 38.07 20.24 37.45 19.39L39.02 17.82C39.46 17.38 39.46 16.67 39.02 16.23L36.23 13.44C35.79 13 35.08 13 34.64 13.44L33.07 15.01C32.21 14.39 31.29 13.88 30.31 13.49C29.87 11.73 28.31 10.45 26.45 10.45H21.55C19.69 10.45 18.13 11.73 17.69 13.48C16.71 13.87 15.79 14.38 14.93 15L13.36 13.43C12.92 12.99 12.21 12.99 11.77 13.43L8.98 16.22C8.54 16.66 8.54 17.37 8.98 17.81L10.55 19.38C9.93 20.23 9.42 21.15 9.03 22.13C7.27 22.56 6 24.13 6 26V28.74C6 30.6 7.27 32.17 9.03 32.6C9.42 33.58 9.94 34.5 10.56 35.36L8.98 36.94C8.54 37.38 8.54 38.09 8.98 38.53L11.77 41.32C12.21 41.76 12.92 41.76 13.36 41.32L14.94 39.74C15.8 40.37 16.73 40.9 17.72 41.31C18.16 43.06 19.72 44.34 21.58 44.34H26.48C28.34 44.34 29.9 43.06 30.33 41.31C31.32 40.9 32.25 40.37 33.11 39.74L34.69 41.31C35.13 41.75 35.84 41.75 36.28 41.31L39.07 38.52C39.51 38.08 39.51 37.37 39.07 36.93L37.49 35.35C38.11 34.49 38.63 33.57 39.02 32.59C40.78 32.16 42.04 30.59 42.04 28.73V26C42.04 24.14 40.78 22.57 39.02 22.14H38.97ZM24.02 31.87C21.53 31.87 19.52 29.85 19.52 27.37C19.52 24.88 21.53 22.86 24.02 22.86C26.5 22.86 28.52 24.88 28.52 27.37C28.52 29.85 26.5 31.87 24.02 31.87Z"
        fill="url(#settingsGray)"
      />
      <circle cx="24" cy="27.37" r="4.5" fill="white" />
    </svg>
  );
}

// Wallpaper icon
export function WallpaperIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="6" y="10" width="36" height="28" rx="3" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
      <circle cx="16" cy="20" r="4" fill="#FCD34D" />
      <path d="M6 32L16 24L24 30L34 20L42 28V35C42 36.657 40.657 38 39 38H9C7.343 38 6 36.657 6 35V32Z" fill="#34D399" />
      <path d="M16 24L24 30L34 20L42 28" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// OpenInfinity icon - Pure black infinity symbol
export function OpenInfinityIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5 30C19 30 21.5 27 24 24C26.5 21 29 18 33.5 18C38 18 41 20.5 41 24C41 27.5 38 30 33.5 30C29 30 26.5 27 24 24C21.5 21 19 18 14.5 18C10 18 7 20.5 7 24C7 27.5 10 30 14.5 30Z"
        stroke="#18181B"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Bookmarks icon
export function BookmarksIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 8H28C29.1 8 30 8.9 30 10V42L20 34L10 42V10C10 8.9 10.9 8 12 8Z"
        fill="#FEF3C7"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M18 12H36C37.1 12 38 12.9 38 14V42L28 34"
        stroke="#FCD34D"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M20 16L22 20L26 20.5L23 23.5L24 28L20 25.5L16 28L17 23.5L14 20.5L18 20L20 16Z" fill="#F59E0B" />
    </svg>
  );
}

// History icon
export function HistoryIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="16" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" />
      <path d="M24 14V24L30 28" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M8 24C8 15.16 15.16 8 24 8"
        stroke="#93C5FD"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <path d="M8 16V24H16" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Extensions icon
export function ExtensionsIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="8" y="20" width="14" height="14" rx="2" fill="#F3E8FF" stroke="#9333EA" strokeWidth="2" />
      <rect x="26" y="20" width="14" height="14" rx="2" fill="#E9D5FF" stroke="#A855F7" strokeWidth="2" />
      <rect x="8" y="8" width="14" height="8" rx="2" fill="#DDD6FE" stroke="#8B5CF6" strokeWidth="2" />
      <circle cx="33" cy="12" r="6" fill="#F3E8FF" stroke="#9333EA" strokeWidth="2" />
      <path d="M15 38V42C15 43.1 14.1 44 13 44H11C9.9 44 9 43.1 9 42V38" stroke="#9333EA" strokeWidth="2" />
    </svg>
  );
}

/**
 * System icon component mapping
 */
export const SystemIconComponents: Record<string, React.FC<IconProps>> = {
  weather: WeatherIcon,
  todo: TodoIcon,
  notes: NotesIcon,
  settings: SettingsIcon,
  wallpaper: WallpaperIcon,
  openinfinity: OpenInfinityIcon,
  bookmarks: BookmarksIcon,
  history: HistoryIcon,
  extensions: ExtensionsIcon,
};

/**
 * Get system icon component by name
 */
export function getSystemIconComponent(name: string): React.FC<IconProps> | null {
  return SystemIconComponents[name] || null;
}

/**
 * Weather background colors based on conditions
 */
export const WeatherBackgroundColors: Record<string, string> = {
  clear: 'from-yellow-400 to-orange-400',
  sunny: 'from-yellow-400 to-orange-400',
  cloudy: 'from-gray-400 to-gray-500',
  overcast: 'from-gray-500 to-gray-600',
  rain: 'from-blue-400 to-blue-600',
  snow: 'from-blue-100 to-blue-300',
  fog: 'from-gray-300 to-gray-400',
  storm: 'from-gray-600 to-gray-800',
  default: 'from-sky-400 to-blue-500',
};

/**
 * Get weather background gradient class
 */
export function getWeatherBackground(condition: string): string {
  const lower = condition.toLowerCase();

  for (const [key, value] of Object.entries(WeatherBackgroundColors)) {
    if (lower.includes(key)) {
      return value;
    }
  }

  return WeatherBackgroundColors.default;
}
