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
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1e40af',
          600: '#1e3a8a',
          700: '#1e3370',
          800: '#172554',
          900: '#0f172a',
        },
        bsnl: {
          blue: '#003366',
          lightblue: '#0066cc',
          accent: '#0099ff',
        }
      }
    },
  },
  plugins: [],
}
