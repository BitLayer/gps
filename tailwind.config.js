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
        // Primary Brand Colors
        'brand': {
          50: '#E6F4EA',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#28A745', // Fresh Green (Main Brand)
          600: '#218838', // Deep Green (Hover)
          700: '#1B5E20',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        // Secondary Dopamine Colors
        'appetite': {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF7F50', // Appetite Orange (CTA Buttons)
          600: '#FF7043',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
        },
        'mango': {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FFA726', // Mango Orange Start
          600: '#FF7043', // Mango Orange End
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
        },
        'fresh-red': {
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#EF5350',
          500: '#FF4C4C', // Fresh Red
          600: '#E53935',
          700: '#D32F2F',
          800: '#C62828',
          900: '#B71C1C',
        },
        'zesty': {
          50: '#FFFDE7',
          100: '#FFF9C4',
          200: '#FFF59D',
          300: '#FFF176',
          400: '#FFEE58',
          500: '#FFC107', // Zesty Yellow
          600: '#FFB300',
          700: '#FFA000',
          800: '#FF8F00',
          900: '#FF6F00',
        },
        // Supportive Colors
        'cool-blue': {
          50: '#E1F5FE',
          100: '#B3E5FC',
          200: '#81D4FA',
          300: '#4FC3F7', // Cool Blue
          400: '#29B6F6',
          500: '#03A9F4',
          600: '#039BE5',
          700: '#0288D1',
          800: '#0277BD',
          900: '#01579B',
        },
        'soft-purple': {
          50: '#F3E5F5',
          100: '#E1BEE7',
          200: '#CE93D8',
          300: '#BA68C8', // Soft Purple
          400: '#AB47BC',
          500: '#9C27B0',
          600: '#8E24AA',
          700: '#7B1FA2',
          800: '#6A1B9A',
          900: '#4A148C',
        },
        // Neutral Colors
        'off-white': '#F9F9F9',
        'dark-text': '#212121',
        'gray-light': '#F1F3F4',
        'gray-medium': '#9E9E9E',
        'gray-dark': '#424242',
      },
      backgroundImage: {
        'mango-gradient': 'linear-gradient(135deg, #FFA726 0%, #FF7043 100%)',
        'brand-gradient': 'linear-gradient(135deg, #28A745 0%, #59C867 100%)',
      },
    },
  },
  plugins: [],
};