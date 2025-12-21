/**
 * Common type definitions for OpenInfinity
 */

// ==================== Widget Types ====================

/**
 * Base widget component props
 */
export interface BaseWidgetProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  className?: string;
  hideHeader?: boolean;
}

/**
 * Location data
 */
export interface LocationData {
  type: 'auto' | 'manual';
  name: string;
  latitude: number;
  longitude: number;
}

// ==================== Permission Types ====================

/**
 * Chrome extension permission type
 */
export type PermissionType = 'bookmarks' | 'history' | 'geolocation';

/**
 * Permission request
 */
export interface PermissionRequest {
  type: PermissionType;
  reason: string;
}

/**
 * Permission status
 */
export interface PermissionStatus {
  bookmarks: boolean;
  history: boolean;
  geolocation: boolean;
  lastChecked: number;
}

/**
 * Bookmark item
 */
export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  dateAdded: number;
  parentId?: string;
  favicon?: string;
}

/**
 * History item
 */
export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  lastVisitTime: number;
  visitCount: number;
  typedCount?: number;
  favicon?: string;
}

/**
 * History time range filter
 */
export type HistoryTimeRange = 'today' | 'week' | 'month' | 'all';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration
 */
export interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

/**
 * Filter operator
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';

/**
 * Filter configuration
 */
export interface FilterConfig<T> {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Position in grid
 */
export interface GridPosition {
  x: number;
  y: number;
  page?: number;
}

/**
 * Size dimensions
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Bounding box
 */
export interface BoundingBox extends GridPosition, Size { }

/**
 * Color with optional alpha
 */
export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * Gradient stop
 */
export interface GradientStop {
  color: string;
  position: number; // 0-100
}

/**
 * Animation easing types
 */
export type EasingType = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration: number; // ms
  easing: EasingType;
  delay?: number; // ms
}

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Modal configuration
 */
export interface ModalConfig {
  title?: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  onClose?: () => void;
}

/**
 * Context menu item
 */
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
  children?: ContextMenuItem[];
}

/**
 * Drag event data
 */
export interface DragEventData {
  id: string;
  type: 'icon' | 'folder';
  position: GridPosition;
}

/**
 * Drop target data
 */
export interface DropTargetData {
  id: string;
  type: 'icon' | 'folder' | 'grid' | 'trash';
  accepts: Array<'icon' | 'folder'>;
}

/**
 * Search result item
 */
export interface SearchResult {
  id: string;
  type: 'icon' | 'bookmark' | 'history' | 'suggestion';
  title: string;
  url?: string;
  description?: string;
  icon?: string;
  relevance: number;
}

/**
 * Weather data
 */
export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  forecast?: WeatherForecast[];
}

/**
 * Weather forecast
 */
export interface WeatherForecast {
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
}

/**
 * Calendar event
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  allDay: boolean;
  color?: string;
  description?: string;
}

/**
 * Backup data structure
 */
export interface BackupData {
  version: string;
  exportedAt: number;
  icons: unknown[];
  folders: unknown[];
  settings: Record<string, unknown>;
  wallpapers?: unknown[];
  todos?: unknown[];
  notes?: unknown[];
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  imported: {
    icons: number;
    folders: number;
    settings: number;
    wallpapers: number;
    todos: number;
    notes: number;
  };
  errors: string[];
}

/**
 * Permission status
 */
export interface PermissionStatus {
  bookmarks: boolean;
  history: boolean;
  geolocation: boolean;
}

/**
 * Storage usage info
 */
export interface StorageUsage {
  local: {
    used: number;
    quota: number;
  };
  sync: {
    used: number;
    quota: number;
  };
  indexedDB: {
    used: number;
  };
}
