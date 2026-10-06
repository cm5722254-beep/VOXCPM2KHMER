import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface GlobalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Modal: React.FC<GlobalModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = '2xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none font-khmer animate-in fade-in duration-200"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(7,10,18,0.85) 50%, rgba(3,5,10,0.98) 100%)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div className={`w-full ${maxWidthClasses[maxWidth]} rounded-2xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150 relative`}>
        {/* Top Dragon Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#16D9FF] to-transparent" />

        {/* Modal Header */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-[#203244] bg-white dark:bg-[#101925]/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#16D9FF]/20 to-[#8B5CF6]/20 border border-slate-200 dark:border-[#16D9FF]/30 flex items-center justify-center shadow-lg shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white font-cinzel tracking-wider">
                {title}
              </h3>
              {subtitle && <p className="text-[11px] text-[#94A3B8] mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-slate-800 dark:text-white hover:bg-slate-200 dark:bg-white/[0.08] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-[#94A3B8] custom-scrollbar flex flex-col gap-4">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="shrink-0 px-6 py-3.5 border-t border-slate-200 dark:border-[#203244] bg-slate-50 dark:bg-[#070A12]/80 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
