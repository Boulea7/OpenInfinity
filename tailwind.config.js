/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Monochrome Primary Scale (Zinc)
        primary: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // Minimalist Brand (Black/White)
        brand: {
          black: '#000000',
          white: '#ffffff',
          orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
            DEFAULT: '#f97316',
          },
          gray: {
            50: '#f9f9f9',
            100: '#f0f0f0',
            200: '#e0e0e0',
            300: '#c0c0c0',
            400: '#a0a0a0',
            500: '#808080',
            600: '#606060',
            700: '#404040',
            800: '#202020',
            900: '#101010',
          },
          // Keep a subtle accent if absolutely needed
          accent: '#f59e0b',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'Noto Sans SC',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        // Glass shadows for modern glassmorphism effect
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.08), 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
        // Neutral subtle glow/shadow
        'glow': '0 0 20px -5px rgba(0, 0, 0, 0.1)',
        'glow-lg': '0 0 30px -5px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'weather-expand': 'weatherExpand 0.4s cubic-bezier(0.16, 1, 0.3, 1)', // Smooth ease-out
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        weatherExpand: {
          '0%': { transform: 'translateY(-10px) scale(0.96)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
