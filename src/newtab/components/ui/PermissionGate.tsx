/**
 * PermissionGate Component
 *
 * A reusable component that shows a permission request UI when
 * the required permissions are not granted. Only requests permissions
 * on user gesture (button click).
 */

import { useState } from 'react';
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
  children: React.ReactNode;
  /** Optional icon to show */
  icon?: React.ReactNode;
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
      'flex flex-col items-center justify-center p-8 text-center',
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        {icon || <Lock className="w-8 h-8 text-gray-400" />}
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        需要{permissionName}权限
      </h3>

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          {description}
        </p>
      )}

      {requestStatus === 'error' && (
        <div className="flex items-center gap-2 text-red-500 text-sm mb-4">
          <AlertCircle className="w-4 h-4" />
          <span>授权被拒绝，请重试或在扩展设置中授权</span>
        </div>
      )}

      {requestStatus === 'success' && (
        <div className="flex items-center gap-2 text-green-500 text-sm mb-4">
          <CheckCircle className="w-4 h-4" />
          <span>授权成功！</span>
        </div>
      )}

      <button
        onClick={handleRequestPermission}
        disabled={isRequesting}
        className={cn(
          'px-6 py-2.5 rounded-lg font-medium transition-all',
          'bg-blue-500 hover:bg-blue-600 text-white',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'dark:focus:ring-offset-gray-800'
        )}
      >
        {isRequesting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            授权中...
          </span>
        ) : (
          `授权访问${permissionName}`
        )}
      </button>

      <p className="text-xs text-gray-400 mt-4">
        您可以随时在浏览器设置中撤销此权限
      </p>
    </div>
  );
}

export default PermissionGate;
