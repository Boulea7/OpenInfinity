/**
 * WeatherSection - Weather display settings
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from './CollapsibleSection';
import { useSettingsStore } from '../../../stores/settingsStore';
import { Toggle } from '../components/Toggle';
import { CitySelector } from '../components/CitySelector';
import type { City } from '../../../data/cities';

export const WeatherSection: React.FC = () => {
  const { t } = useTranslation();
  const weatherSettings = useSettingsStore((state) => state.weatherSettings);
  const setWeatherSettings = useSettingsStore((state) => state.setWeatherSettings);

  // Handle city selection
  const handleCitySelect = (city: City) => {
    setWeatherSettings({
      location: {
        type: 'manual',
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
      }
    });
  };

  return (
    <CollapsibleSection
      id="weather"
      title={t('settings.weather.title', '天气')}
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {/* Temperature Unit */}
        <div className="py-3">
          <span className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
            {t('settings.weather.unit', '温度单位')}
          </span>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setWeatherSettings({ unit: 'celsius' })}
              className={`
                px-4 py-2 rounded text-sm
                ${weatherSettings.unit === 'celsius'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              {t('settings.weather.celsius', '摄氏度')} (°C)
            </button>
            <button
              type="button"
              onClick={() => setWeatherSettings({ unit: 'fahrenheit' })}
              className={`
                px-4 py-2 rounded text-sm
                ${weatherSettings.unit === 'fahrenheit'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              {t('settings.weather.fahrenheit', '华氏度')} (°F)
            </button>
          </div>
        </div>

        <Toggle
          label={t('settings.weather.showForecast', '显示天气预报')}
          checked={weatherSettings.showForecast}
          onChange={(checked) => setWeatherSettings({ showForecast: checked })}
        />

        {/* Location Type */}
        <div className="py-3">
          <span className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
            {t('settings.weather.location', '位置')}
          </span>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setWeatherSettings({ location: { ...weatherSettings.location, type: 'auto' } })}
              className={`
                px-4 py-2 rounded text-sm
                ${weatherSettings.location.type === 'auto'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              {t('settings.weather.auto', '自动定位')}
            </button>
            <button
              type="button"
              onClick={() => setWeatherSettings({ location: { ...weatherSettings.location, type: 'manual' } })}
              className={`
                px-4 py-2 rounded text-sm
                ${weatherSettings.location.type === 'manual'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              {t('settings.weather.manual', '手动设置')}
            </button>
          </div>

          {/* City Selector - shown when manual mode is selected */}
          {weatherSettings.location.type === 'manual' && (
            <div className="mt-3">
              <CitySelector
                value={{
                  name: weatherSettings.location.name,
                  latitude: weatherSettings.location.latitude,
                  longitude: weatherSettings.location.longitude,
                }}
                onChange={handleCitySelect}
              />
            </div>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default WeatherSection;
