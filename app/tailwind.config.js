/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B7A4A',
          dark: '#0F4D2E',
          light: '#E8F5E9',
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#4CAF50',
          500: '#1B7A4A',
          600: '#166D3F',
          700: '#0F4D2E',
          800: '#0A3A22',
          900: '#062716',
        },
        accent: {
          DEFAULT: '#F05A2A',
          light: '#FFF3E0',
          dark: '#C44A1F',
        },
        dark: '#1A1A2E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0,0,0,0.08)',
        'sheet': '0 -4px 24px rgba(0,0,0,0.12)',
        'pin': '0 2px 8px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}
