/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surface palette — dark UI backgrounds
        surface: {
          dark:   '#030712',   // bg-surface-dark  (deepest bg, near black)
          darker: '#010409',   // bg-surface-darker
          card:   '#0f172a',   // bg-surface-card   (slate-900)
          border: '#1e293b',   // border-surface-border (slate-800)
        },
        // Primary brand — blue/indigo
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
