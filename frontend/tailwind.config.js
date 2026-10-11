/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F8FAFC',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F1F5F9',
          subtle: '#F8FAFC',
        },
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        forest: {
          DEFAULT: '#0284C7', // Primary action becomes sky-blue
          deep: '#0369A1',
          light: '#38BDF8',
          subtle: '#F0F9FF',
        },
        emerald: {
          DEFAULT: '#059669',
          deep: '#064E3B',
          light: '#10B981',
          subtle: '#ECFDF5',
        },
        carto: {
          text: '#0F172A',
          muted: '#64748B',
          border: '#E2E8F0',
          borderLight: '#F1F5F9',
          accent: '#0284C7',
        },
        water: {
          DEFAULT: '#0284C7',
          pale: '#E0F2FE',
          deep: '#075985',
        },
        risk: {
          low: '#059669',
          'low-bg': '#ECFDF5',
          mod: '#D97706',
          'mod-bg': '#FFFBEB',
          high: '#EA580C',
          'high-bg': '#FFF7ED',
          crit: '#DC2626',
          'crit-bg': '#FEF2F2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        'carto-sm': '0 1px 3px rgba(32, 43, 39, 0.05)',
        'carto': '0 4px 12px rgba(32, 43, 39, 0.06), 0 1px 3px rgba(32, 43, 39, 0.04)',
        'carto-float': '0 8px 24px rgba(32, 43, 39, 0.08), 0 2px 6px rgba(32, 43, 39, 0.04)',
        'carto-modal': '0 16px 40px rgba(32, 43, 39, 0.12), 0 4px 12px rgba(32, 43, 39, 0.06)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}
