import React, { useState, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeToggleProps {
  currentTheme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ currentTheme, onThemeChange }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme_mode') || localStorage.getItem('animestudio_theme_mode');
    return (saved as ThemeMode) || 'auto';
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme_mode', mode);
    
    if (mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const autoTheme = mediaQuery.matches ? 'dark' : 'light';
      onThemeChange(autoTheme);

      const handler = (e: MediaQueryListEvent) => {
        onThemeChange(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      onThemeChange(mode);
    }
  }, [mode, onThemeChange]);

  const handleModeChange = (newMode: ThemeMode) => {
    setMode(newMode);
    setIsOpen(false);
  };

  const getCurrentIcon = () => {
    if (mode === 'auto') return <Monitor size={15} className="text-emerald-400" />;
    if (currentTheme === 'dark') return <Moon size={15} className="text-indigo-400" />;
    return <Sun size={15} className="text-amber-400" />;
  };

  const getCurrentLabel = () => {
    if (mode === 'auto') return 'ស្វ័យប្រវត្តិ';
    if (currentTheme === 'dark') return 'ងងឹត';
    return 'ភ្លឺ';
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-glass flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
        style={{
          color: currentTheme === 'dark' ? '#f1f5f9' : '#1e293b',
        }}
        title="ប្តូររចនាប័ទ្មពណ៌ (Theme Mode: Light / Dark / Auto)"
      >
        {getCurrentIcon()}
        <span className="font-khmer">{getCurrentLabel()}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />

          {/* Dropdown Menu - Glass UI */}
          <div
            className="glass-panel-pro"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: '210px',
              borderRadius: '16px',
              padding: '8px',
              boxShadow: currentTheme === 'dark'
                ? '0 20px 45px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 242, 173, 0.1)'
                : '0 20px 45px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              animation: 'themeMenuSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Light Mode */}
            <button
              onClick={() => handleModeChange('light')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: mode === 'light'
                  ? currentTheme === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(59, 130, 246, 0.1)'
                  : 'transparent',
                border: mode === 'light'
                  ? currentTheme === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.2)'
                    : '1px solid rgba(59, 130, 246, 0.3)'
                  : '1px solid transparent',
                color: currentTheme === 'dark' ? '#e2e8f0' : '#1e293b',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: mode === 'light' ? 600 : 500,
                marginBottom: '4px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (mode !== 'light') {
                  e.currentTarget.style.background = currentTheme === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (mode !== 'light') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Sun size={18} style={{ color: '#f59e0b' }} />
              <span style={{ flex: 1, textAlign: 'left' }}>Light Mode (ភ្លឺ)</span>
              {mode === 'light' && (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
                  }}
                />
              )}
            </button>

            {/* Dark Mode */}
            <button
              onClick={() => handleModeChange('dark')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: mode === 'dark'
                  ? currentTheme === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(59, 130, 246, 0.1)'
                  : 'transparent',
                border: mode === 'dark'
                  ? currentTheme === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.2)'
                    : '1px solid rgba(59, 130, 246, 0.3)'
                  : '1px solid transparent',
                color: currentTheme === 'dark' ? '#e2e8f0' : '#1e293b',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: mode === 'dark' ? 600 : 500,
                marginBottom: '4px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (mode !== 'dark') {
                  e.currentTarget.style.background = currentTheme === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (mode !== 'dark') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Moon size={18} style={{ color: '#818cf8' }} />
              <span style={{ flex: 1, textAlign: 'left' }}>Dark Mode (ងងឹត)</span>
              {mode === 'dark' && (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#818cf8',
                    boxShadow: '0 0 8px rgba(129, 140, 248, 0.6)',
                  }}
                />
              )}
            </button>

            {/* Auto Mode */}
            <button
              onClick={() => handleModeChange('auto')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: mode === 'auto'
                  ? currentTheme === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(59, 130, 246, 0.1)'
                  : 'transparent',
                border: mode === 'auto'
                  ? currentTheme === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.2)'
                    : '1px solid rgba(59, 130, 246, 0.3)'
                  : '1px solid transparent',
                color: currentTheme === 'dark' ? '#e2e8f0' : '#1e293b',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: mode === 'auto' ? 600 : 500,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (mode !== 'auto') {
                  e.currentTarget.style.background = currentTheme === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (mode !== 'auto') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Monitor size={18} style={{ color: '#10b981' }} />
              <span style={{ flex: 1, textAlign: 'left' }}>Auto (ស្វ័យប្រវត្តិ)</span>
              {mode === 'auto' && (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                  }}
                />
              )}
            </button>

            {/* Info Text */}
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                borderTop: currentTheme === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : '1px solid rgba(0, 0, 0, 0.08)',
                fontSize: '11px',
                color: currentTheme === 'dark' ? '#94a3b8' : '#64748b',
                lineHeight: 1.4,
              }}
            >
              {mode === 'auto' && 'តាមប្រព័ន្ធប្រតិបត្តិការ'}
              {mode === 'light' && 'ប្រើពណ៌ស និងពណ៌ភ្លឺ'}
              {mode === 'dark' && 'ប្រើពណ៌ខ្មៅ និងពណ៌ងងឹត'}
            </div>
          </div>

          <style>{`
            @keyframes themeMenuSlideIn {
              from {
                opacity: 0;
                transform: translateY(-8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
};

// Quick toggle button (simple sun/moon toggle)
export const QuickThemeToggle: React.FC<ThemeToggleProps> = ({ currentTheme, onThemeChange }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    onThemeChange(currentTheme === 'dark' ? 'light' : 'dark');
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <button
      onClick={handleToggle}
      title={currentTheme === 'dark' ? 'ប្តូរទៅ Light Mode' : 'ប្តូរទៅ Dark Mode'}
      style={{
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '10px',
        background: currentTheme === 'dark'
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(0, 0, 0, 0.06)',
        border: currentTheme === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(0, 0, 0, 0.1)',
        color: currentTheme === 'dark' ? '#fbbf24' : '#f59e0b',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = currentTheme === 'dark'
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = currentTheme === 'dark'
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isAnimating ? 'rotate(360deg) scale(1.2)' : 'rotate(0deg) scale(1)',
        }}
      >
        {currentTheme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
      </div>
    </button>
  );
};
