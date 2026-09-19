import React from 'react';

// Open-source Nintendo Mario-themed vector illustrations & drawings (SVG)

export const MarioCoin: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <ellipse cx="16" cy="16" rx="14" ry="15" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
    <ellipse cx="16" cy="16" rx="11" ry="12" fill="#FBBF24" />
    <rect x="14" y="9" width="4" height="14" rx="2" fill="#D97706" />
    <ellipse cx="11" cy="11" rx="2" ry="3" fill="#FEF3C7" />
  </svg>
);

export const MarioStar: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <polygon
      points="16,1 20.6,11.5 32,12.6 23.4,20.2 26,31.4 16,25.5 6,31.4 8.6,20.2 0,12.6 11.4,11.5"
      fill="#FBBF24"
      stroke="#D97706"
      strokeWidth="1.5"
    />
    {/* Expressive vertical Mario star eyes */}
    <ellipse cx="13" cy="16" rx="1.2" ry="3" fill="#1E293B" />
    <ellipse cx="19" cy="16" rx="1.2" ry="3" fill="#1E293B" />
  </svg>
);

export const SuperMushroom: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Stem */}
    <path
      d="M10 20C10 26 12 29 16 29C20 29 22 26 22 20H10Z"
      fill="#FED7AA"
      stroke="#78350F"
      strokeWidth="1.5"
    />
    <ellipse cx="13.5" cy="23.5" rx="0.8" ry="2" fill="#1E293B" />
    <ellipse cx="18.5" cy="23.5" rx="0.8" ry="2" fill="#1E293B" />
    {/* Cap */}
    <path
      d="M3 18C3 10 8 4 16 4C24 4 29 10 29 18C29 20 27 21 25 21H7C5 21 3 20 3 18Z"
      fill="#EF4444"
      stroke="#7F1D1D"
      strokeWidth="1.5"
    />
    {/* White Dots */}
    <circle cx="16" cy="12" r="5" fill="#FFFFFF" />
    <path d="M4 17C4 13 6 12 7 12C7 16 6 18 4 17Z" fill="#FFFFFF" />
    <path d="M28 17C28 13 26 12 25 12C25 16 26 18 28 17Z" fill="#FFFFFF" />
  </svg>
);

export const OneUpMushroom: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Stem */}
    <path
      d="M10 20C10 26 12 29 16 29C20 29 22 26 22 20H10Z"
      fill="#FED7AA"
      stroke="#78350F"
      strokeWidth="1.5"
    />
    <ellipse cx="13.5" cy="23.5" rx="0.8" ry="2" fill="#1E293B" />
    <ellipse cx="18.5" cy="23.5" rx="0.8" ry="2" fill="#1E293B" />
    {/* Cap */}
    <path
      d="M3 18C3 10 8 4 16 4C24 4 29 10 29 18C29 20 27 21 25 21H7C5 21 3 20 3 18Z"
      fill="#10B981"
      stroke="#064E3B"
      strokeWidth="1.5"
    />
    {/* White Dots */}
    <circle cx="16" cy="12" r="5" fill="#FFFFFF" />
    <path d="M4 17C4 13 6 12 7 12C7 16 6 18 4 17Z" fill="#FFFFFF" />
    <path d="M28 17C28 13 26 12 25 12C25 16 26 18 28 17Z" fill="#FFFFFF" />
  </svg>
);

export const QuestionBlock: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Brick Box */}
    <rect x="2" y="2" width="28" height="28" rx="4" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
    {/* Rivets in corners */}
    <circle cx="6" cy="6" r="1.2" fill="#78350F" />
    <circle cx="26" cy="6" r="1.2" fill="#78350F" />
    <circle cx="6" cy="26" r="1.2" fill="#78350F" />
    <circle cx="26" cy="26" r="1.2" fill="#78350F" />
    {/* Question Mark */}
    <text
      x="16"
      y="22"
      textAnchor="middle"
      fontSize="18"
      fontWeight="900"
      fontFamily="sans-serif"
      fill="#FFFFFF"
      stroke="#78350F"
      strokeWidth="0.8"
    >
      ?
    </text>
  </svg>
);

export const MarioCap: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Cap Dome */}
    <path
      d="M5 22C4 16 7 8 16 8C23 8 27 13 28 18C28 20 27 22 25 22H5Z"
      fill="#DC2626"
      stroke="#991B1B"
      strokeWidth="1.5"
    />
    {/* Visor Brim */}
    <path
      d="M4 21C2 21 1 23 3 24C8 26 22 26 28 23C30 22 29 21 26 21H4Z"
      fill="#B91C1C"
      stroke="#7F1D1D"
      strokeWidth="1.5"
    />
    {/* White Emblem with M */}
    <circle cx="16" cy="15" r="5" fill="#FFFFFF" />
    <text
      x="16"
      y="18.5"
      textAnchor="middle"
      fontSize="8"
      fontWeight="900"
      fontFamily="sans-serif"
      fill="#DC2626"
    >
      M
    </text>
  </svg>
);

export const SwitchConsoleVector: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Left Blue Joy-Con */}
    <path
      d="M12 4H6C3.8 4 2 5.8 2 8V24C2 26.2 3.8 28 6 28H12V4Z"
      fill="#00C3E3"
      stroke="#0F172A"
      strokeWidth="1.5"
    />
    <circle cx="7" cy="11" r="2.5" fill="#0F172A" />
    <circle cx="7" cy="19" r="1.5" fill="#0F172A" />
    {/* Center Screen Body */}
    <rect x="12" y="4" width="24" height="24" fill="#0F172A" stroke="#0F172A" strokeWidth="1.5" />
    <rect x="15" y="7" width="18" height="18" rx="2" fill="#1E293B" />
    {/* Right Red Joy-Con */}
    <path
      d="M36 4H42C44.2 4 46 5.8 46 8V24C46 26.2 44.2 28 42 28H36V4Z"
      fill="#FF3C28"
      stroke="#0F172A"
      strokeWidth="1.5"
    />
    <circle cx="41" cy="11" r="1.5" fill="#0F172A" />
    <circle cx="41" cy="19" r="2.5" fill="#0F172A" />
  </svg>
);
