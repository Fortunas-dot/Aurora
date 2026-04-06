import React, { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';
import { PixelCharacterConfig, HairStyle } from '../../constants/pixelCharacterOptions';

// ── Part type codes ─────────────────────────────────────────────
const _ = 0;   // empty
const H = 1;   // hair
const S = 2;   // skin
const D = 3;   // skin shadow (cheeks)
const W = 4;   // eye white
const E = 5;   // eye color (iris)
const M = 6;   // mouth
const T = 7;   // shirt
const U = 8;   // shirt fold/shadow
const P = 9;   // pants
const Q = 10;  // pants cuff (darker)
const K = 11;  // shoe
const B = 12;  // belt

// Side variants → base code + 20, rendered 30% darker for 3D depth
const Hs = 21; // hair side
const Ss = 22; // skin side
const Ts = 27; // shirt side
const Ps = 29; // pants side
const Qs = 30; // pants cuff side
const Ks = 31; // shoe side
const Bs = 32; // belt side

const GRID_W = 17;
const OUTLINE_COLOR = '#0E0E1A';

// ── HEAD grids (11 rows × 17 cols) ─────────────────────────────
// 3/4 view: 2-pixel side depth on the right edge

const HEADS: Record<HairStyle, number[][]> = {
  bob: [
    [_,_,_,_,_,H,H,H,H,H,Hs,Hs,_,_,_,_,_],
    [_,_,_,_,H,H,H,H,H,H,H,Hs,Hs,_,_,_,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_,_,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_,_,_],
    [_,_,_,H,S,S,S,S,S,S,S,H,Hs,Hs,_,_,_],
    [_,_,_,H,S,W,E,S,S,E,W,H,Hs,Hs,_,_,_],
    [_,_,_,D,S,S,S,S,S,S,S,D,Ss,Ss,_,_,_],
    [_,_,_,S,S,S,M,M,M,S,S,S,Ss,Ss,_,_,_],
    [_,_,_,_,S,S,S,S,S,S,S,Ss,Ss,_,_,_,_],
    [_,_,_,_,_,S,S,S,S,S,Ss,Ss,_,_,_,_,_],
    [_,_,_,_,_,_,S,S,S,Ss,_,_,_,_,_,_,_],
  ],
  long: [
    [_,_,_,_,_,H,H,H,H,H,Hs,Hs,_,_,_,_,_],
    [_,_,_,_,H,H,H,H,H,H,H,Hs,Hs,_,_,_,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_,_,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_,_,_],
    [_,_,_,H,S,S,S,S,S,S,S,H,Hs,Hs,_,_,_],
    [_,_,_,H,S,W,E,S,S,E,W,H,Hs,Hs,_,_,_],
    [_,_,_,H,S,S,S,S,S,S,S,H,Hs,Hs,_,_,_],
    [_,_,_,H,S,S,M,M,M,S,S,H,Hs,Hs,_,_,_],
    [_,_,_,H,S,S,S,S,S,S,S,H,Hs,_,_,_,_],
    [_,_,_,H,_,S,S,S,S,S,_,H,Hs,_,_,_,_],
    [_,_,_,H,_,_,S,S,S,_,_,H,Hs,_,_,_,_],
  ],
  spiky: [
    [_,_,_,H,_,_,H,H,H,_,_,H,_,_,_,_,_],
    [_,_,_,H,H,_,H,H,H,_,H,H,Hs,_,_,_,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_,_,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_,_,_],
    [_,_,_,_,S,S,S,S,S,S,S,Ss,Ss,_,_,_,_],
    [_,_,_,_,S,W,E,S,S,E,W,Ss,Ss,_,_,_,_],
    [_,_,_,D,S,S,S,S,S,S,S,D,Ss,Ss,_,_,_],
    [_,_,_,S,S,S,M,M,M,S,S,S,Ss,Ss,_,_,_],
    [_,_,_,_,S,S,S,S,S,S,S,Ss,Ss,_,_,_,_],
    [_,_,_,_,_,S,S,S,S,S,Ss,Ss,_,_,_,_,_],
    [_,_,_,_,_,_,S,S,S,Ss,_,_,_,_,_,_,_],
  ],
  curly: [
    [_,_,H,H,H,H,H,H,H,H,H,H,H,Hs,Hs,_,_],
    [_,_,H,H,H,H,H,H,H,H,H,H,H,Hs,Hs,_,_],
    [_,_,H,H,H,H,H,H,H,H,H,H,H,Hs,Hs,_,_],
    [_,_,H,H,H,H,H,H,H,H,H,H,H,Hs,Hs,_,_],
    [_,_,H,S,S,S,S,S,S,S,S,S,H,Ss,Ss,_,_],
    [_,_,H,S,S,W,E,S,S,E,W,S,H,Ss,Ss,_,_],
    [_,_,_,D,S,S,S,S,S,S,S,D,Ss,Ss,_,_,_],
    [_,_,_,S,S,S,M,M,M,S,S,S,Ss,Ss,_,_,_],
    [_,_,_,_,S,S,S,S,S,S,S,Ss,Ss,_,_,_,_],
    [_,_,_,_,_,S,S,S,S,S,Ss,Ss,_,_,_,_,_],
    [_,_,_,_,_,_,S,S,S,Ss,_,_,_,_,_,_,_],
  ],
};

// ── BODY grid (shared, 15 rows × 17 cols) ──────────────────────
// 3/4 view: right side depth on torso + right leg
// Left arm visible (closer to viewer), right arm hidden behind body

const BODY: number[][] = [
  [_,_,_,_,_,T,T,T,T,T,Ts,Ts,_,_,_,_,_],  // 0  collar
  [_,_,_,_,T,T,T,T,T,T,T,Ts,Ts,_,_,_,_],  // 1  shirt
  [_,_,_,T,T,T,T,T,T,T,T,T,Ts,Ts,_,_,_],  // 2  shirt wider
  [_,S,S,T,T,T,T,U,T,T,T,T,Ts,Ts,_,_,_],  // 3  left arm + fold + side
  [_,S,S,T,T,U,U,U,U,U,T,T,Ts,Ts,_,_,_],  // 4  left arm + crease + side
  [_,_,_,T,T,T,T,T,T,T,T,T,Ts,Ts,_,_,_],  // 5  shirt
  [_,_,_,_,T,T,T,T,T,T,T,Ts,Ts,_,_,_,_],  // 6  shirt bottom
  [_,_,_,_,B,B,B,B,B,B,B,Bs,Bs,_,_,_,_],  // 7  belt
  [_,_,_,_,P,P,P,P,P,P,P,Ps,Ps,_,_,_,_],  // 8  pants top
  [_,_,_,_,P,P,P,_,P,P,P,Ps,_,_,_,_,_],   // 9  legs split
  [_,_,_,_,P,P,P,_,P,P,P,Ps,_,_,_,_,_],   // 10 legs
  [_,_,_,_,P,P,P,_,P,P,P,Ps,_,_,_,_,_],   // 11 legs
  [_,_,_,_,Q,Q,Q,_,Q,Q,Q,Qs,_,_,_,_,_],   // 12 cuffs
  [_,_,_,K,K,K,K,_,K,K,K,K,Ks,_,_,_,_],   // 13 shoes
  [_,_,_,K,K,K,K,_,K,K,K,K,Ks,_,_,_,_],   // 14 shoes
];

// ── Grid builder ────────────────────────────────────────────────

function buildGrid(hairStyle: HairStyle): number[][] {
  return [...HEADS[hairStyle], ...BODY];
}

// ── Auto-outline: outline any empty cell adjacent to a fill ─────

function computeOutlines(grid: number[][]): [number, number][] {
  const set = new Set<string>();
  const rows = grid.length;
  const cols = grid[0].length;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === _) continue;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || grid[ny][nx] === _) {
          set.add(`${nx},${ny}`);
        }
      }
    }
  }

  const result: [number, number][] = [];
  set.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    result.push([x, y]);
  });
  return result;
}

// ── Color mapping ───────────────────────────────────────────────

function getBaseColor(part: number, cfg: PixelCharacterConfig): string {
  switch (part) {
    case H:  return cfg.hairColor;
    case S:  return cfg.skinColor;
    case D:  return darken(cfg.skinColor, 0.12);
    case W:  return '#FFFFFF';
    case E:  return cfg.eyeColor;
    case M:  return darken(cfg.skinColor, 0.32);
    case T:  return cfg.shirtColor;
    case U:  return darken(cfg.shirtColor, 0.18);
    case P:  return cfg.pantsColor;
    case Q:  return darken(cfg.pantsColor, 0.15);
    case K:  return cfg.shoeColor;
    case B:  return darken(cfg.pantsColor, 0.28);
    default: return 'transparent';
  }
}

function getColor(part: number, cfg: PixelCharacterConfig): string {
  if (part >= 20) {
    // Side variant: darken the base color for 3D depth
    return darken(getBaseColor(part - 20, cfg), 0.30);
  }
  return getBaseColor(part, cfg);
}

// ── Component ───────────────────────────────────────────────────

interface PixelCharacterProps {
  config: PixelCharacterConfig;
  size?: number;
}

export default function PixelCharacter({ config, size = 140 }: PixelCharacterProps) {
  const grid = useMemo(() => buildGrid(config.hairStyle), [config.hairStyle]);
  const outlines = useMemo(() => computeOutlines(grid), [grid]);

  const gridH = grid.length;
  // 1px padding so outlines that bleed outside the grid are visible
  const vbW = GRID_W + 2;
  const vbH = gridH + 2;
  const width = size;
  const height = Math.round(size * (vbH / vbW));

  return (
    <Svg width={width} height={height} viewBox={`-1 -1 ${vbW} ${vbH}`}>
      {/* Layer 1 — dark outlines around the silhouette */}
      {outlines.map(([x, y], i) => (
        <Rect key={`o${i}`} x={x} y={y} width={1} height={1} fill={OUTLINE_COLOR} />
      ))}

      {/* Layer 2 — colored fill pixels */}
      {grid.map((row, y) =>
        row.map((part, x) =>
          part !== _ ? (
            <Rect
              key={`${y}-${x}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={getColor(part, config)}
            />
          ) : null,
        ),
      )}
    </Svg>
  );
}

// ── Utility ─────────────────────────────────────────────────────

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
