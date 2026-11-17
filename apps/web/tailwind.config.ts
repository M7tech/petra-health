import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
      colors: {
        // Petra plum — the single accent, used for actions and the active nav item.
        petra: {
          50: '#fbf3f8',
          100: '#f6e3ee',
          200: '#ecc4da',
          400: '#cf5a93',
          500: '#a4225f',
          600: '#8a1a50',
          700: '#6f1440',
          800: '#560f32',
        },
        // Console chrome (sidebar/top bar) — deep plum-tinted ink.
        ink: { 900: '#1b1220', 800: '#261a2d', 700: '#33243b' },
      },
      boxShadow: {
        panel: '0 0 0 1px rgb(15 23 42 / 0.06)',
        pop: '0 12px 32px -8px rgb(15 23 42 / 0.25)',
      },
      borderRadius: { panel: '12px' },
    },
  },
  plugins: [],
};

export default config;
