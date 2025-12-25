/**
 * PermissionGate Component
 *
 * A reusable component that shows a permission request UI when
 * the required permissions are not granted. Only requests permissions
 * on user gesture (button click).
 */

import { useState, type ReactNode } from 'react';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils';

interface PermissionGateProps {
  /** Whether the required permission is granted */
  hasPermission: boolean;
  /** Permission name for display (e.g., "书签", "历史记录") */
  permissionName: string;
  /** Description of why the permission is needed */
  description?: string;
  /** Callback to request permission - must be called from user gesture */
  onRequestPermission: () => Promise<boolean>;
  /** Content to render when permission is granted */
  children: ReactNode;
  /** Optional icon to show */
  icon?: ReactNode;
  /** Optional className */
  className?: string;
}

export function PermissionGate({
  hasPermission,
  permissionName,
  description,
  onRequestPermission,
  children,
  icon,
  className,
}: PermissionGateProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setRequestStatus('idle');

    try {
      const granted = await onRequestPermission();
      setRequestStatus(granted ? 'success' : 'error');
    } catch (error) {
      console.error('Permission request failed:', error);
      setRequestStatus('error');
    } finally {
      setIsRequesting(false);
    }
  };

  // If permission is granted, render children
  if (hasPermission) {
    return <>{children}</>;
  }

  // Permission not granted - show request UI
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300',
      'min-h-[300px]', // Ensure reasonable height for centering
      className
    )}>
      {/* Icon Container with Zinc styling */}
      <div className={cn(
        "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300",
        "bg-zinc-100 dark:bg-zinc-800",
        "shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700"
      )}>
        {icon || <Lock className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />}
      </div>

      <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
        需要{permissionName}权限
      </h3>

      {description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-[280px] leading-relaxed">
          {description}
        </p>
      )}

      {/* Status Indicators */}
      <div className="min-h-[24px] mb-2">
        {requestStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-500 text-sm animate-in slide-in-from-bottom-2 fade-in">
            <AlertCircle className="w-4 h-4" />
            <span>授权被拒绝，请重试</span>
          </div>
        )}

        {requestStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-500 text-sm animate-in slide-in-from-bottom-2 fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>授权成功！</span>
          </div>
        )}
      </div>

      <button
        onClick={handleRequestPermission}
        disabled={isRequesting || requestStatus === 'success'}
        className={cn(
          'relative px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 min-w-[160px]',
          'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
          'hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:shadow-lg hover:-translate-y-0.5',
          'active:bg-zinc-950 dark:active:bg-zinc-300 active:translate-y-0 active:shadow-sm',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none',
          'focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900'
        )}
      >
        <span className={cn(
          "flex items-center justify-center gap-2",
          isRequesting ? "opacity-0" : "opacity-100"
        )}>
          {requestStatus === 'success' ? '即将跳转...' : `授权访问${permissionName}`}
        </span>

        {/* Loading Spinner Absolute Center */}
        {isRequesting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
          </div>
        )}
      </button>

      <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-6">
        您可以随时在浏览器设置中管理此权限
      </p>
    </div>
  );
}

export default PermissionGate;
