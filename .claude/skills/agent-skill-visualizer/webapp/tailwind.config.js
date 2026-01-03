/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agent: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB'
        },
        skill: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669'
        }
      }
    },
  },
  plugins: [],
}
