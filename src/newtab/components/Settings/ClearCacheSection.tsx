/**
 * Clear Cache Component
 * Allows users to selectively clear different types of cache
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, RefreshCw } from 'lucide-react';
import {
  clearWeatherCache,
  clearGeocodeCache,
  clearSearchEngineIconCache,
  clearAllCaches,
  getCacheStats,
  type CacheStats,
} from '../../services/cacheManager';
import { cn } from '../../utils';

export function ClearCacheSection() {
  const { t } = useTranslation();
  const [isClearing, setIsClearing] = useState(false);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [lastCleared, setLastCleared] = useState<string | null>(null);

  // Load cache stats on mount
  useEffect(() => {
    void getCacheStats().then(setStats);
  }, []);

  const handleClearCache = async (type: 'weather' | 'geocode' | 'searchIcons' | 'all') => {
    setIsClearing(true);
    try {
      switch (type) {
        case 'weather':
          await clearWeatherCache();
          setLastCleared(t('settings.cache.weatherCache'));
          break;
        case 'geocode':
          clearGeocodeCache();
          setLastCleared(t('settings.cache.geocodeCache'));
          break;
        case 'searchIcons':
          clearSearchEngineIconCache();
          setLastCleared(t('settings.cache.searchEngineIconCache'));
          break;
        case 'all':
          await clearAllCaches();
          setLastCleared(t('settings.cache.allCaches'));
          break;
      }

      // Refresh stats
      const newStats = await getCacheStats();
      setStats(newStats);

      // Clear success message after 3 seconds
      setTimeout(() => setLastCleared(null), 3000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
        {t('settings.cache.title')}
      </h4>

      {/* Cache Statistics */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">{t('settings.cache.weatherCache')}:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{stats.weatherCache}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">{t('settings.cache.searchEngineIconCache')}:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{stats.searchEngineIconCache}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">{t('settings.cache.geocodeCache')}:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{stats.geocodeCache}</span>
          </div>
        </div>
      )}

      {/* Clear Cache Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleClearCache('weather')}
          disabled={isClearing}
          className={cn(
            'px-3 py-2 text-sm rounded-lg',
            'bg-gray-100 dark:bg-gray-700',
            'text-gray-700 dark:text-gray-300',
            'hover:bg-gray-200 dark:hover:bg-gray-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            'flex items-center justify-center gap-2'
          )}
        >
          <Trash2 className="w-4 h-4" />
          {t('settings.cache.clearWeather')}
        </button>

        <button
          onClick={() => handleClearCache('geocode')}
          disabled={isClearing}
          className={cn(
            'px-3 py-2 text-sm rounded-lg',
            'bg-gray-100 dark:bg-gray-700',
            'text-gray-700 dark:text-gray-300',
            'hover:bg-gray-200 dark:hover:bg-gray-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            'flex items-center justify-center gap-2'
          )}
        >
          <Trash2 className="w-4 h-4" />
          {t('settings.cache.clearGeocode')}
        </button>

        <button
          onClick={() => handleClearCache('searchIcons')}
          disabled={isClearing}
          className={cn(
            'px-3 py-2 text-sm rounded-lg',
            'bg-gray-100 dark:bg-gray-700',
            'text-gray-700 dark:text-gray-300',
            'hover:bg-gray-200 dark:hover:bg-gray-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            'flex items-center justify-center gap-2'
          )}
        >
          <Trash2 className="w-4 h-4" />
          {t('settings.cache.clearSearchIcons')}
        </button>

        <button
          onClick={() => handleClearCache('all')}
          disabled={isClearing}
          className={cn(
            'px-3 py-2 text-sm rounded-lg',
            'bg-red-500 dark:bg-red-600',
            'text-white',
            'hover:bg-red-600 dark:hover:bg-red-700',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            'flex items-center justify-center gap-2'
          )}
        >
          <RefreshCw className="w-4 h-4" />
          {t('settings.cache.clearAll')}
        </button>
      </div>

      {/* Success Message */}
      {lastCleared && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            {t('settings.cache.cleared')}: {lastCleared}
          </p>
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('settings.cache.description')}
      </p>
    </div>
  );
}
