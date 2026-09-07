import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#f7f2ed',
        sand: '#e8dac7',
        warm: '#d2b496',
        bronze: '#9d7a5f',
        charcoal: '#2a241f',
        mocha: '#54463e',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(64, 43, 26, 0.12)',
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
