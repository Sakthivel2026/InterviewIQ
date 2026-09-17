/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#1e1b4b',
        },
        cyanGlow: '#06b6d4',
        purpleGlow: '#a855f7',
        darkBg: '#090d16',
        cardBg: 'rgba(15, 23, 42, 0.75)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        cyanGlow: '0 0 25px -5px rgba(6, 182, 212, 0.35)',
      },
    },
  },
  plugins: [],
}
