import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<Props> = ({
  size = 'md',
  showTagline = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
  };

  return (
    <div className={`flex items-center gap-2 select-none group ${className}`}>
      {/* Dynamic Geometric Gradient Logo Emblem */}
      <div
        className={`${iconSizes[size]} relative rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-all duration-200 overflow-hidden shrink-0`}
      >
        {/* Subtle geometric backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent pointer-events-none" />
        
        {/* Modern DealSphere Emblem SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white transform group-hover:rotate-6 transition-transform"
        >
          {/* Shopping Bag Base with Play & Sphere Motif */}
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>

        {/* Small video play dot indicator */}
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-400 ring-1 ring-white" />
      </div>

      <div className="leading-tight">
        <div className={`font-display font-black tracking-tight text-slate-900 flex items-center ${textSizes[size]}`}>
          Deal<span className="text-indigo-600">Sphere</span>
        </div>
        {showTagline && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Creator &amp; Affiliate Hub
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
