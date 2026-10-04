import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModernModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  glowColor?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose';
}

const sizeClasses = {
  sm: '500px',
  md: '720px',
  lg: '960px',
  xl: '1200px',
  full: '95vw',
};

const glowColors = {
  cyan: 'rgba(56, 189, 248, 0.08)',
  purple: 'rgba(139, 92, 246, 0.08)',
  emerald: 'rgba(16, 185, 129, 0.08)',
  amber: 'rgba(245, 158, 11, 0.08)',
  rose: 'rgba(244, 63, 94, 0.08)',
};

export const ModernModal: React.FC<ModernModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  glowColor = 'cyan',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes modernModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modernModalSlideIn {
          from {
            transform: scale(0.95) translateY(20px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes modernModalShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          animation: 'modernModalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Modal Container */}
        <div
          ref={modalRef}
          style={{
            width: '100%',
            maxWidth: sizeClasses[size],
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #111827 0%, #0f1623 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            boxShadow: `
              0 24px 48px rgba(0, 0, 0, 0.8),
              0 0 0 1px rgba(255, 255, 255, 0.05) inset,
              0 8px 32px ${glowColors[glowColor]}
            `,
            overflow: 'hidden',
            animation: 'modernModalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
          }}
        >
          {/* Shimmer effect overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${glowColors[glowColor]}, transparent)`,
              backgroundSize: '200% 100%',
              animation: 'modernModalShimmer 3s linear infinite',
              pointerEvents: 'none',
            }}
          />

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              background: `linear-gradient(90deg, ${glowColors[glowColor]} 0%, transparent 100%)`,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {icon && (
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                  }}
                >
                  {icon}
                </div>
              )}
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#f8fafc',
                  letterSpacing: '0.01em',
                  margin: 0,
                }}
              >
                {title}
              </h2>
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              color: '#e2e8f0',
            }}
            className="modern-scrollbar"
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '16px 24px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                flexShrink: 0,
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>

      {/* Scrollbar styles */}
      <style>{`
        .modern-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .modern-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        .modern-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  );
};

// Modern Button Components for consistent modal actions
interface ModernButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  icon,
  loading = false,
  fullWidth = false,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
      color: '#fff',
      border: '1px solid rgba(14, 165, 233, 0.5)',
      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
      hoverShadow: '0 6px 20px rgba(14, 165, 233, 0.4)',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.06)',
      color: '#f1f5f9',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: 'none',
      hoverShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    },
    success: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: '#fff',
      border: '1px solid rgba(16, 185, 129, 0.5)',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
      hoverShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: '#fff',
      border: '1px solid rgba(239, 68, 68, 0.5)',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
      hoverShadow: '0 6px 20px rgba(239, 68, 68, 0.4)',
    },
    ghost: {
      background: 'transparent',
      color: '#94a3b8',
      border: '1px solid transparent',
      boxShadow: 'none',
      hoverShadow: 'none',
    },
  };

  const sizes = {
    sm: { padding: '6px 14px', fontSize: '12px' },
    md: { padding: '10px 20px', fontSize: '13px' },
    lg: { padding: '12px 28px', fontSize: '14px' },
  };

  const style = variants[variant];
  const sizeStyle = sizes[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...sizeStyle,
        borderRadius: '8px',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        border: style.border,
        background: style.background,
        color: style.color,
        boxShadow: isHovered && !disabled ? style.hoverShadow : style.boxShadow,
        transform: isPressed && !disabled ? 'scale(0.98)' : isHovered && !disabled ? 'translateY(-1px)' : 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <div
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {!loading && icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {children}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

// Input Field Component
interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  error,
  icon,
  fullWidth = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div style={{ marginBottom: '16px', width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            color: '#94a3b8',
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
              display: 'flex',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </div>
        )}
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          style={{
            width: '100%',
            padding: icon ? '10px 14px 10px 40px' : '10px 14px',
            background: '#0b0f19',
            border: `1px solid ${error ? '#ef4444' : isFocused ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)'}`,
            borderRadius: '8px',
            color: '#f1f5f9',
            fontSize: '13px',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: isFocused ? '0 0 0 3px rgba(56, 189, 248, 0.1)' : 'none',
            ...(props.style || {}),
          }}
        />
      </div>
      {error && (
        <p
          style={{
            marginTop: '4px',
            fontSize: '11px',
            color: '#ef4444',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Select Field Component
interface ModernSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
}

export const ModernSelect: React.FC<ModernSelectProps> = ({
  label,
  error,
  fullWidth = true,
  options,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div style={{ marginBottom: '16px', width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            color: '#94a3b8',
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
      )}
      <select
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: '#0b0f19',
          border: `1px solid ${error ? '#ef4444' : isFocused ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)'}`,
          borderRadius: '8px',
          color: '#f1f5f9',
          fontSize: '13px',
          transition: 'all 0.2s ease',
          outline: 'none',
          boxShadow: isFocused ? '0 0 0 3px rgba(56, 189, 248, 0.1)' : 'none',
          cursor: 'pointer',
          ...(props.style || {}),
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p
          style={{
            marginTop: '4px',
            fontSize: '11px',
            color: '#ef4444',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};
