import React from 'react';

const BITMAPS = {
  star: ['00011000', '00011000', '00111100', '11111111', '01111110', '00111100', '01100110', '11000011'],
  bowl: ['00000000', '10000001', '01000010', '00111100', '01111110', '11111111', '01111110', '00000000'],
  clock: ['00111100', '01000010', '10011001', '10011001', '10011101', '10000001', '01000010', '00111100'],
  cart: ['00011000', '00111100', '01111110', '11111111', '00011000', '00011000', '00100100', '00100100'],
  check: ['00000000', '00000011', '00000110', '00001100', '11011000', '01110000', '00100000', '00000000'],
  heart: ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000', '00000000'],
  bell: ['00011000', '00111100', '01111110', '01111110', '01111110', '11111111', '00011000', '00111100'],
  arrow: ['00011000', '00011100', '11111110', '11111111', '11111110', '00011100', '00011000', '00000000'],
} as const;

export type PixelIconName = keyof typeof BITMAPS;

interface PixelIconProps {
  name: PixelIconName;
  size?: number;
}

export const PixelIcon: React.FC<PixelIconProps> = ({ name, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 8 8"
    shapeRendering="crispEdges"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    {BITMAPS[name].flatMap((row, y) =>
      [...row].flatMap((pixel, x) =>
        pixel === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : []
      )
    )}
  </svg>
);
