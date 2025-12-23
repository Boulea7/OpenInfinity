import React, { useId } from 'react';

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    unit?: string;
    step?: number;
    onChange: (value: number) => void;
    className?: string;
    /** Optional ID for accessibility. Auto-generated if not provided. */
    id?: string;
}

export const Slider: React.FC<SliderProps> = ({
    label,
    value,
    min,
    max,
    unit = '%',
    step = 1,
    onChange,
    className = '',
    id: propId,
}) => {
    const generatedId = useId();
    const sliderId = propId || `slider-${generatedId}`;
    const labelId = `${sliderId}-label`;

    // Calculate fill percentage for gradient background
    const fillPercent = ((value - min) / (max - min)) * 100;

    return (
        <div className={`py-2 ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <label
                    id={labelId}
                    htmlFor={sliderId}
                    className="text-sm text-gray-700 dark:text-gray-300"
                >
                    {label}
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400" aria-hidden="true">
                    {value}{unit}
                </span>
            </div>
            <div className="relative w-full h-5 flex items-center">
                <input
                    id={sliderId}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => {
                        e.stopPropagation();
                        onChange(Number(e.target.value));
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    aria-labelledby={labelId}
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={value}
                    aria-valuetext={`${value}${unit}`}
                    style={{
                        background: `linear-gradient(to right,
                            var(--slider-fill-color) 0%,
                            var(--slider-fill-color) ${fillPercent}%,
                            var(--slider-track-color) ${fillPercent}%,
                            var(--slider-track-color) 100%)`
                    }}
                    className="
                        slider-track
                        w-full h-[3px] rounded-full appearance-none cursor-pointer
                        focus:outline-none
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-[20px]
                        [&::-webkit-slider-thumb]:h-[20px]
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:border
                        [&::-webkit-slider-thumb]:border-gray-300
                        [&::-webkit-slider-thumb]:dark:border-gray-600
                        [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_2px_6px_rgba(0,0,0,0.1)]
                        [&::-webkit-slider-thumb]:dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.3)]
                        [&::-webkit-slider-thumb]:transition-all
                        [&::-webkit-slider-thumb]:duration-150
                        [&::-webkit-slider-thumb]:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25),0_4px_10px_rgba(0,0,0,0.15)]
                        [&::-webkit-slider-thumb]:hover:scale-105
                        [&::-webkit-slider-thumb]:active:scale-95
                        [&::-webkit-slider-thumb]:active:shadow-[0_1px_2px_rgba(0,0,0,0.2)]
                        [&::-moz-range-thumb]:w-[20px]
                        [&::-moz-range-thumb]:h-[20px]
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-white
                        [&::-moz-range-thumb]:border
                        [&::-moz-range-thumb]:border-gray-300
                        [&::-moz-range-thumb]:dark:border-gray-600
                        [&::-moz-range-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_2px_6px_rgba(0,0,0,0.1)]
                        [&::-moz-range-thumb]:dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.3)]
                        [&::-moz-range-thumb]:transition-all
                        [&::-moz-range-thumb]:duration-150
                        [&::-moz-range-thumb]:hover:shadow-[0_2px_6px_rgba(0,0,0,0.25),0_4px_10px_rgba(0,0,0,0.15)]
                        [&::-moz-range-thumb]:hover:scale-105
                        [&::-moz-range-thumb]:active:scale-95
                        [&::-moz-range-thumb]:active:shadow-[0_1px_2px_rgba(0,0,0,0.2)]
                    "
                />
            </div>
        </div>
    );
};
