/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0E9F6E',
          dark: '#047857',
          light: '#D1FAE5',
        },
        secondary: {
          DEFAULT: '#2563EB',
          light: '#DBEAFE',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          300: '#D1D5DB',
          600: '#4B5563',
          900: '#111827',
        },
        darkbg: '#0B1120',
        darksurface: '#161C2C',
      },
      fontFamily: {
        sans: ['Outfit', '"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '10px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(16,24,40,0.05)',
        sm: '0 2px 6px rgba(16,24,40,0.06)',
        md: '0 8px 24px rgba(16,24,40,0.08)',
        lg: '0 16px 40px rgba(16,24,40,0.12)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.06)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite linear',
        pulseGlow: 'pulseGlow 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
