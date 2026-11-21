import React from 'react';

interface BrandIconProps {
  className?: string;
}

export const BrandIcon: React.FC<BrandIconProps> = ({ className = 'w-10 h-10' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brandBgTeal" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#073b3a" />
          <stop offset="55%" stopColor="#0d5c57" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="brandGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#brandBgTeal)" />
      <rect
        x="2.5"
        y="2.5"
        width="59"
        height="59"
        rx="12"
        fill="none"
        stroke="#5eead4"
        strokeOpacity="0.25"
        strokeWidth="1"
      />
      <line
        x1="10"
        y1="50"
        x2="54"
        y2="50"
        stroke="#99f6e4"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="12" y="37" width="7.5" height="12" rx="2" fill="#5eead4" fillOpacity="0.82" />
      <rect x="22" y="30" width="7.5" height="19" rx="2" fill="#99f6e4" fillOpacity="0.88" />
      <rect x="32.5" y="23" width="7.5" height="26" rx="2" fill="#ccfbf1" fillOpacity="0.92" />
      <rect x="43" y="15" width="7.5" height="34" rx="2" fill="#ffffff" />
      <path
        d="M14 31 L25 24 L35 18 L46.5 10.5"
        fill="none"
        stroke="url(#brandGold)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M41.5 10 L47.5 10 L47.5 16"
        fill="none"
        stroke="url(#brandGold)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="34" r="11.5" fill="#094542" stroke="url(#brandGold)" strokeWidth="1.8" />
      <text
        x="32"
        y="34.8"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight="800"
        fontSize="11.5"
        fill="#ffffff"
      >
        Rp
      </text>
    </svg>
  );
};
