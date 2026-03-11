import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',
        secondary: 'var(--bg-secondary)',
        accent: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
        },
        border: 'var(--border-color)',
      },
      fontFamily: {
        serif: ["'Playfair Display'", 'serif'],
        sans: ["'Inter'", 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
