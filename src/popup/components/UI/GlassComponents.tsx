import React, { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// --- Card (Light Mode) ---
export const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`
    bg-white border border-zinc-200 shadow-sm rounded-2xl
    ${className}
  `}>
        {children}
    </div>
);

// --- Input (Light Mode - Underline Style) ---
interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
    ({ label, error, className = '', fullWidth = false, ...props }, ref) => {
        return (
            <div className={`${fullWidth ? 'w-full' : ''}`}>
                {label && (
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5 ml-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
            bg-transparent border-b border-zinc-200 text-zinc-900 placeholder-zinc-400
            px-0 py-2 outline-none transition-all duration-200
            focus:border-brand-orange-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : ''}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
            </div>
        );
    }
);
GlassInput.displayName = 'GlassInput';

// --- Button (Light Mode) ---
interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    isLoading?: boolean;
    fullWidth?: boolean;
}

export const GlassButton = ({
    children,
    variant = 'primary',
    className = '',
    isLoading = false,
    fullWidth = false,
    disabled,
    ...props
}: GlassButtonProps) => {
    const variants = {
        primary: 'bg-zinc-700 hover:bg-zinc-800 active:bg-zinc-900 text-white shadow-md', // Matching image 'confirm' button usually dark
        secondary: 'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-700',
        outline: 'bg-transparent hover:bg-zinc-50 active:bg-zinc-100 text-zinc-600 border border-zinc-200',
        ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700',
        danger: 'bg-red-50 hover:bg-red-100 text-red-500',
    };

    return (
        <button
            disabled={disabled || isLoading}
            className={`
        relative overflow-hidden font-medium rounded-xl py-2.5 px-4 transition-all duration-200
        active:scale-[0.98] disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            <span className={isLoading ? 'opacity-80' : ''}>{children}</span>
        </button>
    );
};

// --- Segmented Control (Light Mode) ---
interface SegmentedControlOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface SegmentedControlProps {
    options: SegmentedControlOption[];
    value: string;
    onChange: (value: any) => void;
    className?: string;
}

export const SegmentedControl = ({ options, value, onChange, className = '' }: SegmentedControlProps) => {
    return (
        <div className={`p-1 bg-zinc-100 border border-zinc-200 rounded-xl flex ${className}`}>
            {options.map((option) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`
              flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive
                                ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'}
            `}
                    >
                        {option.icon && <span className="w-4 h-4">{option.icon}</span>}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
