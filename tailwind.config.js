/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#4F46E5', light: '#6366F1', dark: '#3730A3' },
        accent:    { DEFAULT: '#06B6D4', light: '#22D3EE', dark: '#0891B2' },
        secondary: { DEFAULT: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED' },
        success:   { DEFAULT: '#10B981', light: '#34D399', dark: '#059669' },
        danger:    { DEFAULT: '#EF4444', light: '#F87171', dark: '#DC2626' },
        surface: {
          DEFAULT: '#FFFFFF',
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
        },
        dark: {
          900: '#0B0F1A',
          800: '#111827',
          700: '#1E293B',
          600: '#334155',
          500: '#475569',
        }
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 24px rgba(79,70,229,0.12), 0 8px 32px rgba(0,0,0,0.08)',
        'glow':     '0 0 20px rgba(79,70,229,0.3)',
        'glow-accent': '0 0 20px rgba(6,182,212,0.3)',
        'inset':    'inset 0 2px 4px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient':   'linear-gradient(135deg, #4F46E5 0%, #8B5CF6 50%, #06B6D4 100%)',
      },
    },
  },
  plugins: [],
}
