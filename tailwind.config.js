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
      colors: {
        // Custom green shades to match the specified colors
        'green': {
          50: '#f0f9f4',
          100: '#dcf4e3',
          200: '#bbe8ca',
          300: '#86d5a3',
          400: '#4ade80',
          500: '#28a745', // Main brand color
          600: '#218838', // Hover state
          700: '#16a34a',
          800: '#15803d',
          900: '#14532d',
        }
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to right, #22c55e, #16a34a, #2563eb)',
        'auth-gradient': 'linear-gradient(to right, rgba(20, 83, 45, 0.8), rgba(21, 128, 61, 0.7), rgba(30, 58, 138, 0.8))',
        'promotional-gradient': 'linear-gradient(to right, #fb923c, #ea580c)',
      },
    },
  },
  plugins: [],
};