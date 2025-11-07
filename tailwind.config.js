/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: false, // Disable Tailwind dark mode - using CSS variables instead
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#403CCF',
          dark: '#5B59E8',
        },
        secondary: {
          DEFAULT: '#FBFAFF',
          dark: '#1a1a1a',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Arial', 'Helvetica', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}