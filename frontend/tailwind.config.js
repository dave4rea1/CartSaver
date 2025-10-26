/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shoprite Brand Colors - Phase 2A Update
        primary: {
          50: '#fef2f3',
          100: '#fee2e4',
          200: '#fecacd',
          300: '#fca5aa',
          400: '#f87177',
          500: '#E31837',  // Primary Shoprite Red
          600: '#C41230',  // Secondary/Hover Red
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        shoprite: {
          red: '#E41E26',      // Primary Shoprite Red
          redDark: '#C41230',  // Secondary Red (darker)
          redLight: '#FF4757', // Accent Red (lighter)
        },
        // Semantic Colors
        success: {
          DEFAULT: '#27AE60',
          light: '#D4EDDA',
          dark: '#155724',
        },
        warning: {
          DEFAULT: '#F39C12',
          light: '#FFF3CD',
          dark: '#856404',
        },
        danger: {
          DEFAULT: '#E74C3C',
          light: '#F8D7DA',
          dark: '#721C24',
        },
        // Neutral Colors
        grey: {
          50: '#F5F5F5',
          100: '#EFEFEF',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#666666',
          700: '#525252',
          800: '#404040',
          900: '#333333',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'h1': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'h3': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'small': ['14px', { lineHeight: '20px', fontWeight: '400' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'header': '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      scale: {
        '102': '1.02',
      }
    },
  },
  plugins: [],
}
