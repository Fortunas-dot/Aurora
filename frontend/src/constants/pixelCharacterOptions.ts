/**
 * Pixel avatar options for the Habbo Imaging API (`figure=`).
 * Shirt/pants/shoes `ch` / `lg` / `sh` set IDs come from open-hotel/resources
 * `dist/figuredata.json` + `dist/figuremap.json` (open-hotel/open-hotel-resources).
 */

export type Gender = 'male' | 'female';

export type HairStyle =
  | 'wavy'
  | 'spiky'
  | 'buns'
  | 'curls'
  | 'neat'
  | 'bob'
  | 'mohawk'
  | 'longSmooth'
  | 'pixieShort'
  | 'parted'
  | 'sideSweep'
  | 'backBun'
  | 'braidBun'
  | 'showy'
  | 'harley'
  | 'shortWave'
  | 'scarfBun'
  | 'jimmy'
  | 'hipsterClassic'
  | 'gatsby'
  | 'wavyLong'
  | 'hipsterModern'
  | 'manBun'
  | 'crownBraid'
  | 'boxerBraids'
  | 'elegantPonytail'
  | 'sidePonytail'
  | 'shortCurly'
  | 'longWavy'
  | 'sideFlopped'
  | 'longWavy2'
  | 'curls2'
  | 'curls3'
  | 'messyBun'
  | 'longMohawk'
  | 'extraLong'
  | 'jewelBraids'
  | 'modernShortWave'
  | 'cyBuns'
  | 'ponytailClassic'
  | 'bald';

export type ShirtStyle =
  | 'tee'
  | 'hoodie'
  | 'polo'
  | 'tank'
  | 'sweater'
  | 'dressshirt'
  | 'kimono'
  | 'offshoulder'
  | 'boho'
  | 'cute'
  | 'dress';
export type PantsStyle =
  | 'jeans'
  | 'shorts'
  | 'cargo'
  | 'slacks'
  | 'skirt'
  | 'frillskirt'
  | 'bowskirt';
export type ShoeStyle = 'sneakers' | 'boots' | 'dress' | 'sandals' | 'bootie' | 'bowshoes';
export type EyewearStyle =
  | 'none'
  | 'sunglasses'
  | 'classicShades'
  | 'aviators'
  | 'retroRound'
  | 'neonShades';
export type EarringStyle = 'none' | 'studs' | 'hoops' | 'starDrops' | 'leafEarrings';
export type NecklaceStyle = 'none' | 'chain' | 'choker' | 'gemPendant' | 'strandNecklace';

export interface PixelCharacterConfig {
  gender: Gender;
  skinColor: string;
  hairStyle: HairStyle;
  hairColor: string;
  eyeColor: string;
  shirtStyle: ShirtStyle;
  shirtColor: string;
  pantsStyle: PantsStyle;
  pantsColor: string;
  shoeStyle: ShoeStyle;
  shoeColor: string;
  eyewearStyle: EyewearStyle;
  earringStyle: EarringStyle;
  necklaceStyle: NecklaceStyle;
  accessoryColor: string;
}

interface HairStyleOption {
  label: string;
  value: HairStyle;
  emoji: string;
  setId: number;
}

export const DEFAULT_PIXEL_CHARACTER: PixelCharacterConfig = {
  gender: 'female',
  skinColor: '#F5C5A3',
  hairStyle: 'bob',
  hairColor: '#4A2C0A',
  eyeColor: '#2E86AB',
  shirtStyle: 'tee',
  shirtColor: '#4F86C6',
  pantsStyle: 'jeans',
  pantsColor: '#2C3E50',
  shoeStyle: 'sneakers',
  shoeColor: '#1A1A1A',
  eyewearStyle: 'none',
  earringStyle: 'none',
  necklaceStyle: 'none',
  accessoryColor: '#D8DCE0',
};

export function normalizePixelCharacterConfig(
  raw: Partial<PixelCharacterConfig> | undefined | null,
): PixelCharacterConfig {
  const base = { ...DEFAULT_PIXEL_CHARACTER };
  if (!raw || typeof raw !== 'object') return base;

  const cleaned = { ...raw } as Record<string, unknown>;
  delete cleaned.makeupStyle;
  delete cleaned.piercingStyle;
  delete cleaned.makeupColor;
  const rawSafe = cleaned as Partial<PixelCharacterConfig>;

  const gender: Gender =
    rawSafe.gender === 'male' || rawSafe.gender === 'female' ? rawSafe.gender : base.gender;

  const rawHairStyle = typeof rawSafe.hairStyle === 'string' ? rawSafe.hairStyle : '';
  const mappedLegacyHairStyle =
    LEGACY_HAIR_STYLE_MAP[rawHairStyle] ?? (rawHairStyle as HairStyle);
  const hairOk = HAIR_STYLES.some((h) => h.value === mappedLegacyHairStyle);
  const hairStyle = hairOk ? mappedLegacyHairStyle : base.hairStyle;

  const shirtOk = SHIRT_STYLES.some((s) => s.value === rawSafe.shirtStyle);
  const shirtStyle = shirtOk ? (rawSafe.shirtStyle as ShirtStyle) : base.shirtStyle;

  const pantsOk = PANTS_STYLES.some((s) => s.value === rawSafe.pantsStyle);
  const pantsStyle = pantsOk ? (rawSafe.pantsStyle as PantsStyle) : base.pantsStyle;

  const shoeOk = SHOE_STYLES.some((s) => s.value === rawSafe.shoeStyle);
  const shoeStyle = shoeOk ? (rawSafe.shoeStyle as ShoeStyle) : base.shoeStyle;
  const eyewearOk = EYEWEAR_STYLES.some((s) => s.value === rawSafe.eyewearStyle);
  const eyewearStyle = eyewearOk ? (rawSafe.eyewearStyle as EyewearStyle) : base.eyewearStyle;
  const earringOk = EARRING_STYLES.some((s) => s.value === rawSafe.earringStyle);
  const earringStyle = earringOk ? (rawSafe.earringStyle as EarringStyle) : base.earringStyle;
  const necklaceOk = NECKLACE_STYLES.some((s) => s.value === rawSafe.necklaceStyle);
  const necklaceStyle = necklaceOk ? (rawSafe.necklaceStyle as NecklaceStyle) : base.necklaceStyle;

  return {
    ...base,
    ...rawSafe,
    gender,
    hairStyle,
    shirtStyle,
    pantsStyle,
    shoeStyle,
    eyewearStyle,
    earringStyle,
    necklaceStyle,
    skinColor: rawSafe.skinColor || base.skinColor,
    hairColor: rawSafe.hairColor || base.hairColor,
    eyeColor: rawSafe.eyeColor || base.eyeColor,
    shirtColor: rawSafe.shirtColor || base.shirtColor,
    pantsColor: rawSafe.pantsColor || base.pantsColor,
    shoeColor: rawSafe.shoeColor || base.shoeColor,
    accessoryColor: rawSafe.accessoryColor || base.accessoryColor,
  };
}

export const GENDER_OPTIONS: { label: string; value: Gender; emoji: string }[] = [
  { label: 'Male', value: 'male', emoji: '♂' },
  { label: 'Female', value: 'female', emoji: '♀' },
];

export const SKIN_COLORS = [
  { label: 'Fair', value: '#FDDBB4' },
  { label: 'Light', value: '#F5C5A3' },
  { label: 'Tan', value: '#E8A87C' },
  { label: 'Medium', value: '#C68642' },
  { label: 'Dark', value: '#8D5524' },
  { label: 'Deep', value: '#4A2511' },
];

export const HAIR_STYLES: HairStyleOption[] = [
  { label: 'Wavy', value: 'wavy', emoji: '〰️', setId: 3011 },
  { label: 'Spiky', value: 'spiky', emoji: '🦔', setId: 3021 },
  { label: 'Buns', value: 'buns', emoji: '🍡', setId: 3024 },
  { label: 'Curls', value: 'curls', emoji: '🌀', setId: 3037 },
  { label: 'Neat', value: 'neat', emoji: '✨', setId: 3040 },
  { label: 'Bob', value: 'bob', emoji: '💇', setId: 3044 },
  { label: 'Mohawk', value: 'mohawk', emoji: '⚡', setId: 3048 },
  { label: 'Long Smooth', value: 'longSmooth', emoji: '👱', setId: 3160 },
  { label: 'Pixie Short', value: 'pixieShort', emoji: '✂️', setId: 3161 },
  { label: 'Parted', value: 'parted', emoji: '↔️', setId: 3162 },
  { label: 'Side Sweep', value: 'sideSweep', emoji: '↗️', setId: 3194 },
  { label: 'Back Bun', value: 'backBun', emoji: '🍩', setId: 3195 },
  { label: 'Braid Bun', value: 'braidBun', emoji: '🧶', setId: 3221 },
  { label: 'Curly 2', value: 'curls2', emoji: '🌀', setId: 3247 },
  { label: 'Showy', value: 'showy', emoji: '🌟', setId: 3251 },
  { label: 'Harley', value: 'harley', emoji: '🎸', setId: 3255 },
  { label: 'Short Wave', value: 'shortWave', emoji: '🌊', setId: 3260 },
  { label: 'Scarf Bun', value: 'scarfBun', emoji: '🧣', setId: 3273 },
  { label: 'Jimmy', value: 'jimmy', emoji: '🧢', setId: 3278 },
  { label: 'Hipster Classic', value: 'hipsterClassic', emoji: '🕶️', setId: 3281 },
  { label: 'Gatsby', value: 'gatsby', emoji: '🎩', setId: 3322 },
  { label: 'Wavy 2', value: 'wavyLong', emoji: '〰️', setId: 3339 },
  { label: 'Hipster Modern', value: 'hipsterModern', emoji: '🕶️', setId: 3499 },
  { label: 'Man Bun', value: 'manBun', emoji: '🥋', setId: 3531 },
  { label: 'Crown Braid', value: 'crownBraid', emoji: '👑', setId: 3568 },
  { label: 'Boxer Braids', value: 'boxerBraids', emoji: '🥊', setId: 3602 },
  { label: 'Elegant Ponytail', value: 'elegantPonytail', emoji: '🎀', setId: 3671 },
  { label: 'Side Ponytail', value: 'sidePonytail', emoji: '🎀', setId: 3715 },
  { label: 'Short Curly', value: 'shortCurly', emoji: '🌀', setId: 3724 },
  { label: 'Long Wavy', value: 'longWavy', emoji: '🌊', setId: 3733 },
  { label: 'Side Flopped', value: 'sideFlopped', emoji: '↘️', setId: 3746 },
  { label: 'Long Wavy 2', value: 'longWavy2', emoji: '🌊', setId: 3764 },
  { label: 'Curls 3', value: 'curls3', emoji: '🌀', setId: 3777 },
  { label: 'Messy Bun', value: 'messyBun', emoji: '🍩', setId: 3782 },
  { label: 'Long Mohawk', value: 'longMohawk', emoji: '⚡', setId: 3841 },
  { label: 'Extra Long', value: 'extraLong', emoji: '👸', setId: 3847 },
  { label: 'Jewel Braids', value: 'jewelBraids', emoji: '💎', setId: 3957 },
  { label: 'Modern Short Wave', value: 'modernShortWave', emoji: '🌊', setId: 3998 },
  { label: 'Cyber Buns', value: 'cyBuns', emoji: '🤖', setId: 4020 },
  { label: 'Classic Ponytail', value: 'ponytailClassic', emoji: '🎀', setId: 9534 },
  { label: 'Bald', value: 'bald', emoji: '🧑', setId: 3357 },
];
export function getHairStyleLabel(style: HairStyle, _gender: Gender): string {
  const row = HAIR_STYLES.find((h) => h.value === style);
  return row?.label ?? style;
}

const LEGACY_HAIR_STYLE_MAP: Record<string, HairStyle> = {
  long: 'longSmooth',
  curly: 'curls',
  ponytail: 'ponytailClassic',
  bun: 'backBun',
  pixie: 'pixieShort',
  buzz: 'modernShortWave',
  sidepart: 'sideSweep',
  braids: 'boxerBraids',
  bald: 'bald',
};

// Keep one shared hairstyle list, but allow per-gender set fixes where one side
// would otherwise render as bald/wrong.
const HAIR_SET_OVERRIDES: Partial<Record<HairStyle, { male?: number; female?: number }>> = {
  bob: { male: 3731, female: 3044 },
  buns: { male: 3531, female: 3024 },
  parted: { male: 3162, female: 3194 },
  ponytailClassic: { male: 3671, female: 9534 },
  bald: { male: 3357, female: 3357 },
};

export function getHairSetId(style: HairStyle, gender: Gender): number {
  const row = HAIR_STYLES.find((h) => h.value === style);
  const baseSet = row?.setId ?? 3044;
  const override = HAIR_SET_OVERRIDES[style];
  if (!override) return baseSet;
  return gender === 'male' ? (override.male ?? baseSet) : (override.female ?? baseSet);
}

export const HAIR_COLORS = [
  { label: 'Black', value: '#1A1A1A' },
  { label: 'Brown', value: '#4A2C0A' },
  { label: 'Blonde', value: '#E8C44A' },
  { label: 'Auburn', value: '#8B2500' },
  { label: 'Red', value: '#CC2200' },
  { label: 'Gray', value: '#8A8A8A' },
  { label: 'Blue', value: '#1A6EBF' },
  { label: 'Purple', value: '#7B2D8B' },
  { label: 'Pink', value: '#CC5599' },
  { label: 'Green', value: '#1A7A3C' },
];

export const EYE_COLORS = [
  { label: 'Blue', value: '#1A6EBF' },
  { label: 'Steel', value: '#2E86AB' },
  { label: 'Green', value: '#1A7A3C' },
  { label: 'Brown', value: '#6B3A1F' },
  { label: 'Gray', value: '#6B7280' },
  { label: 'Dark', value: '#1F2937' },
  { label: 'Purple', value: '#7B2D8B' },
  { label: 'Amber', value: '#C9A227' },
];

/**
 * Tops — `ch` set IDs: male / female catalog entries that match the label
 * (basic tee, hoodie, etc.) on habbo.com imaging.
 */
export const SHIRT_STYLES: {
  label: string;
  value: ShirtStyle;
  chM: number;
  chF: number;
}[] = [
  { label: 'T-shirt', value: 'tee', chM: 3323, chF: 3351 }, // shirt_M_tshirt_rolled | shirt_F_tshirt_rolled (club=0)
  { label: 'Hoodie', value: 'hoodie', chM: 3015, chF: 3014 }, // shirt_M_stripyhoodie | shirt_F_stripyhoodie
  { label: 'Polo', value: 'polo', chM: 3438, chF: 3439 }, // shirt_M_breton | shirt_F_breton
  { label: 'Tank top', value: 'tank', chM: 3416, chF: 3417 }, // shirt_M_camotank | shirt_F_camotank
  { label: 'Sweater', value: 'sweater', chM: 3077, chF: 3076 }, // Shirt_M_Cardigan | Shirt_F_Cardigan
  { label: 'Dress shirt', value: 'dressshirt', chM: 3792, chF: 3793 }, // shirt_M_topbuttonshirt | shirt_F_topbuttonshirt
  // Female-origin styles intentionally available for all body types.
  { label: 'Kimono', value: 'kimono', chM: 3368, chF: 3367 }, // shirt_M_kimono | shirt_F_kimono
  { label: 'Off-shoulder', value: 'offshoulder', chM: 3529, chF: 3528 }, // shirt_M_offshldrjumper | shirt_F_offshldrjumper
  { label: 'Boho tunic', value: 'boho', chM: 3796, chF: 3797 }, // shirt_M_bohotunic | shirt_F_bohotunic
  { label: 'Cute top', value: 'cute', chM: 3618, chF: 3616 }, // shirt_M_cutie | shirt_F_cutie
  { label: 'Dress', value: 'dress', chM: 3630, chF: 3629 }, // shirt_M_vicdress | shirt_F_vicdress
];

const SHIRT_LABEL_BY_GENDER: Record<ShirtStyle, { male: string; female: string }> = {
  tee: { male: 'T-shirt', female: 'T-shirt' },
  hoodie: { male: 'Stripy Hoodie', female: 'Stripy Hoodie' },
  polo: { male: 'Breton Top', female: 'Breton Top' },
  tank: { male: 'Camo Tank', female: 'Camo Tank' },
  sweater: { male: 'Cardigan', female: 'Cardigan' },
  dressshirt: { male: 'Button Shirt', female: 'Button Shirt' },
  kimono: { male: 'Kimono', female: 'Kimono' },
  offshoulder: { male: 'Off-shoulder', female: 'Off-shoulder' },
  boho: { male: 'Boho Tunic', female: 'Boho Tunic' },
  cute: { male: 'Cute Top', female: 'Cute Top' },
  dress: { male: 'Dress', female: 'Dress' },
};

export const PANTS_STYLES: {
  label: string;
  value: PantsStyle;
  lgM: number;
  lgF: number;
}[] = [
  { label: 'Jeans', value: 'jeans', lgM: 3057, lgF: 3057 }, // Trousers_U_Skinny_Jeans
  { label: 'Shorts', value: 'shorts', lgM: 3202, lgF: 3202 }, // trousers_U_shorts_belt
  { label: 'Cargo', value: 'cargo', lgM: 3023, lgF: 3023 }, // trousers_U_camo
  { label: 'Slacks', value: 'slacks', lgM: 3058, lgF: 3058 }, // Trousers_U_Sraight
  { label: 'Skirt', value: 'skirt', lgM: 3017, lgF: 3191 }, // trousers_U_kilt | trousers_F_pencilskirt
  { label: 'Frilly skirt', value: 'frillskirt', lgM: 3282, lgF: 3282 }, // trousers_F_frillyskirt
  { label: 'Bow skirt', value: 'bowskirt', lgM: 3283, lgF: 3283 }, // trousers_F_bowskirt
];

const PANTS_LABEL_BY_GENDER: Record<PantsStyle, { male: string; female: string }> = {
  jeans: { male: 'Skinny Jeans', female: 'Skinny Jeans' },
  shorts: { male: 'Belt Shorts', female: 'Belt Shorts' },
  cargo: { male: 'Camo Trousers', female: 'Camo Trousers' },
  slacks: { male: 'Straight Trousers', female: 'Straight Trousers' },
  skirt: { male: 'Kilt', female: 'Pencil Skirt' },
  frillskirt: { male: 'Frilly Skirt', female: 'Frilly Skirt' },
  bowskirt: { male: 'Bow Skirt', female: 'Bow Skirt' },
};

export const SHOE_STYLES: {
  label: string;
  value: ShoeStyle;
  shM: number;
  shF: number;
}[] = [
  { label: 'Sneakers', value: 'sneakers', shM: 3016, shF: 3016 }, // shoes_U_sneakers
  { label: 'Boots', value: 'boots', shM: 3783, shF: 3783 }, // shoes_U_scuffedboots
  { label: 'Dress shoes', value: 'dress', shM: 3595, shF: 3595 }, // shoes_U_pointyshoes
  { label: 'Sandals', value: 'sandals', shM: 3206, shF: 3206 }, // shoes_U_flipflop
  { label: 'Bootie', value: 'bootie', shM: 3184, shF: 3184 }, // shoes_F_bootie
  { label: 'Bow shoes', value: 'bowshoes', shM: 3277, shF: 3277 }, // shoes_f_bowshoes
];

const SHOE_LABEL_BY_GENDER: Record<ShoeStyle, { male: string; female: string }> = {
  sneakers: { male: 'Sneakers', female: 'Sneakers' },
  boots: { male: 'Scuffed Boots', female: 'Scuffed Boots' },
  dress: { male: 'Pointy Shoes', female: 'Pointy Shoes' },
  sandals: { male: 'Flip-flops', female: 'Flip-flops' },
  bootie: { male: 'Bootie', female: 'Bootie' },
  bowshoes: { male: 'Bow Shoes', female: 'Bow Shoes' },
};

export const SHIRT_COLORS = [
  { label: 'Blue', value: '#4F86C6' },
  { label: 'Red', value: '#CC2200' },
  { label: 'Green', value: '#1A7A3C' },
  { label: 'Yellow', value: '#D4A017' },
  { label: 'Purple', value: '#7B2D8B' },
  { label: 'Orange', value: '#C45C00' },
  { label: 'Pink', value: '#CC5599' },
  { label: 'White', value: '#D8DCE0' },
  { label: 'Black', value: '#2C3E50' },
  { label: 'Teal', value: '#0F7A6E' },
];

export const PANTS_COLORS = [
  { label: 'Navy', value: '#1A2744' },
  { label: 'Jeans', value: '#2D5F8A' },
  { label: 'Black', value: '#18181B' },
  { label: 'Khaki', value: '#9E8054' },
  { label: 'Burgundy', value: '#6B1A2A' },
  { label: 'Forest', value: '#1A4A2A' },
  { label: 'Gray', value: '#4A5568' },
  { label: 'White', value: '#C0C4C8' },
];

export const SHOE_COLORS = [
  { label: 'Black', value: '#111111' },
  { label: 'White', value: '#D0D4D8' },
  { label: 'Brown', value: '#5A3010' },
  { label: 'Red', value: '#AA1A00' },
  { label: 'Blue', value: '#1A4E8B' },
  { label: 'Gray', value: '#5A6472' },
];

export const ACCESSORY_COLORS = [
  { label: 'Silver', value: '#D8DCE0' },
  { label: 'Gold', value: '#D4A017' },
  { label: 'Rose Gold', value: '#C45C00' },
  { label: 'Black', value: '#1A1A1A' },
  { label: 'Blue', value: '#4F86C6' },
];

// Set IDs: `open-hotel-resources` `settype.ea.set` keys. Each `eaSet` was checked against
// `figuremap.json` `parts.ea` → `libs[]` so the preview matches the label (not legacy
// `hh_human_acc_eye` sets 1401–1406, and not mislabeled club items like 3083 = heromask).
export const EYEWEAR_STYLES: { label: string; value: EyewearStyle; eaSet: number }[] = [
  { label: 'None', value: 'none', eaSet: 0 },
  { label: 'Sunglasses', value: 'sunglasses', eaSet: 3169 }, // acc_eye_U_sunglasses4 (see docs/habbo-figure-mapping.md)
  { label: 'Big shades', value: 'classicShades', eaSet: 3493 }, // acc_eye_U_bigshades
  { label: 'Sport shades', value: 'aviators', eaSet: 3925 }, // acc_eye_U_sportsshade
  { label: 'Cute glasses', value: 'retroRound', eaSet: 3698 }, // acc_eye_U_cuteglasses
  { label: 'Cyber glasses', value: 'neonShades', eaSet: 3388 }, // acc_eye_U_cyglass
];

// `heSet` keys: `settype.he.set`. Verified via `figuremap.parts.he` → `libs[]`
// (3297 was acc_head_U_doctors_mirror, 3295 ponytail, 3376 goggles — not earrings).
export const EARRING_STYLES: { label: string; value: EarringStyle; heSet: number }[] = [
  { label: 'None', value: 'none', heSet: 0 },
  { label: 'Ring studs', value: 'studs', heSet: 3070 }, // acc_head_U_earring_ring
  { label: 'Gem earrings', value: 'hoops', heSet: 3069 }, // acc_head_U_earring_gem
  { label: 'Star earrings', value: 'starDrops', heSet: 3974 }, // acc_head_U_starearrings
  { label: 'Leaf earrings', value: 'leafEarrings', heSet: 3833 }, // acc_head_U_leafearrings, club 0
];

// `caSet` keys: `settype.ca.set`. Verified via `figuremap.parts.ca` → `libs[]`
// (3131/3151 were scarves; 3545 was acc_chest_U_bear — not necklaces).
export const NECKLACE_STYLES: { label: string; value: NecklaceStyle; caSet: number }[] = [
  { label: 'None', value: 'none', caSet: 0 },
  { label: 'Bead necklace', value: 'chain', caSet: 3343 }, // acc_chest_U_beads
  { label: 'Medal', value: 'choker', caSet: 3423 }, // acc_chest_U_medal1
  { label: 'Heart necklace', value: 'gemPendant', caSet: 3885 }, // acc_chest_U_heartnecklace
  { label: 'Strand necklace', value: 'strandNecklace', caSet: 3177 }, // acc_chest_U_strands
];

export function getShirtChSet(style: ShirtStyle, gender: Gender): number {
  const row = SHIRT_STYLES.find((s) => s.value === style);
  if (!row) return gender === 'male' ? 3030 : 3033;
  return gender === 'male' ? row.chM : row.chF;
}

export function getShirtStyleLabel(style: ShirtStyle, gender: Gender): string {
  const row = SHIRT_LABEL_BY_GENDER[style];
  if (!row) return style;
  return gender === 'male' ? row.male : row.female;
}

export function getPantsLgSet(style: PantsStyle, gender: Gender): number {
  const row = PANTS_STYLES.find((s) => s.value === style);
  if (!row) return gender === 'male' ? 3057 : 3057;
  return gender === 'male' ? row.lgM : row.lgF;
}

export function getPantsStyleLabel(style: PantsStyle, gender: Gender): string {
  const row = PANTS_LABEL_BY_GENDER[style];
  if (!row) return style;
  return gender === 'male' ? row.male : row.female;
}

export function getShoeShSet(style: ShoeStyle, gender: Gender): number {
  const row = SHOE_STYLES.find((s) => s.value === style);
  if (!row) return gender === 'male' ? 3016 : 3016;
  return gender === 'male' ? row.shM : row.shF;
}

export function getShoeStyleLabel(style: ShoeStyle, gender: Gender): string {
  const row = SHOE_LABEL_BY_GENDER[style];
  if (!row) return style;
  return gender === 'male' ? row.male : row.female;
}

export function getEyewearSet(style: EyewearStyle, _gender: Gender): number {
  const row = EYEWEAR_STYLES.find((s) => s.value === style);
  if (!row || style === 'none') return 0;
  return row.eaSet;
}

export function getEarringSet(style: EarringStyle, _gender: Gender): number {
  const row = EARRING_STYLES.find((s) => s.value === style);
  if (!row || style === 'none') return 0;
  return row.heSet;
}

export function getNecklaceSet(style: NecklaceStyle, _gender: Gender): number {
  const row = NECKLACE_STYLES.find((s) => s.value === style);
  if (!row || style === 'none') return 0;
  return row.caSet;
}

