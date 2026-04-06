import React, { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';
import { PixelCharacterConfig, HairStyle } from '../../constants/pixelCharacterOptions';

// ── Part codes ──────────────────────────────────────────────
const _ = 0;
const H = 1;   // hair
const S = 2;   // skin
const W = 4;   // eye white (unused but reserved)
const E = 5;   // eye color (simple dot)
const M = 6;   // mouth (single pixel)
const T = 7;   // shirt
const U = 8;   // shirt fold/crease
const P = 9;   // pants
const Q = 10;  // pants cuff
const K = 11;  // shoe
const B = 12;  // belt

// Side variants: code + 20 → rendered 30% darker (3D right-side face)
const Hs = 21;
const Ss = 22;
const Ts = 27;
const Ps = 29;
const Qs = 30;
const Ks = 31;
const Bs = 32;

const GRID_W = 15;
const OUTLINE_COLOR = '#0E0E1A';

// ════════════════════════════════════════════════════════════════
// HABBO-STYLE CHARACTER GRIDS
//
// Design principles:
//   • Cube-shaped head (rectangular block with visible right side)
//   • 50% head / 50% body ratio (big head, stubby body)
//   • Simple dot eyes, single-pixel mouth
//   • Blocky torso with one visible arm
//   • Wide 2px gap between stubby legs
//   • Everything reads as isometric blocks
// ════════════════════════════════════════════════════════════════

// ── HEAD grids (10 rows × 15 cols) ─────────────────────────

const HEADS: Record<HairStyle, number[][]> = {
  bob: [
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_],
    [_,_,_,S,S,S,S,S,S,S,S,S,Ss,Ss,_],
    [_,_,_,S,S,E,S,S,S,E,S,S,Ss,Ss,_],
    [_,_,_,S,S,S,S,S,S,S,S,S,Ss,Ss,_],
    [_,_,_,S,S,S,S,M,S,S,S,S,Ss,Ss,_],
    [_,_,_,S,S,S,S,S,S,S,S,S,Ss,Ss,_],
    [_,_,_,_,_,_,S,S,S,Ss,_,_,_,_,_],
  ],
  long: [
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_],
    [_,_,_,H,S,S,S,S,S,S,S,H,Hs,Hs,_],
    [_,_,_,H,S,E,S,S,S,E,S,H,Hs,Hs,_],
    [_,_,_,H,S,S,S,S,S,S,S,H,Hs,Hs,_],
    [_,_,_,H,S,S,S,M,S,S,S,H,Hs,Hs,_],
    [_,_,_,H,S,S,S,S,S,S,S,H,Hs,Hs,_],
    [_,_,_,H,_,_,S,S,S,Ss,_,H,Hs,_,_],
  ],
  spiky: [
    [_,_,H,_,H,_,H,H,H,_,H,_,Hs,_,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_],
    [_,_,_,H,H,H,H,H,H,H,H,H,Hs,Hs,_],
    [_,_,_,S,S,S,S,S,S,S,S,S,Ss,Ss,_],
    [_,_,_,S,S,E,S,S,S,E,S,S,Ss,Ss,_],
    [_,_,_,S,S,S,S,S,S,S,S,S,Ss,Ss,_],
    [_,_,_,S,S,S,S,M,S,S,S,S,Ss,Ss,_],
    [_,_,_,S,S,S,S,S,S,S,S,S,Ss,Ss,_],
    [_,_,_,_,_,_,S,S,S,Ss,_,_,_,_,_],
  ],
  curly: [
    [_,_,H,H,H,H,H,H,H,H,H,H,H,Hs,_],
    [_,_,H,H,H,H,H,H,H,H,H,H,H,Hs,_],
    [_,_,H,H,H,H,H,H,H,H,H,H,H,Hs,_],
    [_,_,H,H,H,H,H,H,H,H,H,H,H,Hs,_],
    [_,_,H,S,S,S,S,S,S,S,S,S,H,Ss,_],
    [_,_,H,S,S,E,S,S,S,E,S,S,H,Ss,_],
    [_,_,_,S,S,S,S,S,S,S,S,S,Ss,Ss,_],
    [_,_,_,S,S,S,S,M,S,S,S,S,Ss,Ss,_],
    [_,_,_,S,S,S,S,S,S,S,S,S,Ss,Ss,_],
    [_,_,_,_,_,_,S,S,S,Ss,_,_,_,_,_],
  ],
};

// ── BODY grid (shared, 10 rows × 15 cols) ──────────────────
// Short stubby torso, one arm visible, wide leg gap

const BODY: number[][] = [
  [_,_,_,T,T,T,T,T,T,T,T,Ts,Ts,_,_],  // shirt top
  [_,S,S,T,T,T,T,T,T,T,T,Ts,Ts,_,_],  // arm + shirt
  [_,S,S,T,T,T,U,U,T,T,T,Ts,Ts,_,_],  // arm + crease
  [_,_,_,T,T,T,T,T,T,T,T,Ts,Ts,_,_],  // shirt bottom
  [_,_,_,P,P,P,P,P,P,P,P,Ps,Ps,_,_],  // pants
  [_,_,_,P,P,P,_,_,P,P,P,Ps,_,_,_],   // legs split (2px gap)
  [_,_,_,P,P,P,_,_,P,P,P,Ps,_,_,_],   // legs
  [_,_,_,P,P,P,_,_,P,P,P,Ps,_,_,_],   // legs
  [_,_,_,K,K,K,_,_,K,K,K,Ks,_,_,_],   // shoes
  [_,_,_,K,K,K,_,_,K,K,K,Ks,_,_,_],   // shoes
];

// ── Grid assembly ───────────────────────────────────────────

function buildGrid(hairStyle: HairStyle): number[][] {
  return [...HEADS[hairStyle], ...BODY];
}

// ── Auto-outline: every empty cell next to a fill → outline ─

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
  set.forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    result.push([x, y]);
  });
  return result;
}

// ── Color mapping ───────────────────────────────────────────

function getBaseColor(part: number, cfg: PixelCharacterConfig): string {
  switch (part) {
    case H:  return cfg.hairColor;
    case S:  return cfg.skinColor;
    case E:  return cfg.eyeColor;
    case M:  return darken(cfg.skinColor, 0.35);
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
    return darken(getBaseColor(part - 20, cfg), 0.30);
  }
  return getBaseColor(part, cfg);
}

// ── Component ───────────────────────────────────────────────

interface PixelCharacterProps {
  config: PixelCharacterConfig;
  size?: number;
}

export default function PixelCharacter({ config, size = 140 }: PixelCharacterProps) {
  const grid = useMemo(() => buildGrid(config.hairStyle), [config.hairStyle]);
  const outlines = useMemo(() => computeOutlines(grid), [grid]);

  const gridH = grid.length;
  const vbW = GRID_W + 2; // 1px outline padding
  const vbH = gridH + 2;
  const width = size;
  const height = Math.round(size * (vbH / vbW));

  return (
    <Svg width={width} height={height} viewBox={`-1 -1 ${vbW} ${vbH}`}>
      {/* Outlines */}
      {outlines.map(([x, y], i) => (
        <Rect key={`o${i}`} x={x} y={y} width={1} height={1} fill={OUTLINE_COLOR} />
      ))}
      {/* Fill */}
      {grid.map((row, y) =>
        row.map((part, x) =>
          part !== _ ? (
            <Rect key={`${y}-${x}`} x={x} y={y} width={1} height={1} fill={getColor(part, config)} />
          ) : null,
        ),
      )}
    </Svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
