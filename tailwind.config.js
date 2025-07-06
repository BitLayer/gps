/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      maxWidth: {
        'screen-safe': 'calc(100vw - 2rem)',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - 2rem)',
      },
    },
  },
  plugins: [],
};