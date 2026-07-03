/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic aliases driven by CSS variables (see src/index.css / themes).
        lavender: {
          50: 'rgb(var(--c-primary-50) / <alpha-value>)',
          100: 'rgb(var(--c-primary-100) / <alpha-value>)',
          200: 'rgb(var(--c-primary-200) / <alpha-value>)',
          300: 'rgb(var(--c-primary-300) / <alpha-value>)',
          400: 'rgb(var(--c-primary-400) / <alpha-value>)',
          500: 'rgb(var(--c-primary-500) / <alpha-value>)',
          600: 'rgb(var(--c-primary-600) / <alpha-value>)',
          700: 'rgb(var(--c-primary-700) / <alpha-value>)',
        },
        mint: {
          100: 'rgb(var(--c-success-100) / <alpha-value>)',
          200: 'rgb(var(--c-success-200) / <alpha-value>)',
          300: 'rgb(var(--c-success-300) / <alpha-value>)',
          400: 'rgb(var(--c-success-400) / <alpha-value>)',
          500: 'rgb(var(--c-success-500) / <alpha-value>)',
        },
        peach: {
          100: 'rgb(var(--c-warning-100) / <alpha-value>)',
          200: 'rgb(var(--c-warning-200) / <alpha-value>)',
          300: 'rgb(var(--c-warning-300) / <alpha-value>)',
          400: 'rgb(var(--c-warning-400) / <alpha-value>)',
          500: 'rgb(var(--c-warning-500) / <alpha-value>)',
        },
        sky: {
          100: 'rgb(var(--c-info-100) / <alpha-value>)',
          200: 'rgb(var(--c-info-200) / <alpha-value>)',
          300: 'rgb(var(--c-info-300) / <alpha-value>)',
          400: 'rgb(var(--c-info-400) / <alpha-value>)',
          500: 'rgb(var(--c-info-500) / <alpha-value>)',
        },
        cream: 'rgb(var(--c-cream) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          line: 'rgb(var(--surface-line) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgb(var(--c-primary-700) / 0.18)',
        card: '0 4px 24px -8px rgb(var(--c-primary-700) / 0.14)',
        glow: '0 0 0 4px rgb(var(--c-primary-500) / 0.18)',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.94) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
