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

// Settings icon
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
      <circle cx="24" cy="24" r="6" fill="#F3F4F6" stroke="#6B7280" strokeWidth="2" />
      <path
        d="M24 4L26.5 10H21.5L24 4ZM24 44L21.5 38H26.5L24 44ZM4 24L10 21.5V26.5L4 24ZM44 24L38 26.5V21.5L44 24ZM8.5 8.5L14 12L12 14L8.5 8.5ZM39.5 39.5L34 36L36 34L39.5 39.5ZM39.5 8.5L36 14L34 12L39.5 8.5ZM8.5 39.5L12 34L14 36L8.5 39.5Z"
        fill="#9CA3AF"
      />
      <circle cx="24" cy="24" r="16" stroke="#6B7280" strokeWidth="2" fill="none" strokeDasharray="4 4" />
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

// OpenInfinity icon
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
      <defs>
        <linearGradient id="infinityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <path
        d="M14 24C14 20 10 16 6 16C2 16 -2 20 -2 24C-2 28 2 32 6 32C10 32 14 28 14 24ZM14 24C14 20 18 16 24 16C30 16 34 20 34 24M34 24C34 28 38 32 42 32C46 32 50 28 50 24C50 20 46 16 42 16C38 16 34 20 34 24Z"
        stroke="url(#infinityGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="24" cy="24" r="3" fill="#F97316" />
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
