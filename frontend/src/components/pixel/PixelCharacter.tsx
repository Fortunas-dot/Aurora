import React, { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';
import { PixelCharacterConfig, HairStyle } from '../../constants/pixelCharacterOptions';

// ═══════════════════════════════════════════════════════════════
// HABBO-STYLE LAYERED PIXEL CHARACTER
//
// Actual Habbo proportions:
//   • Head is ~50% of total height, wide & boxy (not dome)
//   • Body is compact and chunky
//   • Short stubby legs
//   • Big eyes with white + iris + pupil
//   • Thick 1px dark outlines
//   • Isometric 3/4 view with right-side depth shading
//
// Layers composite back→front:
//   Body(skin) → Legs → Chest(shirt) → Shoes → Face → Hair
//
// Grid: 14 wide × 22 tall (Habbo-accurate proportions)
// ═══════════════════════════════════════════════════════════════

const GRID_W = 14;
const GRID_H = 22;
const OUTLINE = '#08080F';

const _ = 0;  // transparent
const B = 1;  // base color
const S = 2;  // shadow (~20% darker)
const D = 3;  // deep shadow / side (~38% darker)

function layer(rows: Record<number, number[]>): number[][] {
  return Array.from({ length: GRID_H }, (__, i) =>
    rows[i] || new Array(GRID_W).fill(_),
  );
}

function mirrorLayer(l: number[][]): number[][] {
  return l.map((row) => [...row].reverse());
}

// ═══════════════════════════════════════════════════════════════
// BODY LAYER — skin (big boxy head, neck, arms)
//
// Habbo heads: wide rectangle with slightly rounded top corners
// Head takes rows 0–10 (11 rows), body 11–21 (11 rows) → 50/50
// ═══════════════════════════════════════════════════════════════

const BODY_FRONT = layer({
  // Head — big boxy rectangle, classic Habbo shape
  0:  [_,_,_,B,B,B,B,B,B,B,B,_,_,_],  // top (slightly narrower = rounded corners)
  1:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],
  2:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],
  3:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],  // forehead
  4:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],  // eye row
  5:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],  // below eyes
  6:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],  // nose
  7:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],  // mouth
  8:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],  // chin area
  9:  [_,_,_,B,B,B,B,B,B,B,D,_,_,_],  // jaw (slightly narrower)
  10: [_,_,_,_,_,B,B,B,B,D,_,_,_,_],  // neck

  // Torso — arms stick out to the sides
  11: [_,_,_,_,B,B,B,B,B,B,D,_,_,_],  // shoulders
  12: [_,B,B,_,_,_,_,_,_,_,_,_,_,_],  // left arm
  13: [_,B,S,_,_,_,_,_,_,_,_,_,_,_],
  14: [_,B,B,_,_,_,_,_,_,_,_,_,_,_],
  15: [_,S,B,_,_,_,_,_,_,_,_,_,_,_],  // hand
});

const BODY_BACK = layer({
  0:  [_,_,_,B,B,B,B,B,B,B,B,_,_,_],
  1:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],
  2:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],
  3:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],
  4:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],
  5:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],
  6:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],
  7:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],
  8:  [_,_,B,B,B,B,B,B,B,B,B,D,_,_],
  9:  [_,_,_,B,B,B,B,B,B,B,D,_,_,_],
  10: [_,_,_,_,_,B,B,B,B,D,_,_,_,_],
  11: [_,_,_,_,B,B,B,B,B,B,D,_,_,_],
  12: [_,_,_,_,_,_,_,_,_,_,_,B,B,_],  // right arm (back)
  13: [_,_,_,_,_,_,_,_,_,_,_,S,B,_],
  14: [_,_,_,_,_,_,_,_,_,_,_,B,B,_],
  15: [_,_,_,_,_,_,_,_,_,_,_,B,S,_],
});

// ═══════════════════════════════════════════════════════════════
// CHEST LAYER — shirt on torso
// ═══════════════════════════════════════════════════════════════

const CHEST_FRONT = layer({
  11: [_,_,_,_,B,B,B,B,B,B,D,_,_,_],  // collar
  12: [_,_,_,B,B,B,B,B,B,B,B,D,_,_],  // shirt
  13: [_,_,_,B,B,S,D,D,S,B,B,D,_,_],  // fold detail
  14: [_,_,_,B,B,B,B,B,B,B,B,D,_,_],
  15: [_,_,_,B,B,B,B,B,B,B,B,D,_,_],
});

const CHEST_BACK = layer({
  11: [_,_,_,_,B,B,B,B,B,B,D,_,_,_],
  12: [_,_,_,B,B,B,B,B,B,B,B,D,_,_],
  13: [_,_,_,B,B,B,B,S,B,B,B,D,_,_],
  14: [_,_,_,B,B,B,B,B,B,B,B,D,_,_],
  15: [_,_,_,B,B,B,B,B,B,B,B,D,_,_],
});

// ═══════════════════════════════════════════════════════════════
// LEGS LAYER — short pants with belt, stubby Habbo legs
// ═══════════════════════════════════════════════════════════════

const LEGS = layer({
  16: [_,_,_,D,D,D,D,D,D,D,D,D,_,_],  // belt
  17: [_,_,_,B,B,B,B,B,B,B,B,S,_,_],  // pants
  18: [_,_,_,B,B,B,_,B,B,B,B,S,_,_],  // legs split (1px gap)
  19: [_,_,_,B,B,S,_,B,B,B,S,S,_,_],  // lower legs
});

// ═══════════════════════════════════════════════════════════════
// SHOES LAYER — wider than legs (classic Habbo look)
// ═══════════════════════════════════════════════════════════════

const SHOES = layer({
  20: [_,_,B,B,B,B,_,B,B,B,B,B,_,_],  // shoes (wider)
  21: [_,_,B,B,S,D,_,B,B,S,S,D,_,_],  // shoe shading
});

// ═══════════════════════════════════════════════════════════════
// FACE LAYER — big Habbo eyes
//
// Codes: 1=eye white, 2=iris color, 3=pupil(black), 4=mouth, 5=nose
//
// Each eye is 2px wide: [white, iris] — with a dark pupil dot
// Eyes are big and centered — THE defining Habbo feature
// ═══════════════════════════════════════════════════════════════

const FACE_FRONT = layer({
  4:  [_,_,_,_,1,2,3,_,1,2,3,_,_,_],  // eyes: white-iris-pupil × 2
  6:  [_,_,_,_,_,_,_,5,_,_,_,_,_,_],  // nose (subtle)
  7:  [_,_,_,_,_,_,4,4,_,_,_,_,_,_],  // mouth
});

const FACE_BACK = layer({});

// ═══════════════════════════════════════════════════════════════
// HAIR LAYERS
//
// Hair sits on top of the big boxy head.
// Front: covers top rows + frames sides of face
// Back: covers entire back of head
// ═══════════════════════════════════════════════════════════════

const HAIR_FRONT: Record<HairStyle, number[][]> = {
  bob: layer({
    0:  [_,_,_,B,B,B,B,B,B,B,B,_,_,_],
    1:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    2:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    3:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],  // thick bangs
    4:  [_,_,B,_,_,_,_,_,_,_,_,S,_,_],  // sides frame face
    5:  [_,_,B,_,_,_,_,_,_,_,_,S,_,_],
    6:  [_,_,B,_,_,_,_,_,_,_,_,S,_,_],
    7:  [_,_,B,_,_,_,_,_,_,_,_,S,_,_],
    8:  [_,_,_,_,_,_,_,_,_,_,_,_,_,_],  // bob ends at chin
  }),
  long: layer({
    0:  [_,_,_,B,B,B,B,B,B,B,B,_,_,_],
    1:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    2:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    3:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    4:  [_,_,B,_,_,_,_,_,_,_,_,S,_,_],
    5:  [_,_,B,_,_,_,_,_,_,_,_,S,_,_],
    6:  [_,_,B,_,_,_,_,_,_,_,_,S,_,_],
    7:  [_,_,B,_,_,_,_,_,_,_,_,S,_,_],
    8:  [_,_,B,_,_,_,_,_,_,_,_,S,_,_],
    9:  [_,_,B,_,_,_,_,_,_,_,_,S,_,_],  // past jaw
    10: [_,_,B,_,_,_,_,_,_,_,_,S,_,_],  // past neck
    11: [_,_,S,_,_,_,_,_,_,_,_,S,_,_],  // shoulder length
    12: [_,_,_,_,_,_,_,_,_,_,_,S,_,_],  // tapers
  }),
  spiky: layer({
    0:  [_,B,_,B,_,B,B,B,B,_,B,_,B,_],  // spikes pointing up!
    1:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    2:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    3:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    // forehead exposed — no bangs
  }),
  curly: layer({
    0:  [_,B,B,B,B,B,B,B,B,B,B,B,B,_],  // voluminous, wider than head
    1:  [_,B,B,B,B,B,B,B,B,B,B,B,S,_],
    2:  [_,B,B,B,B,B,B,B,B,B,B,B,S,_],
    3:  [_,B,B,B,B,B,B,B,B,B,B,B,S,_],
    4:  [_,B,_,_,_,_,_,_,_,_,_,_,S,_],  // wide sides
    5:  [_,B,_,_,_,_,_,_,_,_,_,_,S,_],
    6:  [_,B,_,_,_,_,_,_,_,_,_,_,S,_],
    7:  [_,S,_,_,_,_,_,_,_,_,_,_,S,_],
  }),
};

const HAIR_BACK: Record<HairStyle, number[][]> = {
  bob: layer({
    0:  [_,_,_,B,B,B,B,B,B,B,B,_,_,_],
    1:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    2:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    3:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    4:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    5:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    6:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    7:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    8:  [_,_,_,B,B,B,B,B,B,B,S,_,_,_],
  }),
  long: layer({
    0:  [_,_,_,B,B,B,B,B,B,B,B,_,_,_],
    1:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    2:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    3:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    4:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    5:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    6:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    7:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    8:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    9:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    10: [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    11: [_,_,_,B,B,B,B,B,B,B,S,_,_,_],
    12: [_,_,_,_,S,S,S,S,S,S,_,_,_,_],
  }),
  spiky: layer({
    0:  [_,B,_,B,_,B,B,B,B,_,B,_,B,_],
    1:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    2:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    3:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    4:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    5:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    6:  [_,_,_,B,B,B,B,B,B,B,S,_,_,_],
  }),
  curly: layer({
    0:  [_,B,B,B,B,B,B,B,B,B,B,B,B,_],
    1:  [_,B,B,B,B,B,B,B,B,B,B,B,S,_],
    2:  [_,B,B,B,B,B,B,B,B,B,B,B,S,_],
    3:  [_,B,B,B,B,B,B,B,B,B,B,B,S,_],
    4:  [_,B,B,B,B,B,B,B,B,B,B,B,S,_],
    5:  [_,B,B,B,B,B,B,B,B,B,B,B,S,_],
    6:  [_,B,B,B,B,B,B,B,B,B,B,B,S,_],
    7:  [_,_,B,B,B,B,B,B,B,B,B,S,_,_],
    8:  [_,_,_,S,S,S,S,S,S,S,S,_,_,_],
  }),
};

// ═══════════════════════════════════════════════════════════════
// DIRECTION LOGIC
// ═══════════════════════════════════════════════════════════════

function resolveDirection(dir: number): { base: number; mirror: boolean } {
  const d = ((dir % 8) + 8) % 8;
  if (d <= 3) return { base: d, mirror: false };
  return { base: (8 - d) % 8, mirror: true };
}

function isFrontFacing(baseDir: number): boolean {
  return baseDir >= 2;
}

// ═══════════════════════════════════════════════════════════════
// COMPOSITING — stack all layers into final color grid
// ═══════════════════════════════════════════════════════════════

function compositeCharacter(cfg: PixelCharacterConfig, direction: number): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: GRID_H }, () =>
    new Array(GRID_W).fill(null),
  );

  const { base, mirror } = resolveDirection(direction);
  const front = isFrontFacing(base);

  const layers = [
    { data: front ? BODY_FRONT : BODY_BACK,   color: (v: number) => tint(cfg.skinColor, v) },
    { data: LEGS,                               color: (v: number) => tint(cfg.pantsColor, v) },
    { data: front ? CHEST_FRONT : CHEST_BACK,  color: (v: number) => tint(cfg.shirtColor, v) },
    { data: SHOES,                              color: (v: number) => tint(cfg.shoeColor, v) },
    { data: front ? FACE_FRONT : FACE_BACK,    color: (v: number) => faceColor(v, cfg) },
    { data: front ? HAIR_FRONT[cfg.hairStyle] : HAIR_BACK[cfg.hairStyle],
      color: (v: number) => tint(cfg.hairColor, v) },
  ];

  for (const l of layers) {
    const src = mirror ? mirrorLayer(l.data) : l.data;
    for (let y = 0; y < GRID_H; y++) {
      const row = src[y];
      for (let x = 0; x < GRID_W; x++) {
        if (row[x]) grid[y][x] = l.color(row[x]);
      }
    }
  }

  return grid;
}

function tint(hex: string, v: number): string {
  if (v === B) return hex;
  if (v === S) return darken(hex, 0.20);
  if (v === D) return darken(hex, 0.38);
  return hex;
}

function faceColor(v: number, cfg: PixelCharacterConfig): string {
  if (v === 1) return '#FFFFFF';                     // eye white
  if (v === 2) return cfg.eyeColor;                  // iris
  if (v === 3) return '#0C0C18';                     // pupil (black)
  if (v === 4) return darken(cfg.skinColor, 0.40);   // mouth
  if (v === 5) return darken(cfg.skinColor, 0.10);   // nose hint
  return cfg.skinColor;
}

// ═══════════════════════════════════════════════════════════════
// AUTO-OUTLINE
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
  direction?: number;
  frame?: number;
}

const PixelCharacter = React.memo(
  function PixelCharacter({ config, size = 140, direction = 2 }: PixelCharacterProps) {
    const grid = useMemo(
      () => compositeCharacter(config, direction),
      [config.skinColor, config.hairStyle, config.hairColor,
       config.eyeColor, config.shirtColor, config.pantsColor,
       config.shoeColor, direction],
    );
    const outlines = useMemo(() => computeOutlines(grid), [grid]);

    const vbW = GRID_W + 2;
    const vbH = GRID_H + 2;
    const width = size;
    const height = Math.round(size * (vbH / vbW));

    return (
      <Svg width={width} height={height} viewBox={`-1 -1 ${vbW} ${vbH}`}>
        {outlines.map(([x, y], i) => (
          <Rect key={`o${i}`} x={x} y={y} width={1} height={1} fill={OUTLINE} />
        ))}
        {grid.map((row, y) =>
          row.map((color, x) =>
            color ? (
              <Rect key={`${y}-${x}`} x={x} y={y} width={1} height={1} fill={color} />
            ) : null,
          ),
        )}
      </Svg>
    );
  },
  (prev, next) =>
    prev.size === next.size &&
    prev.direction === next.direction &&
    prev.config.skinColor === next.config.skinColor &&
    prev.config.hairStyle === next.config.hairStyle &&
    prev.config.hairColor === next.config.hairColor &&
    prev.config.eyeColor === next.config.eyeColor &&
    prev.config.shirtColor === next.config.shirtColor &&
    prev.config.pantsColor === next.config.pantsColor &&
    prev.config.shoeColor === next.config.shoeColor,
);

export default PixelCharacter;

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
