/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lavender: {
          50: '#faf7ff', 100: '#f3ecff', 200: '#e9ddff', 300: '#d6c2ff',
          400: '#bda0fb', 500: '#a78bfa', 600: '#8b5cf6', 700: '#7c3aed',
        },
        mint: {
          100: '#e6fbf3', 200: '#c5f5e4', 300: '#9bedd0', 400: '#5fdcb3', 500: '#34d399',
        },
        peach: {
          100: '#fff1ec', 200: '#ffe0d4', 300: '#ffc4ad', 400: '#ffa588', 500: '#fb8c66',
        },
        sky: {
          100: '#eaf5ff', 200: '#d2e9ff', 300: '#a9d4ff', 400: '#7bbcff', 500: '#5aa6ff',
        },
        cream: '#fdfbff',
      },
      fontFamily: {
        sans: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(124, 58, 237, 0.18)',
        card: '0 4px 24px -8px rgba(124, 58, 237, 0.14)',
        glow: '0 0 0 4px rgba(167, 139, 250, 0.18)',
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
