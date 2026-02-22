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
            bg: '#1a1a1a',
            card: '#242424',
            border: '#333333',
            text: '#e4e4e7',
            muted: '#888888',
          },
          // Light mode
          light: {
            bg: '#f5f5f5',
            card: '#ffffff',
            border: '#e5e5e5',
            text: '#1a1a1a',
            muted: '#666666',
          },
        },
      },
    },
  },
  plugins: [],
};
