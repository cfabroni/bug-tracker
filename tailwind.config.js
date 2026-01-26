/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        // Primary & Accent
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        // Backgrounds
        background: {
          DEFAULT: 'var(--color-background)',
          secondary: 'var(--color-background-secondary)',
        },
        card: {
          DEFAULT: 'var(--color-card)',
          elevated: 'var(--color-card-elevated)',
        },
        // Text
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          inverse: 'var(--color-text-inverse)',
        },
        // Semantic
        success: 'var(--color-success)',
        destructive: 'var(--color-destructive)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
        // UI Elements
        border: {
          DEFAULT: 'var(--color-border)',
          subtle: 'var(--color-border-subtle)',
        },
        input: {
          DEFAULT: 'var(--color-input-background)',
          border: 'var(--color-input-border)',
          'border-focused': 'var(--color-input-border-focused)',
        },
        placeholder: 'var(--color-placeholder)',
        button: {
          DEFAULT: 'var(--color-button-background)',
          hover: 'var(--color-button-background-hover)',
        },
        tag: 'var(--color-tag-background)',
      },
    },
  },
  plugins: [],
}
