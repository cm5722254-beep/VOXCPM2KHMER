import { useMemo } from 'react';
import { designTokens, themePresets, componentTokens } from '../constants/designTokens';

export type ThemeMode = 'dark' | 'light';

export function useDesignTokens(themeMode: ThemeMode = 'dark') {
  return useMemo(() => {
    const theme = themePresets[themeMode];
    
    return {
      tokens: designTokens,
      theme,
      components: componentTokens,
      
      // Helper utilities
      utils: {
        /**
         * Get color with alpha channel
         * @param color - RGB color string
         * @param alpha - Alpha value (0-1)
         */
        withAlpha(color: string, alpha: number): string {
          if (color.startsWith('rgba')) {
            return color.replace(/[\d.]+\)$/g, `${alpha})`);
          }
          if (color.startsWith('rgb')) {
            return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
          }
          if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          }
          return color;
        },
        
        /**
         * Create glassmorphism background style
         */
        glass(blur: keyof typeof designTokens.glass.blur = 'md', opacity: number = 0.05): React.CSSProperties {
          return {
            backgroundColor: `rgba(255, 255, 255, ${opacity})`,
            backdropFilter: `blur(${designTokens.glass.blur[blur]})`,
            WebkitBackdropFilter: `blur(${designTokens.glass.blur[blur]})`,
          };
        },
        
        /**
         * Create transition style
         */
        transition(
          properties: string[] = ['all'],
          duration: keyof typeof designTokens.animations.duration = 'base',
          easing: keyof typeof designTokens.animations.easing = 'easeOut'
        ): string {
          const durationValue = designTokens.animations.duration[duration];
          const easingValue = designTokens.animations.easing[easing];
          return properties.map(prop => `${prop} ${durationValue} ${easingValue}`).join(', ');
        },
        
        /**
         * Get responsive value based on breakpoint
         */
        responsive<T>(values: Partial<Record<keyof typeof designTokens.layout.breakpoints, T>>, defaultValue: T): T {
          if (typeof window === 'undefined') return defaultValue;
          
          const width = window.innerWidth;
          const breakpoints = designTokens.layout.breakpoints;
          
          if (width >= parseInt(breakpoints['3xl']) && values['3xl']) return values['3xl'];
          if (width >= parseInt(breakpoints['2xl']) && values['2xl']) return values['2xl'];
          if (width >= parseInt(breakpoints.xl) && values.xl) return values.xl;
          if (width >= parseInt(breakpoints.lg) && values.lg) return values.lg;
          if (width >= parseInt(breakpoints.md) && values.md) return values.md;
          if (width >= parseInt(breakpoints.sm) && values.sm) return values.sm;
          if (values.xs) return values.xs;
          
          return defaultValue;
        },
      },
    };
  }, [themeMode]);
}

/**
 * Get Tailwind-compatible CSS classes for common patterns
 */
export const tw = {
  // Glass panels
  glass: {
    light: 'bg-white/[0.03] backdrop-blur-md border border-white/[0.08]',
    medium: 'bg-white/[0.05] backdrop-blur-md border border-white/[0.12]',
    heavy: 'bg-white/[0.08] backdrop-blur-lg border border-white/[0.18]',
  },
  
  // Buttons
  button: {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/25 transition-all active:scale-95',
    secondary: 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25 transition-all active:scale-95',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-95',
    ghost: 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.15] text-slate-200 font-semibold transition-all active:scale-95',
    outline: 'bg-transparent hover:bg-white/[0.05] border-2 border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-semibold transition-all',
  },
  
  // Cards
  card: {
    base: 'bg-[#1a1d23] border border-white/[0.08] rounded-2xl shadow-lg',
    elevated: 'bg-[#1a1d23] border border-white/[0.12] rounded-2xl shadow-xl',
    interactive: 'bg-[#1a1d23] border border-white/[0.08] hover:border-cyan-500/30 rounded-2xl shadow-lg transition-all cursor-pointer hover:shadow-cyan-500/10',
  },
  
  // Inputs
  input: {
    base: 'bg-black/40 border border-white/[0.15] focus:border-cyan-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all',
    error: 'bg-black/40 border border-red-500/40 focus:border-red-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all',
  },
  
  // Typography
  text: {
    primary: 'text-white font-semibold',
    secondary: 'text-slate-300',
    tertiary: 'text-slate-400',
    muted: 'text-slate-500',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
    info: 'text-cyan-400',
  },
  
  // Badges
  badge: {
    primary: 'px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-bold',
    secondary: 'px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 text-xs font-bold',
    success: 'px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold',
    warning: 'px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold',
    error: 'px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold',
    info: 'px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold',
  },
};

export default useDesignTokens;
