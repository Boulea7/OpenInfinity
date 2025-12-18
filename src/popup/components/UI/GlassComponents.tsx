import React, { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// --- Glass Card ---
export const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`
    bg-zinc-900/80 backdrop-blur-xl border border-white/10 shadow-glass rounded-2xl
    ${className}
  `}>
        {children}
    </div>
);

// --- Glass Input ---
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
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
            bg-white/5 border border-white/10 text-zinc-100 placeholder-zinc-500
            rounded-xl px-4 py-2.5 outline-none transition-all duration-200
            hover:bg-white/10 hover:border-white/20
            focus:bg-white/10 focus:border-brand-orange-500/50 focus:ring-1 focus:ring-brand-orange-500/50
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : ''}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && <p className="text-xs text-red-400 mt-1 ml-1">{error}</p>}
            </div>
        );
    }
);
GlassInput.displayName = 'GlassInput';

// --- Glass Button ---
interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
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
        primary: 'bg-brand-orange-500 hover:bg-brand-orange-600 active:bg-brand-orange-700 text-white border border-transparent shadow-lg shadow-brand-orange-500/20',
        secondary: 'bg-white/5 hover:bg-white/10 active:bg-white/15 text-zinc-200 border border-white/10 backdrop-blur-md',
        ghost: 'bg-transparent hover:bg-white/5 text-zinc-400 hover:text-zinc-200',
        danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
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

// --- Segmented Control ---
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
        <div className={`p-1 bg-black/20 backdrop-blur-xl border border-white/5 rounded-xl flex ${className}`}>
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
                                ? 'bg-zinc-800/80 text-white shadow-sm border border-white/10'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
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
