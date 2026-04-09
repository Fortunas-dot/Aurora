import { IUser } from '../models/User';

type PixelCharacter = NonNullable<IUser['pixelCharacter']>;

const GENDERS = ['male', 'female'] as const;
const SKIN_COLORS = ['#FDDBB4', '#F5C5A3', '#E8A87C', '#C68642', '#8D5524', '#4A2511'];
const HAIR_STYLES = [
  'wavy',
  'spiky',
  'buns',
  'curls',
  'neat',
  'bob',
  'mohawk',
  'longSmooth',
  'pixieShort',
  'parted',
  'sideSweep',
  'backBun',
  'braidBun',
  'showy',
  'harley',
  'shortWave',
  'scarfBun',
  'jimmy',
  'hipsterClassic',
  'gatsby',
  'wavyLong',
  'hipsterModern',
  'manBun',
  'crownBraid',
  'boxerBraids',
  'elegantPonytail',
  'sidePonytail',
  'shortCurly',
  'longWavy',
  'sideFlopped',
  'longWavy2',
  'curls2',
  'curls3',
  'messyBun',
  'longMohawk',
  'extraLong',
  'jewelBraids',
  'modernShortWave',
  'cyBuns',
  'ponytailClassic',
  'bald',
] as const;
const HAIR_COLORS = ['#1A1A1A', '#4A2C0A', '#E8C44A', '#8B2500', '#CC2200', '#8A8A8A', '#1A6EBF', '#7B2D8B', '#CC5599', '#1A7A3C'];
const EYE_COLORS = ['#1A6EBF', '#2E86AB', '#1A7A3C', '#6B3A1F', '#6B7280', '#1F2937', '#7B2D8B', '#C9A227'];
const SHIRT_STYLES = ['tee', 'hoodie', 'polo', 'tank', 'sweater', 'dressshirt', 'kimono', 'offshoulder', 'boho', 'cute', 'dress'] as const;
const SHIRT_COLORS = ['#4F86C6', '#CC2200', '#1A7A3C', '#D4A017', '#7B2D8B', '#C45C00', '#CC5599', '#D8DCE0', '#2C3E50', '#0F7A6E'];
const PANTS_STYLES = ['jeans', 'shorts', 'cargo', 'slacks', 'skirt', 'frillskirt', 'bowskirt'] as const;
const PANTS_COLORS = ['#1A2744', '#2D5F8A', '#18181B', '#9E8054', '#6B1A2A', '#1A4A2A', '#4A5568', '#C0C4C8'];
const SHOE_STYLES = ['sneakers', 'boots', 'dress', 'sandals', 'bootie', 'bowshoes'] as const;
const SHOE_COLORS = ['#111111', '#D0D4D8', '#5A3010', '#AA1A00', '#1A4E8B', '#5A6472'];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomPixelCharacter(username: string): PixelCharacter {
  return {
    gender: pick(GENDERS),
    skinColor: pick(SKIN_COLORS),
    hairStyle: pick(HAIR_STYLES),
    hairColor: pick(HAIR_COLORS),
    eyeColor: pick(EYE_COLORS),
    shirtStyle: pick(SHIRT_STYLES),
    shirtColor: pick(SHIRT_COLORS),
    pantsStyle: pick(PANTS_STYLES),
    pantsColor: pick(PANTS_COLORS),
    shoeStyle: pick(SHOE_STYLES),
    shoeColor: pick(SHOE_COLORS),
    name: username,
  };
}

