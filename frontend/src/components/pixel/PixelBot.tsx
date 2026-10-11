import React from 'react';

const BITMAP = [
  '..oooooooooo..',
  '..ossdddddwo..',
  '..ossdededwo..',
  'eoossdededwooe',
  '..ossdddddwo..',
  '..osswwwwwwo..',
  '..oooooooooo..',
  '....oooooo....',
  '....osswwo....',
  '....osswwo....',
  '....oooooo....',
  '....o....o....',
  '...ooo..ooo...',
];

const COLORS: Record<string, string> = {
  o: '#1F2A44',
  s: '#FEEFB8',
  w: '#FFF9E6',
  d: '#34405E',
  e: '#C4DAE8',
};

interface PixelBotProps {
  size?: number;
}

export const PixelBot: React.FC<PixelBotProps> = ({ size = 28 }) => (
  <svg
    width={size}
    height={(size * 13) / 14}
    viewBox="0 0 14 13"
    shapeRendering="crispEdges"
    aria-hidden="true"
    focusable="false"
  >
    {BITMAP.flatMap((row, y) =>
      [...row].flatMap((pixel, x) =>
        pixel === '.' ? [] : (
          <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={COLORS[pixel]} />
        )
      )
    )}
  </svg>
);
