import {
  PixelCharacterConfig,
  Gender,
  getHairSetId,
  getShirtChSet,
  getPantsLgSet,
  getShoeShSet,
  getEyewearSet,
  getEarringSet,
  getNecklaceSet,
} from '../constants/pixelCharacterOptions';

// ═══════════════════════════════════════════════════════════════
// HABBO FIGURE STRING → habbo.com/habbo-imaging/avatarimage
//
// • `hd` = body/face: male (180) vs female (600) — different silhouettes.
// • Set IDs (`hr` / `ch` / `lg` / `sh`) are taken from `open-hotel/open-hotel-resources`
//   `dist/figuredata.json` + `dist/figuremap.json`: each `hr`/`ch`/`lg`/`sh` set is
//   chosen so its figuremap library id matches the UI label (named `hair_*` / `shirt_*`
//   / `trousers_*` / `shoes_*` assets, not legacy `hh_human_*` guesses).
// • flaviobdev/habbo-assets does not ship figuredata; it is a separate icon pack.
// ═══════════════════════════════════════════════════════════════

const HEAD_SET_BY_GENDER: Record<Gender, number> = {
  male: 180,
  female: 600,
};


const SKIN_TO_PALETTE: Record<string, number> = {
  '#FDDBB4': 14,
  '#F5C5A3': 10,
  '#E8A87C': 1,
  '#C68642': 8,
  '#8D5524': 19,
  '#4A2511': 20,
};

const COLOR_TO_PALETTE: Record<string, number> = {
  '#1A1A1A': 61,
  '#4A2C0A': 1395,
  '#E8C44A': 1398,
  '#8B2500': 1396,
  '#CC2200': 1401,
  '#8A8A8A': 1405,
  '#1A6EBF': 1354,
  '#7B2D8B': 1350,
  '#CC5599': 1348,
  '#1A7A3C': 52,
  '#6B3A1F': 1395,
  '#6B7280': 1405,
  '#1F2937': 61,
  '#4F86C6': 58,
  '#D4A017': 1398,
  '#C45C00': 1400,
  '#D8DCE0': 1405,
  '#2C3E50': 61,
  '#0F7A6E': 53,
  '#1A2744': 61,
  '#2D5F8A': 1354,
  '#18181B': 61,
  '#9E8054': 1403,
  '#6B1A2A': 1401,
  '#1A4A2A': 1431,
  '#4A5568': 1405,
  '#C0C4C8': 1405,
  '#111111': 61,
  '#D0D4D8': 1405,
  '#5A3010': 1395,
  '#AA1A00': 1401,
  '#1A4E8B': 1355,
  '#5A6472': 1405,
};

const EYE_COLOR_TO_PALETTE: Record<string, number> = {
  '#1A6EBF': 1355,
  '#2E86AB': 1354,
  '#1A7A3C': 52,
  '#6B3A1F': 1395,
  '#6B7280': 1405,
  '#1F2937': 61,
  '#7B2D8B': 1350,
  '#C9A227': 1398,
};

function closestPaletteId(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const brightness = (r + g + b) / 3;
  if (brightness < 64) return 61;
  if (brightness < 128) return 1395;
  if (brightness < 192) return 1405;
  return 1398;
}

function paletteId(hex: string): number {
  const upper = hex.toUpperCase();
  return COLOR_TO_PALETTE[upper] ?? COLOR_TO_PALETTE[hex] ?? closestPaletteId(hex);
}

function skinPaletteId(hex: string): number {
  const upper = hex.toUpperCase();
  return SKIN_TO_PALETTE[upper] ?? SKIN_TO_PALETTE[hex] ?? 10;
}

function eyePaletteId(hex: string): number {
  const upper = hex.toUpperCase();
  return (
    EYE_COLOR_TO_PALETTE[upper] ??
    EYE_COLOR_TO_PALETTE[hex] ??
    paletteId(hex)
  );
}

export function buildFigureString(config: PixelCharacterConfig): string {
  const skin = skinPaletteId(config.skinColor);
  const headSet = HEAD_SET_BY_GENDER[config.gender];
  const hairSet = getHairSetId(config.hairStyle, config.gender);
  const hairColor = paletteId(config.hairColor);
  const eyes = eyePaletteId(config.eyeColor);
  const shirtColor = paletteId(config.shirtColor);
  const pantsColor = paletteId(config.pantsColor);
  const shoeColor = paletteId(config.shoeColor);
  const chSet = getShirtChSet(config.shirtStyle, config.gender);
  const lgSet = getPantsLgSet(config.pantsStyle, config.gender);
  const shSet = getShoeShSet(config.shoeStyle, config.gender);
  const eyewearSet = getEyewearSet(config.eyewearStyle, config.gender);
  const earringSet = getEarringSet(config.earringStyle, config.gender);
  const necklaceSet = getNecklaceSet(config.necklaceStyle, config.gender);
  const accessoryColor = paletteId(config.accessoryColor);

  const accessoryParts = [
    eyewearSet > 0 ? `ea-${eyewearSet}-${accessoryColor}` : null,
    earringSet > 0 ? `he-${earringSet}-${accessoryColor}` : null,
    necklaceSet > 0 ? `ca-${necklaceSet}-${accessoryColor}` : null,
  ].filter(Boolean) as string[];

  return [
    `hd-${headSet}-${skin}`,
    `hr-${hairSet}-${hairColor}`,
    `ey-4-${eyes}`,
    `ch-${chSet}-${shirtColor}`,
    `lg-${lgSet}-${pantsColor}`,
    `sh-${shSet}-${shoeColor}`,
    ...accessoryParts,
  ].join('.');
}

const HABBO_IMAGING_BASE = 'https://www.habbo.com/habbo-imaging/avatarimage';

export interface HabboImageOptions {
  config: PixelCharacterConfig;
  direction?: number;
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

  return `${HABBO_IMAGING_BASE}?figure=${encodeURIComponent(figure)}&direction=${dir}&head_direction=${headDir}&size=${size}&action=${action}&gesture=${gesture}`;
}
