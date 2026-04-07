import React, { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';
import { PixelCharacterConfig, HairStyle } from '../../constants/pixelCharacterOptions';

// ═══════════════════════════════════════════════════════════════
// HABBO-STYLE LAYERED PIXEL CHARACTER — "Paper Doll" System
//
// Like real Habbo, the character is built from independent sprite
// layers that composite back-to-front:
//
//   1. Body (skin base — torso, arms, head dome)
//   2. Legs (pants)
//   3. Chest (shirt)
//   4. Shoes
//   5. Face (eyes, mouth, nose — special colors)
//   6. Hair (covers top of head)
//
// Each layer is a grid of shade codes:
//   _ = transparent, B = base, S = shadow, D = deep shadow
//
// Direction support:
//   dir 2 = front-right (default, drawn as-is)
//   dir 4 = front-left  (horizontally mirrored)
//   dir 0 = back-right  (uses BACK variants)
//   dir 6 = back-left   (BACK mirrored)
//
// The component accepts `direction` (0–7) and `frame` props.
// Habbo only draws 5 angles and mirrors for the other 3.
//
// Grid: 16 wide × 28 tall
// ═══════════════════════════════════════════════════════════════

const GRID_W = 16;
const GRID_H = 28;
const OUTLINE = '#0C0C18';

const _ = 0;  // transparent
const B = 1;  // base
const S = 2;  // shadow (~18% darker)
const D = 3;  // deep shadow (~35% darker)

// ── Helper: build full grid from sparse row map ──────────────

function layer(rows: Record<number, number[]>): number[][] {
  return Array.from({ length: GRID_H }, (__, i) =>
    rows[i] || new Array(GRID_W).fill(_),
  );
}

// ── Helper: mirror a layer horizontally ──────────────────────

function mirrorLayer(l: number[][]): number[][] {
  return l.map((row) => [...row].reverse());
}

// ═══════════════════════════════════════════════════════════════
// SPRITE LAYERS (direction 2 — front-right facing)
// ═══════════════════════════════════════════════════════════════

// BODY — skin (head dome, neck, arms, hands)
const BODY_FRONT = layer({
  2:  [_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_],  // head crown
  3:  [_,_,_,_,B,B,B,B,B,B,B,B,_,_,_,_],
  4:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
  5:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
  6:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],  // forehead
  7:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],  // eye row
  8:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],  // nose row
  9:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],  // mouth row
  10: [_,_,_,_,B,B,B,B,B,B,B,S,_,_,_,_],  // jaw
  11: [_,_,_,_,_,B,B,B,B,B,S,_,_,_,_,_],  // chin
  12: [_,_,_,_,_,_,B,B,B,S,_,_,_,_,_,_],  // neck
  13: [_,_,_,_,_,B,B,B,B,B,S,_,_,_,_,_],  // shoulders
  14: [_,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_],  // left arm
  15: [_,B,S,_,_,_,_,_,_,_,_,_,_,_,_,_],
  16: [_,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_],
  17: [_,B,S,_,_,_,_,_,_,_,_,_,_,_,_,_],
  18: [_,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_],
  19: [_,_,B,_,_,_,_,_,_,_,_,_,_,_,_,_],  // hand
});

// BODY — back view (no face details, arm on right side)
const BODY_BACK = layer({
  2:  [_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_],
  3:  [_,_,_,_,B,B,B,B,B,B,B,B,_,_,_,_],
  4:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
  5:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
  6:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
  7:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
  8:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
  9:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
  10: [_,_,_,_,B,B,B,B,B,B,B,S,_,_,_,_],
  11: [_,_,_,_,_,B,B,B,B,B,S,_,_,_,_,_],
  12: [_,_,_,_,_,_,B,B,B,S,_,_,_,_,_,_],
  13: [_,_,_,_,_,B,B,B,B,B,S,_,_,_,_,_],
  14: [_,_,_,_,_,_,_,_,_,_,_,_,B,B,_,_],  // right arm (back view)
  15: [_,_,_,_,_,_,_,_,_,_,_,_,S,B,_,_],
  16: [_,_,_,_,_,_,_,_,_,_,_,_,B,B,_,_],
  17: [_,_,_,_,_,_,_,_,_,_,_,_,S,B,_,_],
  18: [_,_,_,_,_,_,_,_,_,_,_,_,B,B,_,_],
  19: [_,_,_,_,_,_,_,_,_,_,_,_,B,_,_,_],
});

// CHEST — shirt with fold detail
const CHEST_FRONT = layer({
  13: [_,_,_,_,_,B,B,B,B,B,S,_,_,_,_,_],  // collar
  14: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
  15: [_,_,_,B,B,S,D,D,S,B,B,S,D,_,_,_],  // fold
  16: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
  17: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
  18: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
});

const CHEST_BACK = layer({
  13: [_,_,_,_,_,B,B,B,B,B,S,_,_,_,_,_],
  14: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
  15: [_,_,_,B,B,B,B,S,B,B,B,S,D,_,_,_],  // back seam
  16: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
  17: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
  18: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
});

// LEGS — pants with belt, 1px gap between legs
const LEGS = layer({
  19: [_,_,_,D,D,D,D,D,D,D,D,D,_,_,_,_],  // belt
  20: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
  21: [_,_,_,B,B,B,B,B,B,B,B,S,D,_,_,_],
  22: [_,_,_,B,B,B,_,B,B,B,B,S,_,_,_,_],  // legs split
  23: [_,_,_,B,B,B,_,B,B,B,B,S,_,_,_,_],
  24: [_,_,_,B,B,S,_,B,B,B,S,S,_,_,_,_],
  25: [_,_,_,S,S,S,_,S,S,S,S,S,_,_,_,_],  // cuffs
});

// SHOES — wider than legs
const SHOES = layer({
  26: [_,_,B,B,B,B,_,B,B,B,B,B,S,_,_,_],
  27: [_,_,B,B,S,D,_,B,B,B,S,D,D,_,_,_],
});

// FACE — special color codes: 1=eye white, 2=iris, 3=mouth, 4=nose
const FACE_FRONT = layer({
  7: [_,_,_,_,_,1,2,_,_,1,2,_,_,_,_,_],   // eyes
  8: [_,_,_,_,_,_,_,_,4,_,_,_,_,_,_,_],   // nose
  9: [_,_,_,_,_,_,_,3,3,_,_,_,_,_,_,_],   // mouth
});

// No face for back view (empty layer)
const FACE_BACK = layer({});

// ═══════════════════════════════════════════════════════════════
// HAIR LAYERS (front-right facing)
// ═══════════════════════════════════════════════════════════════

const HAIR_FRONT: Record<HairStyle, number[][]> = {
  bob: layer({
    0: [_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_],
    1: [_,_,_,_,B,B,B,B,B,B,B,S,_,_,_,_],
    2: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    3: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    4: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    5: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    6: [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],  // sides frame face
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
    9:  [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],
    10: [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],
    11: [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],
    12: [_,_,_,B,_,_,_,_,_,_,_,B,S,_,_,_],
    13: [_,_,_,_,_,_,_,_,_,_,_,S,_,_,_,_],
  }),
  spiky: layer({
    0: [_,_,B,_,B,_,B,B,B,_,B,_,B,_,_,_],
    1: [_,_,_,B,B,B,B,B,B,B,B,S,_,_,_,_],
    2: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    3: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    4: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
  }),
  curly: layer({
    0: [_,_,_,B,B,B,B,B,B,B,B,B,B,_,_,_],
    1: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    2: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    3: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    4: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    5: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    6: [_,_,B,_,_,_,_,_,_,_,_,_,B,S,_,_],
    7: [_,_,B,_,_,_,_,_,_,_,_,_,B,S,_,_],
    8: [_,_,_,_,_,_,_,_,_,_,_,_,_,S,_,_],
  }),
};

// Hair back — covers back of head
const HAIR_BACK: Record<HairStyle, number[][]> = {
  bob: layer({
    0: [_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_],
    1: [_,_,_,_,B,B,B,B,B,B,B,S,_,_,_,_],
    2: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    3: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    4: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    5: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    6: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    7: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    8: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    9: [_,_,_,_,B,B,B,B,B,B,S,_,_,_,_,_],
  }),
  long: layer({
    0:  [_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_],
    1:  [_,_,_,_,B,B,B,B,B,B,B,S,_,_,_,_],
    2:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    3:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    4:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    5:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    6:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    7:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    8:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    9:  [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    10: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    11: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    12: [_,_,_,_,B,B,B,B,B,B,S,_,_,_,_,_],
    13: [_,_,_,_,_,S,S,S,S,S,_,_,_,_,_,_],
  }),
  spiky: layer({
    0: [_,_,B,_,B,_,B,B,B,_,B,_,B,_,_,_],
    1: [_,_,_,B,B,B,B,B,B,B,B,S,_,_,_,_],
    2: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    3: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    4: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    5: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
    6: [_,_,_,_,B,B,B,B,B,B,S,_,_,_,_,_],
  }),
  curly: layer({
    0: [_,_,_,B,B,B,B,B,B,B,B,B,B,_,_,_],
    1: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    2: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    3: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    4: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    5: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    6: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    7: [_,_,B,B,B,B,B,B,B,B,B,B,B,S,_,_],
    8: [_,_,_,B,B,B,B,B,B,B,B,B,S,_,_,_],
  }),
};

// ═══════════════════════════════════════════════════════════════
// DIRECTION RESOLVER
//
// Habbo directions: 0=N, 1=NE, 2=E(front-right), 3=SE, 4=S(front-left),
//                   5=SW, 6=W(back-left), 7=NW
//
// We draw directions 0-3 natively; 4-7 = mirror of 0-3
// ═══════════════════════════════════════════════════════════════

function resolveDirection(dir: number): { base: number; mirror: boolean } {
  // Normalize to 0-7
  const d = ((dir % 8) + 8) % 8;
  if (d <= 3) return { base: d, mirror: false };
  // 4→4(mirror of 0), 5→3(mirror of 1)... simplified:
  // For our simplified 2-state system (front/back):
  //   0,1 = back-facing;  2,3 = front-facing
  //   4,5 = front-facing mirrored;  6,7 = back-facing mirrored
  return { base: (8 - d) % 8, mirror: true };
}

function isFrontFacing(baseDir: number): boolean {
  return baseDir >= 2;
}

// ═══════════════════════════════════════════════════════════════
// COMPOSITING ENGINE
//
// Stacks layers back→front: Body → Legs → Chest → Shoes → Face → Hair
// Each layer overwrites transparent pixels only where it has data.
// ═══════════════════════════════════════════════════════════════

interface LayerDef {
  data: number[][];
  color: (v: number) => string;
}

function compositeCharacter(cfg: PixelCharacterConfig, direction: number): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: GRID_H }, () =>
    new Array(GRID_W).fill(null),
  );

  const { base, mirror } = resolveDirection(direction);
  const front = isFrontFacing(base);

  // Pick direction-appropriate layer variants
  const bodyLayer = front ? BODY_FRONT : BODY_BACK;
  const chestLayer = front ? CHEST_FRONT : CHEST_BACK;
  const faceLayer = front ? FACE_FRONT : FACE_BACK;
  const hairLayer = front ? HAIR_FRONT[cfg.hairStyle] : HAIR_BACK[cfg.hairStyle];

  // Habbo Z-order: body → legs → chest → shoes → face → hair
  const layers: LayerDef[] = [
    { data: bodyLayer,  color: v => tint(cfg.skinColor, v) },
    { data: LEGS,       color: v => tint(cfg.pantsColor, v) },
    { data: chestLayer, color: v => tint(cfg.shirtColor, v) },
    { data: SHOES,      color: v => tint(cfg.shoeColor, v) },
    { data: faceLayer,  color: v => faceColor(v, cfg) },
    { data: hairLayer,  color: v => tint(cfg.hairColor, v) },
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

// ═══════════════════════════════════════════════════════════════
// COLOR FUNCTIONS
// ═══════════════════════════════════════════════════════════════

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
  if (v === 4) return darken(cfg.skinColor, 0.08);  // nose
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
// COMPONENT — React.memo for performance in rooms with 20+ users
// ═══════════════════════════════════════════════════════════════

interface PixelCharacterProps {
  config: PixelCharacterConfig;
  size?: number;
  direction?: number;  // 0–7 (Habbo direction, default 2 = front-right)
  frame?: number;      // animation frame (reserved for walk cycle)
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
  // Custom comparison: only re-render when visible props change
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
