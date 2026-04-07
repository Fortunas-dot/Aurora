import React, { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';
import { PixelCharacterConfig, HairStyle } from '../../constants/pixelCharacterOptions';

// ═══════════════════════════════════════════════════════════════
// HABBO-STYLE LAYERED PIXEL CHARACTER
//
// Like real Habbo, characters are built from stacked sprite layers:
//   skin → shirt → pants → shoes → hair → face
// Each layer is a grid of shade values. Layers composite back-to-front
// into a single color grid, then render once as SVG.
//
// Grid: 16 wide × 28 tall
// ═══════════════════════════════════════════════════════════════

const GRID_W = 16;
const GRID_H = 28;
const OUTLINE = '#0C0C18';

// Shade codes (used in body/clothing layers)
const _ = 0;  // transparent
const B = 1;  // base color
const S = 2;  // shadow (~18% darker)
const D = 3;  // deep shadow (~35% darker)

// Build full GRID_H layer from sparse row definitions
function layer(rows: Record<number, number[]>): number[][] {
  return Array.from({ length: GRID_H }, (__, i) =>
    rows[i] || new Array(GRID_W).fill(_),
  );
}

// ═══════════════════════════════════════════════════════════════
// SPRITE LAYERS
// ═══════════════════════════════════════════════════════════════

// SKIN — head dome, neck, exposed arms/hands
const SKIN = layer({
  2:  [_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_],  // head crown
  3:  [_,_,_,_,B,B,B,B,B,B,B,B,_,_,_,_],
  4:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],  // widest
  5:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
  6:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],  // forehead
  7:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],  // eye area
  8:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],  // nose
  9:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],  // mouth
  10: [_,_,_,_,B,B,B,B,B,B,B,S,_,_,_,_],  // jaw narrows
  11: [_,_,_,_,_,B,B,B,B,B,S,_,_,_,_,_],  // chin
  12: [_,_,_,_,_,_,B,B,B,S,_,_,_,_,_,_],  // neck
  13: [_,_,_,_,_,B,B,B,B,B,S,_,_,_,_,_],  // upper torso
  14: [_,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_],  // left arm
  15: [_,B,S,_,_,_,_,_,_,_,_,_,_,_,_,_],
  16: [_,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_],
  17: [_,B,S,_,_,_,_,_,_,_,_,_,_,_,_,_],
  18: [_,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_],
  19: [_,_,B,_,_,_,_,_,_,_,_,_,_,_,_,_],  // hand
});

// SHIRT — torso clothing with fold detail
const SHIRT = layer({
  13: [_,_,_,_,_,B,B,B,B,B,S,_,_,_,_,_],  // collar
  14: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],  // shirt body
  15: [_,_,_,B,B,S,D,D,S,B,B,S,D,_,_,_],  // fold detail
  16: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
  17: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
  18: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
});

// PANTS — includes belt, legs with 1px gap
const PANTS = layer({
  19: [_,_,_,D,D,D,D,D,D,D,D,D,_,_,_,_],  // belt
  20: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],  // pants top
  21: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
  22: [_,_,_,B,B,B,_,B,B,B,B,S,_,_,_,_],  // legs split
  23: [_,_,_,B,B,B,_,B,B,B,B,S,_,_,_,_],
  24: [_,_,_,B,B,S,_,B,B,B,S,S,_,_,_,_],  // lower legs
  25: [_,_,_,S,S,S,_,S,S,S,S,S,_,_,_,_],  // cuffs
});

// SHOES — wider than legs
const SHOES = layer({
  26: [_,_,B,B,B,B,_,B,B,B,B,B,S,_,_,_],
  27: [_,_,B,B,S,D,_,B,B,B,S,D,D,_,_,_],
});

// FACE — special codes: 1=eye white, 2=iris, 3=mouth, 4=nose hint
const FACE = layer({
  7: [_,_,_,_,_,1,2,_,_,1,2,_,_,_,_,_],   // eyes (white + iris)
  8: [_,_,_,_,_,_,_,_,4,_,_,_,_,_,_,_],   // nose
  9: [_,_,_,_,_,_,_,3,3,_,_,_,_,_,_,_],   // mouth
});

// ═══════════════════════════════════════════════════════════════
// HAIR VARIANTS — overlay on top of head
// ═══════════════════════════════════════════════════════════════

const HAIRS: Record<HairStyle, number[][]> = {
  bob: layer({
    0: [_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_],   // crown
    1: [_,_,_,_,B,B,B,B,B,B,B,S,_,_,_,_],
    2: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    3: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    4: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    5: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],   // covers forehead
    6: [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],   // sides only — face visible
    7: [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],
    8: [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],
  }),

  long: layer({
    0:  [_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_],
    1:  [_,_,_,_,B,B,B,B,B,B,B,S,_,_,_,_],
    2:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    3:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    4:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    5:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    6:  [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],
    7:  [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],
    8:  [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],
    9:  [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],  // past jaw
    10: [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],  // beside neck
    11: [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],
    12: [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],
    13: [_,_,_,_,_,_,_,_,_,_,_,S,_,_,_,_],  // tapers off
  }),

  spiky: layer({
    0: [_,_,B,_,B,_,B,B,B,_,B,_,B,_,_,_],  // spikes!
    1: [_,_,_,B,B,B,B,B,B,B,B,S,_,_,_,_],
    2: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    3: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    4: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    // no bangs — forehead exposed
  }),

  curly: layer({
    0: [_,_,_,B,B,B,B,B,B,B,B,B,B,_,_,_],  // voluminous
    1: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],  // wider than head
    2: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    3: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    4: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    5: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],  // covers forehead
    6: [_,_,B,_,_,_,_,_,_,_,_,_,B,S,_,_],  // wide frame
    7: [_,_,B,_,_,_,_,_,_,_,_,_,B,S,_,_],
    8: [_,_,_,_,_,_,_,_,_,_,_,_,_,S,_,_],
  }),
};

// ═══════════════════════════════════════════════════════════════
// LAYER COMPOSITING — stack all layers into one color grid
// ═══════════════════════════════════════════════════════════════

function compositeCharacter(cfg: PixelCharacterConfig): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: GRID_H }, () =>
    new Array(GRID_W).fill(null),
  );

  // Layer order: back → front (later layers override earlier)
  const layers: { data: number[][]; color: (v: number) => string }[] = [
    { data: SKIN,  color: v => tint(cfg.skinColor, v) },
    { data: SHIRT, color: v => tint(cfg.shirtColor, v) },
    { data: PANTS, color: v => tint(cfg.pantsColor, v) },
    { data: SHOES, color: v => tint(cfg.shoeColor, v) },
    { data: HAIRS[cfg.hairStyle], color: v => tint(cfg.hairColor, v) },
    { data: FACE,  color: v => faceColor(v, cfg) },
  ];

  for (const l of layers) {
    for (let y = 0; y < GRID_H; y++) {
      const row = l.data[y];
      for (let x = 0; x < GRID_W; x++) {
        if (row[x]) grid[y][x] = l.color(row[x]);
      }
    }
  }
  return grid;
}

function tint(hex: string, v: number): string {
  if (v === B) return hex;
  if (v === S) return darken(hex, 0.18);
  if (v === D) return darken(hex, 0.35);
  return hex;
}

function faceColor(v: number, cfg: PixelCharacterConfig): string {
  if (v === 1) return '#FFFFFF';                    // eye white
  if (v === 2) return cfg.eyeColor;                 // iris
  if (v === 3) return darken(cfg.skinColor, 0.35);  // mouth
  if (v === 4) return darken(cfg.skinColor, 0.08);  // nose hint
  return cfg.skinColor;
}

// ═══════════════════════════════════════════════════════════════
// AUTO-OUTLINE — dark border around filled pixels
// ═══════════════════════════════════════════════════════════════

function computeOutlines(grid: (string | null)[][]): [number, number][] {
  const set = new Set<string>();
  const rows = grid.length;
  const cols = grid[0].length;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!grid[y][x]) continue;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || !grid[ny][nx]) {
          set.add(`${nx},${ny}`);
        }
      }
    }
  }

  const result: [number, number][] = [];
  set.forEach((key) => {
    const [x, y] = key.split(',').map(Number);
    result.push([x, y]);
  });
  return result;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

interface PixelCharacterProps {
  config: PixelCharacterConfig;
  size?: number;
}

export default function PixelCharacter({ config, size = 140 }: PixelCharacterProps) {
  const grid = useMemo(() => compositeCharacter(config), [
    config.skinColor, config.hairStyle, config.hairColor,
    config.eyeColor, config.shirtColor, config.pantsColor, config.shoeColor,
  ]);
  const outlines = useMemo(() => computeOutlines(grid), [grid]);

  const vbW = GRID_W + 2;
  const vbH = GRID_H + 2;
  const width = size;
  const height = Math.round(size * (vbH / vbW));

  return (
    <Svg width={width} height={height} viewBox={`-1 -1 ${vbW} ${vbH}`}>
      {/* Dark outlines */}
      {outlines.map(([x, y], i) => (
        <Rect key={`o${i}`} x={x} y={y} width={1} height={1} fill={OUTLINE} />
      ))}
      {/* Composited color fill */}
      {grid.map((row, y) =>
        row.map((color, x) =>
          color ? (
            <Rect key={`${y}-${x}`} x={x} y={y} width={1} height={1} fill={color} />
          ) : null,
        ),
      )}
    </Svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════

function darken(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 0xff) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
