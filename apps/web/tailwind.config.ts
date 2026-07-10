import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Petra Pharma brand-ish palette (magenta/plum from the logo).
        petra: {
          50: '#fbf3f8',
          500: '#a4225f',
          600: '#8a1a50',
          700: '#6f1440',
        },
      },
    },
  },
  plugins: [],
};

export default config;
