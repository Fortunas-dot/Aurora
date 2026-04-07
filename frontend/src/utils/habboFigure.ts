import { PixelCharacterConfig, HairStyle } from '../constants/pixelCharacterOptions';

// ═══════════════════════════════════════════════════════════════
// HABBO FIGURE STRING BUILDER
//
// Converts our PixelCharacterConfig → Habbo figure string
// used by the official Habbo Imaging API:
//   https://www.habbo.com/habbo-imaging/avatarimage?figure=...
//
// Figure string format: "type-setId-colorId.type-setId-colorId..."
//   hd = head/body base
//   hr = hair style
//   ch = chest (shirt)
//   lg = legs (pants)
//   sh = shoes
//
// Colors are Habbo palette IDs, not hex codes.
// ═══════════════════════════════════════════════════════════════

// ── Skin color → Habbo palette 1 ID ────────────────────────────
const SKIN_TO_PALETTE: Record<string, number> = {
  '#FDDBB4': 14,   // Fair
  '#F5C5A3': 10,   // Light
  '#E8A87C': 1,    // Tan
  '#C68642': 8,    // Medium
  '#8D5524': 19,   // Dark
  '#4A2511': 20,   // Deep
};

// ── Hair style → Habbo hair set ID ─────────────────────────────
const HAIR_TO_SET: Record<HairStyle, number> = {
  bob: 177,     // short bob
  long: 170,    // long straight
  spiky: 115,   // spiky/messy
  curly: 195,   // curly/afro
};

// ── Hair/clothing color → Habbo palette 2 ID ───────────────────
const COLOR_TO_PALETTE: Record<string, number> = {
  // Hair colors
  '#1A1A1A': 61,    // Black
  '#4A2C0A': 1395,  // Brown
  '#E8C44A': 1398,  // Blonde
  '#8B2500': 1396,  // Auburn
  '#CC2200': 1401,  // Red
  '#8A8A8A': 1405,  // Gray
  '#1A6EBF': 1354,  // Blue
  '#7B2D8B': 1350,  // Purple
  '#CC5599': 1348,  // Pink
  '#1A7A3C': 52,    // Green

  // Eye colors (mapped to closest palette)
  '#6B3A1F': 1395,  // Brown eyes
  '#6B7280': 1405,  // Gray eyes
  '#1F2937': 61,    // Dark eyes

  // Shirt colors
  '#4F86C6': 58,    // Blue
  '#D4A017': 1398,  // Yellow
  '#C45C00': 1400,  // Orange
  '#D8DCE0': 1405,  // White
  '#2C3E50': 61,    // Black
  '#0F7A6E': 53,    // Teal

  // Pants colors
  '#1A2744': 61,    // Navy
  '#2D5F8A': 1354,  // Jeans
  '#18181B': 61,    // Black
  '#9E8054': 1403,  // Khaki
  '#6B1A2A': 1401,  // Burgundy
  '#1A4A2A': 1431,  // Forest
  '#4A5568': 1405,  // Gray
  '#C0C4C8': 1405,  // White

  // Shoe colors
  '#111111': 61,    // Black
  '#D0D4D8': 1405,  // White
  '#5A3010': 1395,  // Brown
  '#AA1A00': 1401,  // Red
  '#1A4E8B': 1355,  // Blue
  '#5A6472': 1405,  // Gray
};

// Fallback: find closest palette ID for unknown colors
function closestPaletteId(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;

  // Simple brightness-based fallback
  const brightness = (r + g + b) / 3;
  if (brightness < 64) return 61;       // dark → black
  if (brightness < 128) return 1395;    // mid-dark → brown
  if (brightness < 192) return 1405;    // mid-light → gray
  return 1398;                          // light → blonde/yellow
}

function paletteId(hex: string): number {
  const upper = hex.toUpperCase();
  return COLOR_TO_PALETTE[upper] ?? COLOR_TO_PALETTE[hex] ?? closestPaletteId(hex);
}

function skinPaletteId(hex: string): number {
  const upper = hex.toUpperCase();
  return SKIN_TO_PALETTE[upper] ?? SKIN_TO_PALETTE[hex] ?? 10;
}

// ═══════════════════════════════════════════════════════════════
// BUILD FIGURE STRING
// ═══════════════════════════════════════════════════════════════

export function buildFigureString(config: PixelCharacterConfig): string {
  const skin = skinPaletteId(config.skinColor);
  const hair = HAIR_TO_SET[config.hairStyle] || 115;
  const hairColor = paletteId(config.hairColor);
  const shirtColor = paletteId(config.shirtColor);
  const pantsColor = paletteId(config.pantsColor);
  const shoeColor = paletteId(config.shoeColor);

  // hd-setId-skinColorId.hr-setId-hairColorId.ch-setId-shirtColorId...
  return [
    `hd-195-${skin}`,
    `hr-${hair}-${hairColor}`,
    `ch-3030-${shirtColor}`,
    `lg-275-${pantsColor}`,
    `sh-305-${shoeColor}`,
  ].join('.');
}

// ═══════════════════════════════════════════════════════════════
// BUILD IMAGING API URL
// ═══════════════════════════════════════════════════════════════

const HABBO_IMAGING_BASE = 'https://www.habbo.com/habbo-imaging/avatarimage';

export interface HabboImageOptions {
  config: PixelCharacterConfig;
  direction?: number;    // 0-7
  headDirection?: number;
  size?: 'l' | 'm' | 's' | 'n';
  action?: 'std' | 'wlk' | 'sit' | 'wav';
  gesture?: 'std' | 'sml' | 'agr' | 'sad' | 'srp' | 'spk';
}

export function buildHabboImageUrl(opts: HabboImageOptions): string {
  const figure = buildFigureString(opts.config);
  const dir = opts.direction ?? 2;
  const headDir = opts.headDirection ?? dir;
  const size = opts.size ?? 'l';
  const action = opts.action ?? 'std';
  const gesture = opts.gesture ?? 'std';

  return `${HABBO_IMAGING_BASE}?figure=${figure}&direction=${dir}&head_direction=${headDir}&size=${size}&action=${action}&gesture=${gesture}`;
}
