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
        studio: {
          // Dark Cinematic UI
          darkest:   '#050B16',
          header:    '#07111F',
          sidebar:   '#0B1628',
          workspace: '#050B16',
          panel:     '#0B1628',
          elevated:  '#0E1C31',
          border:    'rgba(100, 180, 255, 0.15)',
          subtle:    'rgba(100, 180, 255, 0.08)',
        },
        brand: {
          cyan:    '#00f0ff',   // Electric Cyan
          electric: '#00E5FF',
          blue:    '#2563EB',   // Neon Blue
          violet:  '#8b5cf6',   // AI Purple / Violet
          purple:  '#a855f7',
          emerald: '#10b981',   // Success Green
          amber:   '#f59e0b',   // Warning Orange
          danger:  '#ef4444',   // Danger Red
        },
      },
      fontFamily: {
        khmer: ['"Kantumruy Pro"', '"Battambang"', 'sans-serif'],
        ui:    ['"Inter"', '"Outfit"', 'sans-serif'],
        mono:  ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      borderRadius: {
        'studio-sm': '6px',
        'studio-md': '10px',
        'studio-lg': '14px',
        'studio-xl': '20px',
      },
    },
  },
  plugins: [],
}
