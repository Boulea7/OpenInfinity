/**
 * CitySelector Component
 * Searchable dropdown for selecting a city for weather location
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, ChevronDown, X, Check } from 'lucide-react';
import { type City, searchCities } from '../../../data/cities';
import { cn } from '../../../utils';

interface CitySelectorProps {
  value?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  };
  onChange: (city: City) => void;
  className?: string;
}

export const CitySelector: React.FC<CitySelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isZh = i18n.language === 'zh';

  // Filter cities based on search query
  const filteredCities = useMemo(() => {
    return searchCities(searchQuery, 30);
  }, [searchQuery]);

  // Group cities by region for better organization
  const groupedCities = useMemo(() => {
    const cnCities = filteredCities.filter(c => c.region === 'cn');
    const intlCities = filteredCities.filter(c => c.region === 'intl');
    return { cnCities, intlCities };
  }, [filteredCities]);

  // Get display name for current value
  const displayName = useMemo(() => {
    if (!value?.name && !value?.latitude) return '';
    return value.name || `${value.latitude?.toFixed(2)}, ${value.longitude?.toFixed(2)}`;
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (city: City) => {
    onChange(city);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const renderCityItem = (city: City) => {
    const isSelected = value?.latitude === city.latitude && value?.longitude === city.longitude;
    const cityName = isZh ? city.name : city.nameEn;
    const countryName = isZh ? city.country : city.countryEn;

    return (
      <button
        key={city.id}
        type="button"
        onClick={() => handleSelect(city)}
        className={cn(
          'w-full px-3 py-2.5 text-left flex items-center gap-3',
          'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
          'border-b border-gray-100 dark:border-gray-800 last:border-b-0',
          isSelected && 'bg-blue-50 dark:bg-blue-900/20'
        )}
      >
        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {cityName}
            </span>
            {!isZh && city.name !== city.nameEn && (
              <span className="text-xs text-gray-400 truncate">
                {city.name}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {countryName}
          </span>
        </div>
        {isSelected && (
          <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
        )}
      </button>
    );
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-3 py-2.5 rounded-lg text-left',
          'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          'flex items-center gap-2 transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-700/50',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
          isOpen && 'ring-2 ring-blue-500/50'
        )}
      >
        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className={cn(
          'flex-1 truncate text-sm',
          displayName ? 'text-gray-900 dark:text-white' : 'text-gray-400'
        )}>
          {displayName || t('settings.weather.selectCity', '选择城市')}
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={cn(
          'absolute top-full left-0 right-0 mt-1 z-50',
          'bg-white dark:bg-gray-900 rounded-lg shadow-xl',
          'border border-gray-200 dark:border-gray-700',
          'overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150'
        )}>
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('settings.weather.searchCity', '搜索城市...')}
                className={cn(
                  'w-full pl-9 pr-8 py-2 rounded-md text-sm',
                  'bg-gray-50 dark:bg-gray-800 border-0',
                  'placeholder:text-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                )}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* City List */}
          <div className="max-h-64 overflow-y-auto">
            {/* Chinese Cities */}
            {groupedCities.cnCities.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                  {t('settings.weather.regionChina', '中国城市')}
                </div>
                {groupedCities.cnCities.map(renderCityItem)}
              </div>
            )}

            {/* International Cities */}
            {groupedCities.intlCities.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                  {t('settings.weather.regionIntl', '国际城市')}
                </div>
                {groupedCities.intlCities.map(renderCityItem)}
              </div>
            )}

            {/* No Results */}
            {filteredCities.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                {t('settings.weather.noCityFound', '未找到匹配的城市')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CitySelector;
