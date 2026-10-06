import React from 'react';

export interface GlobalAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  borderGlow?: boolean;
  className?: string;
}

export const Avatar: React.FC<GlobalAvatarProps> = ({
  src,
  name = 'Dragon User',
  size = 'md',
  isOnline = false,
  borderGlow = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`relative inline-flex shrink-0 ${sizeClasses[size]} ${className}`}>
      <div
        className={`w-full h-full rounded-xl overflow-hidden bg-slate-100 dark:bg-[#152235] border flex items-center justify-center font-bold text-slate-800 dark:text-white ${
          borderGlow ? 'border-slate-200 dark:border-[#16D9FF]/40 shadow-[0_0_10px_rgba(22,217,255,0.25)]' : 'border-slate-200 dark:border-[#203244]'
        }`}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-cinzel text-[#16D9FF]">{initials || '🐲'}</span>
        )}
      </div>

      {isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00FFA8] border-2 border-slate-200 dark:border-[#070A12]" />
      )}
    </div>
  );
};
