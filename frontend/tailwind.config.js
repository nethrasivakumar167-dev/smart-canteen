/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff8f1',
          100: '#feeedc',
          200: '#fcdab7',
          300: '#f9be87',
          400: '#f59651',
          500: '#f07126', // Vibrant Smart Canteen Orange
          600: '#e1541b',
          700: '#ba3e17',
          800: '#94331a',
          900: '#772c19',
          950: '#40130a',
        },
        dark: {
          bg: '#0b0f19',
          surface: '#111827',
          card: '#1f2937',
          border: '#374151',
          hover: '#283548',
          text: '#f3f4f6',
          muted: '#9ca3af',
        },
        accent: {
          green: '#10b981',
          emerald: '#059669',
          red: '#ef4444',
          amber: '#f59e0b',
          blue: '#3b82f6',
          purple: '#8b5cf6',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(240, 113, 38, 0.3)',
        'glow-lg': '0 0 35px -5px rgba(240, 113, 38, 0.45)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
