import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../ui/Modal';
import { Slider } from './Slider';
import { useSettingsStore } from '../../../stores/settingsStore';

interface CustomLayoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CustomLayoutModal: React.FC<CustomLayoutModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation();
    const { viewSettings, setViewSettings } = useSettingsStore();

    // Local state for preview
    const [localSettings, setLocalSettings] = useState({
        rows: viewSettings.rows,
        columns: viewSettings.columns,
        columnGap: viewSettings.columnGap,
        rowGap: viewSettings.rowGap,
        iconScale: viewSettings.iconScale,
    });

    // Sync local state when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalSettings({
                rows: viewSettings.rows,
                columns: viewSettings.columns,
                columnGap: viewSettings.columnGap,
                rowGap: viewSettings.rowGap,
                iconScale: viewSettings.iconScale,
            });
        }
    }, [isOpen, viewSettings]);

    const handleApply = () => {
        setViewSettings(localSettings);
        onClose();
    };

    const updateSetting = (key: keyof typeof localSettings, value: number) => {
        setLocalSettings((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('settings.layout.customTitle', '自定义布局')}
            size="xl"
            className="max-w-4xl"
        >
            <div className="flex flex-col md:flex-row gap-6 p-1">
                {/* Left: Preview */}
                <div className="flex-1 min-h-[300px] bg-gray-100 dark:bg-gray-900/50 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden border border-gray-100 dark:border-gray-800">
                    <div className="absolute top-3 left-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('settings.layout.preview', '预览')}
                    </div>

                    {/* Grid Preview Container */}
                    <div
                        className="w-full max-w-[500px] aspect-video bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm backdrop-blur-sm p-4 transition-all duration-300"
                        style={{
                            padding: '20px',
                        }}
                    >
                        <div
                            className="w-full h-full grid transition-all duration-300"
                            style={{
                                gridTemplateColumns: `repeat(${localSettings.columns}, 1fr)`,
                                gridTemplateRows: `repeat(${localSettings.rows}, 1fr)`,
                                columnGap: `${localSettings.columnGap / 5}px`, // Scaled down for preview
                                rowGap: `${localSettings.rowGap / 5}px`,     // Scaled down for preview
                            }}
                        >
                            {Array.from({ length: localSettings.rows * localSettings.columns }).map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-gray-200 dark:bg-gray-600 rounded-md transition-all duration-300 flex items-center justify-center"
                                >
                                    {/* Icon Placeholder */}
                                    <div
                                        className="bg-gray-300 dark:bg-gray-500 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${localSettings.iconScale}%`,
                                            height: `${localSettings.iconScale}%`,
                                            maxWidth: '80%',
                                            maxHeight: '80%',
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        {localSettings.rows} × {localSettings.columns} • {localSettings.iconScale}% {t('settings.layout.size', '大小')}
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="w-full md:w-80 space-y-6 flex flex-col">
                    <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                        {/* Grid Dimensions */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {t('settings.layout.gridDimensions', '网格尺寸')}
                            </h3>

                            <Slider
                                label={t('settings.layout.columns', '列数')}
                                value={localSettings.columns}
                                min={1}
                                max={8}
                                unit=""
                                onChange={(v) => updateSetting('columns', v)}
                            />

                            <Slider
                                label={t('settings.layout.rows', '行数')}
                                value={localSettings.rows}
                                min={1}
                                max={8}
                                unit=""
                                onChange={(v) => updateSetting('rows', v)}
                            />
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-gray-800" />

                        {/* Spacing */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {t('settings.layout.spacing', '间距与大小')}
                            </h3>

                            <Slider
                                label={t('settings.layout.columnGap', '列间距')}
                                value={localSettings.columnGap}
                                min={0}
                                max={100}
                                onChange={(v) => updateSetting('columnGap', v)}
                            />

                            <Slider
                                label={t('settings.layout.rowGap', '行间距')}
                                value={localSettings.rowGap}
                                min={0}
                                max={100}
                                onChange={(v) => updateSetting('rowGap', v)}
                            />

                            <Slider
                                label={t('settings.layout.iconSize', '图标大小')}
                                value={localSettings.iconScale}
                                min={10}
                                max={100}
                                onChange={(v) => updateSetting('iconScale', v)}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            {t('common.cancel', '取消')}
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
                        >
                            {t('common.apply', '应用')}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
