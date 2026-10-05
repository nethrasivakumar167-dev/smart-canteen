/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: '#0B2A4A',
        skyblue: '#BAD7EE',
        skysoft: '#D6E6F5',
        cream: '#FFF9F0',
        beige: '#F4EDE0',
        sand: { DEFAULT: '#E6DCC6', light: '#F0E8D8' },
        line: '#D9CDB8',
        espresso: '#4C2B08',
        rust: '#8B3A1E',
        card: '#FFF9F0',

        // Compatibility aliases used by the current component library.
        slateblue: { DEFAULT: '#0B2A4A', light: '#12365C' },
        dusty: { DEFAULT: '#BAD7EE', light: '#D6E6F5' },
        ink: '#0B2A4A',
        slate: '#4C2B08',
        mist: '#4C2B08',
        'cream-old': '#FFF9F0',
        'red-accent': '#8B3A1E',
        brand: {
          50: '#F3F8FC', 100: '#D6E6F5', 200: '#BAD7EE', 300: '#8DBCE0', 400: '#5B97C6',
          500: '#12365C', 600: '#0B2A4A', 700: '#08223C', 800: '#061B31', 900: '#041527', 950: '#020C17',
        },
        dark: {
          bg: '#0B2A4A', surface: '#12365C', card: '#12365C', border: '#376487',
          hover: '#1C4772', text: '#FFF9F0', muted: '#BAD7EE',
        },
        accent: {
          green: '#10B981', emerald: '#059669', red: '#8B3A1E', amber: '#B86A1A', blue: '#5B97C6', purple: '#7663A6',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        glow: '0 8px 18px -14px rgba(11, 42, 74, 0.5)',
        'glow-lg': '0 14px 28px -18px rgba(11, 42, 74, 0.5)',
        glass: '0 4px 12px -10px rgba(11, 42, 74, 0.35)',
        'glass-dark': '0 4px 12px -10px rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
