import React from 'react';

/**
 * MemphisConfetti Component
 * 9 animated geometric inline SVGs in flat Memphis colors with thick black outlines,
 * animated purely via CSS keyframes (NO JS).
 */
export function MemphisConfetti() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* 1. Coral Triangle - Top Left drifting */}
      <div className="absolute top-16 left-6 lg:left-14 animate-drift-slow">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <polygon
            points="24,6 44,42 4,42"
            fill="#ff5b57"
            stroke="#17140d"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 2. Teal Quarter-Arc - Top Right sway */}
      <div className="absolute top-12 right-20 lg:right-36 animate-sway-gentle">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <path
            d="M 6 50 A 44 44 0 0 1 50 6 L 50 50 Z"
            fill="#12b3a4"
            stroke="#17140d"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 3. Mustard Dotted Circle - Center-Left drifting */}
      <div className="absolute top-72 left-4 lg:left-24 animate-drift-reverse">
        <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
          <circle
            cx="27"
            cy="27"
            r="23"
            fill="#ffc531"
            stroke="#17140d"
            strokeWidth="3.5"
          />
          {/* Inner decorative dots */}
          <circle cx="27" cy="18" r="2.5" fill="#17140d" />
          <circle cx="18" cy="27" r="2.5" fill="#17140d" />
          <circle cx="36" cy="27" r="2.5" fill="#17140d" />
          <circle cx="27" cy="36" r="2.5" fill="#17140d" />
          <circle cx="27" cy="27" r="2.5" fill="#17140d" />
        </svg>
      </div>

      {/* 4. Violet Plus-Sign - Center-Right slow continuous spin */}
      <div className="absolute top-44 right-1/3 lg:right-[42%] animate-spin-confetti">
        <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
          <path
            d="M 17 4 H 29 V 17 H 42 V 29 H 29 V 42 H 17 V 29 H 4 V 17 H 17 Z"
            fill="#6b5be6"
            stroke="#17140d"
            strokeWidth="3.5"
            strokeLinejoin="miter"
          />
        </svg>
      </div>

      {/* 5. Black Squiggle "Bacteria" Line - Mid-Left swaying */}
      <div className="absolute top-[480px] left-8 lg:left-16 animate-sway-gentle">
        <svg width="68" height="42" viewBox="0 0 68 42" fill="none">
          <path
            d="M 5 21 Q 16 4, 27 21 T 49 21 T 63 21"
            stroke="#17140d"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* 6. Mustard Half-Circle - Bottom-Center bobbing */}
      <div className="absolute bottom-16 left-1/3 lg:left-[35%] animate-bob-slow">
        <svg width="52" height="30" viewBox="0 0 52 30" fill="none">
          <path
            d="M 4 26 A 22 22 0 0 1 48 26 Z"
            fill="#ffc531"
            stroke="#17140d"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 7. Small Teal Solid Dot - Floats between columns */}
      <div className="absolute top-[360px] left-1/2 -ml-8 animate-float-diag">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle
            cx="11"
            cy="11"
            r="8.5"
            fill="#12b3a4"
            stroke="#17140d"
            strokeWidth="3"
          />
        </svg>
      </div>

      {/* 8. Sky-Blue Zigzag - Bottom-Right bobbing */}
      <div className="absolute top-[520px] right-12 lg:right-28 animate-bob-slow">
        <svg width="64" height="36" viewBox="0 0 64 36" fill="none">
          <path
            d="M 4 28 L 18 8 L 32 28 L 46 8 L 60 28"
            stroke="#3aa0ff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* 9. Coral Striped/Terrazzo Circle - Top-Right behind dashboard spinning */}
      <div className="absolute top-28 -right-4 lg:right-6 animate-spin-confetti-rev">
        <svg width="74" height="74" viewBox="0 0 74 74" fill="none">
          <defs>
            <pattern
              id="coral-stripes"
              width="10"
              height="10"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="10"
                stroke="#17140d"
                strokeWidth="3"
              />
            </pattern>
          </defs>
          <circle
            cx="37"
            cy="37"
            r="32"
            fill="#ff5b57"
            stroke="#17140d"
            strokeWidth="3.5"
          />
          <circle
            cx="37"
            cy="37"
            r="32"
            fill="url(#coral-stripes)"
          />
          <circle
            cx="37"
            cy="37"
            r="32"
            fill="none"
            stroke="#17140d"
            strokeWidth="3.5"
          />
        </svg>
      </div>

      {/* Additional small playful accents */}
      {/* Floating tiny mustard star/cross */}
      <div className="absolute top-[220px] right-10 lg:right-16 animate-drift-slow">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M 12 2 L 15 9 L 22 12 L 15 15 L 12 22 L 9 15 L 2 12 L 9 9 Z"
            fill="#ffc531"
            stroke="#17140d"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
