/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#edf2f9',
          100: '#d9e4f2',
          200: '#b4c9e5',
          300: '#8aabd5',
          400: '#527ebc',
          500: '#00245C',
          600: '#001f50',
          700: '#001a43',
          800: '#001535',
          900: '#000f26',
        },
        gold: {
          50: '#fff8e5',
          100: '#fff0c2',
          200: '#ffe18a',
          300: '#f5ca4b',
          400: '#e9b51a',
          500: '#E2A605',
          600: '#bf8900',
          700: '#946a00',
          800: '#674a00',
          900: '#3d2c00',
        },
        navy: {
          50: '#edf2f9',
          100: '#d9e4f2',
          200: '#b4c9e5',
          300: '#8aabd5',
          400: '#527ebc',
          500: '#00245C',
          600: '#001f50',
          700: '#001a43',
          800: '#001535',
          900: '#000f26',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'count': 'count 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', maxHeight: '0' },
          '100%': { opacity: '1', maxHeight: '500px' },
        },
        slideUp: {
          '0%': { opacity: '1', maxHeight: '500px' },
          '100%': { opacity: '0', maxHeight: '0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        count: {
          '0%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
