/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chassis: {
          DEFAULT: '#e0e5ec',
          dark: '#d1d9e6',
          light: '#eef2f7',
        },
        panel: {
          DEFAULT: '#f0f2f5',
          elevated: '#f7f9fb',
          inset: '#e6ebf2',
        },
        recessed: {
          DEFAULT: '#d1d9e6',
          dark: '#c4cedf',
          light: '#dbe2ed',
        },
        text: {
          primary: '#2d3436',
          muted: '#4a5568',
          subtle: '#718096',
        },
        accent: {
          DEFAULT: '#ff6b35', // Industrial Orange
          orange: '#ff6b35',
          red: '#ff4757',    // Critical alerts and overdue cases only
          green: '#2ed573',  // Verified or completed states
          amber: '#ffa502',  // Approaching deadlines or pending attention
          blue: '#1e90ff',
        },
        skeuo: {
          shadow: '#babecc',
          deep: '#a3b1c6',
          highlight: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'skeuo-raised-sm': '3px 3px 6px #babecc, -3px -3px 6px #ffffff',
        'skeuo-raised': '6px 6px 14px #babecc, -6px -6px 14px #ffffff',
        'skeuo-raised-lg': '9px 9px 20px #a3b1c6, -9px -9px 20px #ffffff',
        'skeuo-raised-hover': '8px 8px 18px #a3b1c6, -8px -8px 18px #ffffff',
        'skeuo-inset-sm': 'inset 2px 2px 4px #babecc, inset -2px -2px 4px #ffffff',
        'skeuo-inset': 'inset 4px 4px 8px #babecc, inset -4px -4px 8px #ffffff',
        'skeuo-modal': '16px 16px 32px #a3b1c6, -16px -16px 32px #ffffff',
      },
    },
  },
  plugins: [],
};
