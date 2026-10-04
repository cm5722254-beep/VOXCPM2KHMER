/**
 * VOXCPM2KHMER Khmer Dubbing Pro Studio
 * Design System Tokens & Theme Configuration
 * Version 3.0 - 2026 Modern Glassmorphism Design
 */

export const designTokens = {
  // ──────────────────────────────────────────────────────────
  // 🎨 COLOR SYSTEM
  // ──────────────────────────────────────────────────────────
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#e0f7ff',
      100: '#b3e9ff',
      200: '#80daff',
      300: '#4dcbff',
      400: '#26bfff',
      500: '#00b2ff',  // Main brand color
      600: '#00a5f5',
      700: '#0094e0',
      800: '#0084cc',
      900: '#0066ad',
    },
    
    // Secondary Accent Colors
    secondary: {
      50: '#f3e5ff',
      100: '#e0bdff',
      200: '#cc91ff',
      300: '#b765ff',
      400: '#a744ff',
      500: '#9723ff',  // Purple accent
      600: '#8f1fff',
      700: '#8419ff',
      800: '#7a13ff',
      900: '#6900ff',
    },
    
    // Success States
    success: {
      50: '#e8f9f0',
      100: '#c6f0d9',
      200: '#a0e6c0',
      300: '#7adca7',
      400: '#5ed594',
      500: '#42cd81',  // Main success green
      600: '#3cc879',
      700: '#34c16e',
      800: '#2cba64',
      900: '#1eae51',
    },
    
    // Warning States
    warning: {
      50: '#fff8e1',
      100: '#ffecb3',
      200: '#ffe082',
      300: '#ffd54f',
      400: '#ffca28',
      500: '#ffc107',  // Main warning amber
      600: '#ffb300',
      700: '#ffa000',
      800: '#ff8f00',
      900: '#ff6f00',
    },
    
    // Error States
    error: {
      50: '#ffebee',
      100: '#ffcdd2',
      200: '#ef9a9a',
      300: '#e57373',
      400: '#ef5350',
      500: '#f44336',  // Main error red
      600: '#e53935',
      700: '#d32f2f',
      800: '#c62828',
      900: '#b71c1c',
    },
    
    // Info States
    info: {
      50: '#e1f5fe',
      100: '#b3e5fc',
      200: '#81d4fa',
      300: '#4fc3f7',
      400: '#29b6f6',
      500: '#03a9f4',  // Main info cyan
      600: '#039be5',
      700: '#0288d1',
      800: '#0277bd',
      900: '#01579b',
    },
    
    // Grayscale & Neutrals (Dark Theme)
    dark: {
      50: '#f8f9fa',
      100: '#e9ecef',
      200: '#dee2e6',
      300: '#ced4da',
      400: '#adb5bd',
      500: '#6c757d',
      600: '#495057',
      700: '#343a40',
      800: '#1a1d23',
      850: '#141417',  // Sidebar background
      900: '#0f1114',  // Main app background
      950: '#07090e',  // Deepest dark
    },
    
    // Light Theme (for future light mode)
    light: {
      50: '#ffffff',
      100: '#f8fafc',
      200: '#f1f5f9',
      300: '#e2e8f0',
      400: '#cbd5e1',
      500: '#94a3b8',
      600: '#64748b',
      700: '#475569',
      800: '#334155',
      900: '#1e293b',
    },
  },

  // ──────────────────────────────────────────────────────────
  // 📏 SPACING SYSTEM (8px base)
  // ──────────────────────────────────────────────────────────
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // ──────────────────────────────────────────────────────────
  // 🔤 TYPOGRAPHY SYSTEM
  // ──────────────────────────────────────────────────────────
  typography: {
    fonts: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      khmer: '"Noto Sans Khmer", "Battambang", "Khmer OS Battambang", "Kantumruy Pro", sans-serif',
      mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      display: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    },
    
    sizes: {
      xs: '0.625rem',    // 10px
      sm: '0.75rem',     // 12px
      base: '0.875rem',  // 14px
      md: '1rem',        // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },
    
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
    
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // ──────────────────────────────────────────────────────────
  // 🔲 BORDER & RADIUS SYSTEM
  // ──────────────────────────────────────────────────────────
  borders: {
    width: {
      none: '0',
      thin: '1px',
      medium: '2px',
      thick: '3px',
      heavy: '4px',
    },
    
    radius: {
      none: '0',
      sm: '0.375rem',    // 6px
      base: '0.5rem',    // 8px
      md: '0.625rem',    // 10px
      lg: '0.75rem',     // 12px
      xl: '1rem',        // 16px
      '2xl': '1.25rem',  // 20px
      '3xl': '1.5rem',   // 24px
      full: '9999px',
    },
  },

  // ──────────────────────────────────────────────────────────
  // 🌟 SHADOW & GLOW SYSTEM
  // ──────────────────────────────────────────────────────────
  shadows: {
    // Standard Shadows
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
    
    // Glow Effects
    glow: {
      primary: '0 0 20px rgba(0, 178, 255, 0.3), 0 0 40px rgba(0, 178, 255, 0.15)',
      secondary: '0 0 20px rgba(151, 35, 255, 0.3), 0 0 40px rgba(151, 35, 255, 0.15)',
      success: '0 0 20px rgba(66, 205, 129, 0.3), 0 0 40px rgba(66, 205, 129, 0.15)',
      warning: '0 0 20px rgba(255, 193, 7, 0.3), 0 0 40px rgba(255, 193, 7, 0.15)',
      error: '0 0 20px rgba(244, 67, 54, 0.3), 0 0 40px rgba(244, 67, 54, 0.15)',
      info: '0 0 20px rgba(3, 169, 244, 0.3), 0 0 40px rgba(3, 169, 244, 0.15)',
    },
    
    // Inner Shadows
    inner: {
      sm: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      base: 'inset 0 2px 6px 0 rgba(0, 0, 0, 0.1)',
      lg: 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.15)',
    },
  },

  // ──────────────────────────────────────────────────────────
  // 🎭 GLASSMORPHISM STYLES
  // ──────────────────────────────────────────────────────────
  glass: {
    // Blur Levels
    blur: {
      none: '0',
      sm: '4px',
      base: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '40px',
    },
    
    // Glass Panel Backgrounds
    panel: {
      light: 'rgba(255, 255, 255, 0.03)',
      medium: 'rgba(255, 255, 255, 0.05)',
      heavy: 'rgba(255, 255, 255, 0.08)',
      dark: 'rgba(0, 0, 0, 0.3)',
    },
    
    // Border Styles
    border: {
      light: 'rgba(255, 255, 255, 0.08)',
      medium: 'rgba(255, 255, 255, 0.12)',
      heavy: 'rgba(255, 255, 255, 0.18)',
      accent: {
        primary: 'rgba(0, 178, 255, 0.3)',
        secondary: 'rgba(151, 35, 255, 0.3)',
        success: 'rgba(66, 205, 129, 0.3)',
      },
    },
  },

  // ──────────────────────────────────────────────────────────
  // ⚡ ANIMATION & TRANSITIONS
  // ──────────────────────────────────────────────────────────
  animations: {
    duration: {
      instant: '50ms',
      fast: '150ms',
      base: '200ms',
      medium: '300ms',
      slow: '500ms',
      slower: '700ms',
      slowest: '1000ms',
    },
    
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.45, 0, 0.15, 1)',
    },
  },

  // ──────────────────────────────────────────────────────────
  // 📐 LAYOUT & BREAKPOINTS
  // ──────────────────────────────────────────────────────────
  layout: {
    breakpoints: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
    
    container: {
      xs: '100%',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    
    sidebar: {
      collapsed: '64px',
      expanded: '240px',
    },
    
    header: {
      height: '64px',
    },
  },

  // ──────────────────────────────────────────────────────────
  // 🎯 Z-INDEX SYSTEM
  // ──────────────────────────────────────────────────────────
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },
};

// ──────────────────────────────────────────────────────────
// 🎨 THEME PRESETS
// ──────────────────────────────────────────────────────────
export const themePresets = {
  dark: {
    name: 'Dark Pro',
    background: {
      primary: designTokens.colors.dark[900],
      secondary: designTokens.colors.dark[850],
      tertiary: designTokens.colors.dark[800],
      elevated: designTokens.colors.dark[800],
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)',
      disabled: 'rgba(255, 255, 255, 0.3)',
    },
    accent: designTokens.colors.primary[500],
  },
  
  light: {
    name: 'Light Pro',
    background: {
      primary: designTokens.colors.light[50],
      secondary: designTokens.colors.light[100],
      tertiary: designTokens.colors.light[200],
      elevated: '#ffffff',
    },
    text: {
      primary: designTokens.colors.dark[900],
      secondary: 'rgba(0, 0, 0, 0.7)',
      tertiary: 'rgba(0, 0, 0, 0.5)',
      disabled: 'rgba(0, 0, 0, 0.3)',
    },
    accent: designTokens.colors.primary[500],
  },
};

// ──────────────────────────────────────────────────────────
// 🧩 COMPONENT TOKENS
// ──────────────────────────────────────────────────────────
export const componentTokens = {
  button: {
    height: {
      sm: '28px',
      base: '36px',
      md: '40px',
      lg: '48px',
    },
    padding: {
      sm: '0.5rem 0.75rem',
      base: '0.625rem 1rem',
      md: '0.75rem 1.25rem',
      lg: '0.875rem 1.5rem',
    },
  },
  
  input: {
    height: {
      sm: '32px',
      base: '40px',
      md: '44px',
      lg: '52px',
    },
    padding: {
      sm: '0.5rem 0.75rem',
      base: '0.625rem 1rem',
      md: '0.75rem 1.25rem',
      lg: '1rem 1.5rem',
    },
  },
  
  card: {
    padding: {
      sm: '1rem',
      base: '1.25rem',
      md: '1.5rem',
      lg: '2rem',
    },
  },
  
  modal: {
    width: {
      sm: '400px',
      base: '500px',
      md: '600px',
      lg: '800px',
      xl: '1000px',
      full: '100%',
    },
    maxHeight: '90vh',
  },
};

export default designTokens;
