import React, { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';
import { PixelCharacterConfig, HairStyle } from '../../constants/pixelCharacterOptions';

// ════════════════════════════════════════════════════════════════
// PART CODES — multiple shade levels per body part
// ════════════════════════════════════════════════════════════════

const _ = 0;
const H = 1;   // hair base
const h = 2;   // hair shadow
const S = 3;   // skin base
const s = 4;   // skin shadow
const W = 5;   // eye white
const E = 6;   // eye color (iris)
const M = 7;   // mouth
const T = 8;   // shirt base
const t = 9;   // shirt shadow
const U = 10;  // shirt fold (darkest)
const P = 11;  // pants base
const p = 12;  // pants shadow
const K = 13;  // shoe base
const k = 14;  // shoe shadow
const B = 15;  // belt
const N = 16;  // nose / subtle skin shade

// Side codes (base + 20) → rendered ~35% darker for isometric depth
const HS = 21; // hair side
const SS = 23; // skin side
const TS = 28; // shirt side
const PS = 31; // pants side
const KS = 33; // shoe side

const GRID_W = 15;
const OUTLINE_COLOR = '#0C0C18';

// ════════════════════════════════════════════════════════════════
// HABBO-STYLE CHARACTER
//
// Key traits from real Habbo sprites:
//   • Rounded/dome head (NOT cube) — wider in middle, narrow top & chin
//   • Eye whites + coloured iris (2px per eye)
//   • Multiple shade levels for depth (base, shadow, side)
//   • ~38% head proportion, proper body length
//   • Detailed clothing with folds
//   • Shoes wider than legs
//   • 1px leg gap
//   • Strong dark outlines
//
// Grid: 15 wide × 26 tall
// ════════════════════════════════════════════════════════════════

// ── HEADS (10 rows × 15 cols) ───────────────────────────────

const HEADS: Record<HairStyle, number[][]> = {
  bob: [
    [_,_,_,_,_,H,H,H,H,H,_,_,_,_,_],  // 0  hair crown (rounded top)
    [_,_,_,_,H,H,H,H,H,H,H,h,_,_,_],  // 1  wider
    [_,_,_,H,H,H,H,H,H,H,H,h,HS,_,_], // 2  full width + side
    [_,_,_,H,H,H,H,H,H,H,H,h,HS,_,_], // 3  hair block
    [_,_,_,H,S,S,S,S,S,S,S,s,SS,_,_],  // 4  forehead + hair on edges
    [_,_,_,S,S,W,E,S,S,W,E,s,SS,_,_],  // 5  eyes (white + iris)
    [_,_,_,S,S,S,S,N,S,S,S,s,SS,_,_],  // 6  nose hint
    [_,_,_,S,S,S,M,M,S,S,S,s,SS,_,_],  // 7  mouth
    [_,_,_,_,S,S,S,S,S,S,s,_,_,_,_],   // 8  jaw (narrows)
    [_,_,_,_,_,S,S,S,S,s,_,_,_,_,_],   // 9  chin / neck
  ],
  long: [
    [_,_,_,_,_,H,H,H,H,H,_,_,_,_,_],
    [_,_,_,_,H,H,H,H,H,H,H,h,_,_,_],
    [_,_,_,H,H,H,H,H,H,H,H,h,HS,_,_],
    [_,_,_,H,H,H,H,H,H,H,H,h,HS,_,_],
    [_,_,_,H,S,S,S,S,S,S,S,H,HS,_,_],  // hair frames the face
    [_,_,_,H,S,W,E,S,S,W,E,H,HS,_,_],
    [_,_,_,H,S,S,S,N,S,S,S,H,HS,_,_],
    [_,_,_,H,S,S,M,M,S,S,S,H,HS,_,_],
    [_,_,_,H,S,S,S,S,S,S,S,H,HS,_,_],  // hair continues past jaw
    [_,_,_,H,_,S,S,S,S,s,_,H,HS,_,_],  // long strands beside neck
  ],
  spiky: [
    [_,_,H,_,H,_,H,H,H,_,H,_,_,_,_],  // spikes
    [_,_,_,H,H,H,H,H,H,H,H,h,_,_,_],
    [_,_,_,H,H,H,H,H,H,H,H,h,HS,_,_],
    [_,_,_,H,H,H,H,H,H,H,H,h,HS,_,_],
    [_,_,_,_,S,S,S,S,S,S,S,s,SS,_,_],  // no hair covering forehead
    [_,_,_,S,S,W,E,S,S,W,E,s,SS,_,_],
    [_,_,_,S,S,S,S,N,S,S,S,s,SS,_,_],
    [_,_,_,S,S,S,M,M,S,S,S,s,SS,_,_],
    [_,_,_,_,S,S,S,S,S,S,s,_,_,_,_],
    [_,_,_,_,_,S,S,S,S,s,_,_,_,_,_],
  ],
  curly: [
    [_,_,_,H,H,H,H,H,H,H,H,H,_,_,_],  // voluminous top
    [_,_,H,H,H,H,H,H,H,H,H,H,h,_,_],  // wider
    [_,_,H,H,H,H,H,H,H,H,H,H,h,HS,_], // widest
    [_,_,H,H,H,H,H,H,H,H,H,H,h,HS,_],
    [_,_,H,S,S,S,S,S,S,S,S,S,h,SS,_],  // forehead with curls on sides
    [_,_,H,S,S,W,E,S,S,W,E,S,h,SS,_],
    [_,_,_,S,S,S,S,N,S,S,S,s,SS,_,_],
    [_,_,_,S,S,S,M,M,S,S,S,s,SS,_,_],
    [_,_,_,_,S,S,S,S,S,S,s,_,_,_,_],
    [_,_,_,_,_,S,S,S,S,s,_,_,_,_,_],
  ],
};

// ── BODY (16 rows × 15 cols, shared) ────────────────────────

const BODY: number[][] = [
  [_,_,_,_,T,T,T,T,T,T,T,TS,_,_,_],   // 10 collar / shirt top
  [_,_,_,T,T,T,T,T,T,T,T,t,TS,_,_],   // 11 shirt
  [_,S,S,T,T,T,T,T,T,T,T,t,TS,_,_],   // 12 left arm + shirt
  [_,S,s,T,T,t,U,U,t,T,T,t,TS,_,_],   // 13 arm shadow + fold
  [_,S,S,T,T,T,T,T,T,T,T,t,TS,_,_],   // 14 arm + shirt
  [_,_,_,T,T,T,T,T,T,T,T,t,TS,_,_],   // 15 shirt
  [_,_,_,T,T,T,T,T,T,T,T,t,TS,_,_],   // 16 shirt bottom
  [_,_,_,B,B,B,B,B,B,B,B,B,_,_,_],    // 17 belt
  [_,_,_,P,P,P,P,P,P,P,P,p,PS,_,_],   // 18 pants
  [_,_,_,P,P,P,P,P,P,P,P,p,PS,_,_],   // 19 pants
  [_,_,_,P,P,P,_,P,P,P,P,p,_,_,_],    // 20 legs split (1px gap)
  [_,_,_,P,P,P,_,P,P,P,P,p,_,_,_],    // 21 legs
  [_,_,_,P,P,P,_,P,P,P,P,p,_,_,_],    // 22 legs
  [_,_,_,p,p,p,_,p,p,p,p,p,_,_,_],    // 23 pants cuffs (darker)
  [_,_,K,K,K,K,_,K,K,K,K,K,KS,_,_],   // 24 shoes (wider than legs)
  [_,_,K,K,k,k,_,K,K,K,k,k,KS,_,_],   // 25 shoes with shading
];

// ── Grid assembly ───────────────────────────────────────────

function buildGrid(hairStyle: HairStyle): number[][] {
  return [...HEADS[hairStyle], ...BODY];
}

// ── Auto-outline ────────────────────────────────────────────

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
  set.forEach((key) => {
    const [x, y] = key.split(',').map(Number);
    result.push([x, y]);
  });
  return result;
}

// ── Color mapping (3 shade levels per part) ─────────────────

function getBaseColor(code: number, cfg: PixelCharacterConfig): string {
  switch (code) {
    case H:  return cfg.hairColor;
    case h:  return darken(cfg.hairColor, 0.18);
    case S:  return cfg.skinColor;
    case s:  return darken(cfg.skinColor, 0.15);
    case W:  return '#FFFFFF';
    case E:  return cfg.eyeColor;
    case M:  return darken(cfg.skinColor, 0.35);
    case N:  return darken(cfg.skinColor, 0.08);
    case T:  return cfg.shirtColor;
    case t:  return darken(cfg.shirtColor, 0.18);
    case U:  return darken(cfg.shirtColor, 0.28);
    case P:  return cfg.pantsColor;
    case p:  return darken(cfg.pantsColor, 0.18);
    case K:  return cfg.shoeColor;
    case k:  return darken(cfg.shoeColor, 0.20);
    case B:  return darken(cfg.pantsColor, 0.30);
    default: return 'transparent';
  }
}

function getColor(code: number, cfg: PixelCharacterConfig): string {
  // Side variants (code 20–39): deeply darkened for isometric right face
  if (code >= 20) {
    return darken(getBaseColor(code - 20, cfg), 0.35);
  }
  return getBaseColor(code, cfg);
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
  const vbW = GRID_W + 2;
  const vbH = gridH + 2;
  const width = size;
  const height = Math.round(size * (vbH / vbW));

  return (
    <Svg width={width} height={height} viewBox={`-1 -1 ${vbW} ${vbH}`}>
      {/* Dark outlines */}
      {outlines.map(([x, y], i) => (
        <Rect key={`o${i}`} x={x} y={y} width={1} height={1} fill={OUTLINE_COLOR} />
      ))}
      {/* Coloured fill */}
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

// ── Utility ─────────────────────────────────────────────────

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
