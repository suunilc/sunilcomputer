import React from 'react';

interface SunshineLogoProps {
  className?: string;
  size?: number | string;
}

export const SunshineLogo: React.FC<SunshineLogoProps> = ({ className = '', size = 56 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        {/* Background subtle texture lines */}
        <pattern id="sunshine_wavybg" width="500" height="20" patternUnits="userSpaceOnUse">
          <path d="M0 10 Q125 0 250 10 T500 10" fill="none" stroke="#e8dfd8" strokeWidth="1.5" />
        </pattern>

        {/* Top Text Path (Curved Arc) */}
        <path id="sunshine_topTextArc" d="M 58 250 A 192 192 0 0 1 442 250" fill="none" />
        
        {/* Bottom Text Path (Curved Arc) */}
        <path id="sunshine_bottomTextArc" d="M 72 250 A 178 178 0 0 0 428 250" fill="none" />

        {/* Clip path for the central inner illustration circle */}
        <clipPath id="sunshine_innerCircleClip">
          <circle cx="250" cy="250" r="148" />
        </clipPath>

        {/* Sun Ray Gradient */}
        <radialGradient id="sunshine_sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff5cc" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background Base Circle with soft ivory wave pattern */}
      <circle cx="250" cy="250" r="246" fill="#fffdfa" />
      <circle cx="250" cy="250" r="246" fill="url(#sunshine_wavybg)" />

      {/* Outer Dashed Decorative Ring */}
      <circle cx="250" cy="250" r="240" fill="none" stroke="#b31217" strokeWidth="3" strokeDasharray="10 5" />
      
      {/* Outer Solid Red Border Ring */}
      <circle cx="250" cy="250" r="232" fill="none" stroke="#b31217" strokeWidth="10" />

      {/* Outer Inner Thin Ring */}
      <circle cx="250" cy="250" r="224" fill="none" stroke="#b31217" strokeWidth="2.5" />

      {/* Top Curved Text: Sunshine Computer Institute & Service Center */}
      <text fontFamily="'Arial Black', 'Impact', 'Trebuchet MS', sans-serif" fontWeight="900" fontSize="27.5" fill="#6d1216">
        <textPath href="#sunshine_topTextArc" startOffset="50%" textAnchor="middle">
          Sunshine Computer Institute &amp; Service Center
        </textPath>
      </text>

      {/* Bottom Curved Text: ★ Banganga-10, Kapilvastu ★ */}
      <g fontFamily="'Arial Black', 'Impact', 'Trebuchet MS', sans-serif" fontWeight="900" fontSize="28" fill="#1b1b1b">
        <text>
          <textPath href="#sunshine_bottomTextArc" startOffset="50%" textAnchor="middle">
            <tspan fill="#0d6832" fontSize="34">★ </tspan>Banganga-10, Kapilvastu<tspan fill="#0d6832" fontSize="34"> ★</tspan>
          </textPath>
        </text>
      </g>

      {/* Middle Red Ring separating Text and Illustration */}
      <circle cx="250" cy="250" r="150" fill="none" stroke="#b31217" strokeWidth="8" />

      {/* INNER ILLUSTRATION AREA (Clipped into circle) */}
      <g clipPath="url(#sunshine_innerCircleClip)">
        {/* Sky Background with Warm Sun Glow */}
        <rect x="90" y="90" width="320" height="320" fill="#ffffff" />
        <circle cx="250" cy="245" r="100" fill="url(#sunshine_sunGlow)" />

        {/* Sun Rays (Radiant Golden Orange Rays) */}
        <g stroke="#e65c00" strokeWidth="4" strokeLinecap="round">
          <line x1="250" y1="245" x2="250" y2="120" strokeWidth="5" />
          <line x1="250" y1="245" x2="215" y2="135" strokeWidth="4" />
          <line x1="250" y1="245" x2="285" y2="135" strokeWidth="4" />
          <line x1="250" y1="245" x2="180" y2="160" strokeWidth="4.5" />
          <line x1="250" y1="245" x2="320" y2="160" strokeWidth="4.5" />
          <line x1="250" y1="245" x2="150" y2="195" strokeWidth="4.5" />
          <line x1="250" y1="245" x2="350" y2="195" strokeWidth="4.5" />
          <line x1="250" y1="245" x2="135" y2="230" strokeWidth="4" />
          <line x1="250" y1="245" x2="365" y2="230" strokeWidth="4" />
        </g>

        {/* Rising Sun Arc (Warm Orange & Yellow) */}
        <circle cx="250" cy="245" r="42" fill="#ffb81c" stroke="#e65c00" strokeWidth="6" />
        <circle cx="250" cy="245" r="32" fill="#fff3a8" />

        {/* Horizon Green Tree / Bush Silhouettes */}
        <g fill="#439c3e" stroke="#1f5822" strokeWidth="2">
          <circle cx="160" cy="235" r="14" />
          <circle cx="178" cy="238" r="11" />
          <circle cx="195" cy="232" r="16" />
          <circle cx="210" cy="242" r="10" />
        </g>
        <g fill="#439c3e" stroke="#1f5822" strokeWidth="2">
          <circle cx="290" cy="240" r="12" />
          <circle cx="305" cy="232" r="16" />
          <circle cx="325" cy="236" r="13" />
          <circle cx="342" cy="242" r="10" />
        </g>

        {/* Far Green Hills Fill */}
        <path d="M 90 250 Q 180 230 250 248 Q 320 230 410 250 L 410 400 L 90 400 Z" fill="#eaf6ea" />

        {/* Agricultural Terraced Crop Fields */}
        <path d="M 210 320 Q 280 240 400 245 L 410 350 Q 300 370 210 320 Z" fill="#e1f3e1" stroke="#0e5424" strokeWidth="3" />
        <g fill="none" stroke="#0e5424" strokeWidth="3.5" strokeLinecap="round">
          <path d="M 235 305 Q 310 255 395 258" />
          <path d="M 255 315 Q 325 270 390 275" />
          <path d="M 275 325 Q 338 290 380 300" />
          <path d="M 295 335 Q 345 310 370 325" />
        </g>

        {/* Left Side Terraced Field Slopes */}
        <path d="M 100 245 Q 170 240 240 260 Q 200 320 100 310 Z" fill="#ffffff" />
        <g fill="none" stroke="#0e5424" strokeWidth="3" strokeLinecap="round">
          <path d="M 105 255 Q 165 250 230 268" />
          <path d="M 108 268 Q 165 264 220 282" />
          <path d="M 112 282 Q 165 278 210 298" />
          <path d="M 118 295 Q 160 294 200 312" />
        </g>

        {/* Foreground Water / River Waves */}
        <path d="M 100 310 Q 180 305 240 330 Q 300 355 400 325 L 400 400 L 100 400 Z" fill="#ffffff" />
        
        <g fill="none" stroke="#094723" strokeWidth="4" strokeLinecap="round">
          <path d="M 105 325 Q 190 320 250 345 Q 310 370 395 345" />
          <path d="M 115 340 Q 185 336 245 358 Q 315 380 385 360" />
          <path d="M 130 355 Q 195 350 255 370 Q 310 388 375 375" />
          <path d="M 150 370 Q 210 366 265 382 Q 310 392 360 385" strokeWidth="3.5" />
          <path d="M 175 385 Q 230 380 275 392" strokeWidth="3" />
        </g>

        {/* Additional Green accent bushes near river */}
        <g fill="#2d7c32" stroke="#094723" strokeWidth="2">
          <circle cx="270" cy="330" r="8" />
          <circle cx="282" cy="326" r="10" />
          <circle cx="295" cy="332" r="7" />
          <circle cx="205" cy="318" r="7" />
          <circle cx="195" cy="322" r="6" />
        </g>
      </g>
    </svg>
  );
};
