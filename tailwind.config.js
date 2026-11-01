/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eefdf3',
          100: '#d6f9e2',
          200: '#aff2c8',
          300: '#79e5a6',
          400: '#3fd07f',
          500: '#18b862',
          600: '#0c944d',
          700: '#0b7540',
          800: '#0d5c35',
          900: '#0c4c2e',
        },
        grape: {
          50: '#f5f0ff',
          100: '#ede5ff',
          200: '#dacefd',
          400: '#a878ff',
          500: '#8b4dff',
          600: '#7635e6',
          700: '#5f1ec9',
        },
        sun: {
          50: '#fffbea',
          100: '#fff3c4',
          400: '#ffc233',
          500: '#ffab00',
          600: '#d98c00',
        },
        coral: {
          50: '#fff2ef',
          100: '#ffe2db',
          400: '#ff7a66',
          500: '#ff5436',
          600: '#e03c20',
        },
      },
      boxShadow: {
        pop: '0 5px 0 0 rgba(0,0,0,0.14)',
        'pop-sm': '0 3px 0 0 rgba(0,0,0,0.12)',
        card: '0 4px 24px -4px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.04)',
        'card-hover': '0 12px 36px -6px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)',
        'card-active': '0 2px 8px -2px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-10px)' },
          '40%, 80%': { transform: 'translateX(10px)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        bounceIn: 'bounceIn 0.3s ease-out',
        slideUp: 'slideUp 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
