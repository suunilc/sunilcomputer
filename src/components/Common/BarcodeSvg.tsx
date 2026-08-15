import React from 'react';

interface BarcodeSvgProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

// Generates a Code 128 / Code 39 style visual bar pattern from any string input
export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  width = 200,
  height = 50,
  showText = true,
  className = '',
}) => {
  const codeStr = value || 'SUNSHINE-000';
  
  // Deterministic bar widths based on character hash values
  const bars: { x: number; w: number }[] = [];
  let currentX = 10;
  const barHeight = showText ? height - 16 : height;
  const totalBarSpace = width - 20;

  // Generate pseudo Code128 pattern from character codes
  let totalWeight = 0;
  const weights: number[] = [];
  
  for (let i = 0; i < codeStr.length; i++) {
    const charCode = codeStr.charCodeAt(i);
    const w1 = (charCode % 3) + 1;
    const w2 = ((charCode * 7) % 3) + 1;
    const w3 = ((charCode * 13) % 2) + 1;
    weights.push(w1, w2, w3);
    totalWeight += w1 + w2 + w3;
  }

  const unitWidth = totalBarSpace / (totalWeight || 1);

  for (let i = 0; i < weights.length; i += 2) {
    const barWidth = Math.max(1, weights[i] * unitWidth);
    const gapWidth = Math.max(1, (weights[i + 1] || 1) * unitWidth);
    bars.push({ x: currentX, w: barWidth });
    currentX += barWidth + gapWidth;
  }

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white p-1 rounded">
        {/* Quiet zone background */}
        <rect width={width} height={height} fill="#FFFFFF" />
        
        {/* Bars */}
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y={4}
            width={bar.w}
            height={barHeight}
            fill="#000000"
          />
        ))}

        {/* Text */}
        {showText && (
          <text
            x={width / 2}
            y={height - 2}
            textAnchor="middle"
            fill="#000000"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {codeStr}
          </text>
        )}
      </svg>
    </div>
  );
};
