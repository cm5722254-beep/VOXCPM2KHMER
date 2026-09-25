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
          // Premium dark backgrounds — V2.3.3 PRO
          darkest:   '#030508',
          header:    '#050810',
          sidebar:   '#04060c',
          workspace: '#070a12',
          panel:     '#090d1c',
          elevated:  '#0c1020',
          border:    'rgba(255, 255, 255, 0.055)',
          subtle:    'rgba(255, 255, 255, 0.03)',
        },
        brand: {
          cyan:    '#22d3ee',   // electric cyan (professional, not neon)
          violet:  '#7c3aed',   // deep violet
          indigo:  '#6366f1',   // soft indigo
          emerald: '#34d399',   // success green
          amber:   '#f59e0b',   // warning gold
          danger:  '#f87171',   // error red
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
