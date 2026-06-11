/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        safecred: {
          dark: '#0f172a',
          brand: '#2563eb',
          accent: '#38bdf8',
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444'
        },
        risk: {
          A: '#22c55e', // Green
          B: '#3b82f6', // Blue
          C: '#eab308', // Yellow
          D: '#f97316', // Orange
          E: '#ef4444', // Red
        }
      }
    },
  },
  plugins: [],
}
