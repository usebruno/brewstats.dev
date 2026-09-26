/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#d37f17',
          dark: '#e4ae49',
        },
        brew: {
          // Dark mode
          dark: {
            bg: '#121212',
            card: '#1b1b1c',
            border: '#2c2c2e',
            text: '#e4e4e7',
            muted: '#8a8a8a',
          },
          // Light mode
          light: {
            bg: '#ffffff',
            card: '#ffffff',
            border: '#e4e4e7',
            text: '#1a1a1a',
            muted: '#6b6b6b',
          },
        },
      },
    },
  },
  plugins: [],
};
