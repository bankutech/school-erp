import React from 'react';

export interface FrappeLogoProps {
  className?: string;
  size?: number; // pixel width/height of the square icon mark
  showText?: boolean;
  textClassName?: string;
  subtext?: string;
  subtextClassName?: string;
}

/**
 * SRM Academy Artisanal Institutional Crest
 * Meticulously crafted vector emblem featuring heraldic shield, open book of wisdom,
 * torch of enlightenment, and scholastic typography.
 */
export const SRMAcademyCrest: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] p-1 shadow-md shadow-indigo-950/40 border border-amber-500/30 shrink-0 select-none overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      aria-label="SRM Academy Crest"
    >
      <svg
        viewBox="0 0 48 48"
        width={size - 4}
        height={size - 4}
        className="w-full h-full block"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shieldGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="crestIndigo" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>

        {/* Heraldic Shield Contour */}
        <path
          d="M24 4L39 9V22C39 31.5 32.5 39.5 24 43C15.5 39.5 9 31.5 9 22V9L24 4Z"
          fill="url(#crestIndigo)"
          stroke="url(#shieldGold)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Inner Filigree Border */}
        <path
          d="M24 7.5L36 11.5V21.5C36 29.2 30.8 35.8 24 38.8C17.2 35.8 12 29.2 12 21.5V11.5L24 7.5Z"
          stroke="#f59e0b"
          strokeWidth="0.7"
          strokeOpacity="0.5"
          fill="none"
        />

        {/* Open Book of Scholarly Wisdom */}
        <path
          d="M17 24C19.5 22.8 22 23 24 24.2C26 23 28.5 22.8 31 24V31C28.5 30 26 30.2 24 31.2C22 30.2 19.5 30 17 31V24Z"
          fill="#fef3c7"
          stroke="#b45309"
          strokeWidth="0.8"
        />
        <path d="M24 24.2V31.2" stroke="#b45309" strokeWidth="0.8" />

        {/* Torch of Enlightenment above the book */}
        <path
          d="M24 12C24.8 13.5 26 15 25 16.5C24.3 17.5 23.7 17.5 23 16.5C22 15 23.2 13.5 24 12Z"
          fill="#fbbf24"
        />
        <circle cx="24" cy="14" r="1.5" fill="#ef4444" opacity="0.8" />

        {/* Laurel Wreath Accents */}
        <path
          d="M14 16C13.5 19 14 23 15 26"
          stroke="#fef3c7"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeDasharray="1 2"
        />
        <path
          d="M34 16C34.5 19 34 23 33 26"
          stroke="#fef3c7"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeDasharray="1 2"
        />
      </svg>
    </div>
  );
};

export const FrappeLogoMark: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return <SRMAcademyCrest size={size} className={className} />;
};

export const FrappeLogo: React.FC<FrappeLogoProps> = ({
  className = '',
  size = 32,
  showText = false,
  textClassName = 'text-slate-900',
  subtext = 'Institutional ERP System',
  subtextClassName = 'text-slate-500',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <SRMAcademyCrest size={size} />

      {showText && (
        <div className="truncate text-left">
          <div className={`font-serif font-bold text-base tracking-tight leading-snug ${textClassName}`}>
            SRM Academy
          </div>
          {subtext && (
            <div className={`text-[10px] font-mono tracking-wider uppercase leading-none mt-0.5 ${subtextClassName}`}>
              {subtext}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FrappeLogo;
