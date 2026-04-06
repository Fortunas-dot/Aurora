export type HairStyle = 'bob' | 'long' | 'spiky' | 'curly';

export interface PixelCharacterConfig {
  skinColor: string;
  hairStyle: HairStyle;
  hairColor: string;
  eyeColor: string;
  shirtColor: string;
  pantsColor: string;
  shoeColor: string;
}

export const DEFAULT_PIXEL_CHARACTER: PixelCharacterConfig = {
  skinColor: '#F5C5A3',
  hairStyle: 'bob',
  hairColor: '#4A2C0A',
  eyeColor: '#2E86AB',
  shirtColor: '#4F86C6',
  pantsColor: '#2C3E50',
  shoeColor: '#1A1A1A',
};

export const SKIN_COLORS = [
  { label: 'Fair', value: '#FDDBB4' },
  { label: 'Light', value: '#F5C5A3' },
  { label: 'Tan', value: '#E8A87C' },
  { label: 'Medium', value: '#C68642' },
  { label: 'Dark', value: '#8D5524' },
  { label: 'Deep', value: '#4A2511' },
];

export const HAIR_STYLES: { label: string; value: HairStyle; emoji: string }[] = [
  { label: 'Bob', value: 'bob', emoji: '💇' },
  { label: 'Long', value: 'long', emoji: '👱' },
  { label: 'Spiky', value: 'spiky', emoji: '🦔' },
  { label: 'Curly', value: 'curly', emoji: '🌀' },
];

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
  { label: 'Green', value: '#1A7A3C' },
  { label: 'Brown', value: '#6B3A1F' },
  { label: 'Gray', value: '#6B7280' },
  { label: 'Dark', value: '#1F2937' },
  { label: 'Purple', value: '#7B2D8B' },
];

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
