import type { ImageSourcePropType } from 'react-native';

export type ThemeColors = {
  background: string;
  surface: string;
  card: string;

  forest: string;
  pine: string;
  deepForest: string;

  gold: string;
  bronze: string;
  moon: string;

  // Text/icon color for content sitting on top of a `gold`-filled surface
  // (buttons, pills, badges, active states). Always dark enough to
  // contrast against `gold`, independent of whether the theme itself is
  // light or dark.
  onAccent: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  border: string;
  softBorder: string;

  success: string;
  danger: string;
};

export type Theme = {
  id: string;
  name: string;
  isLight: boolean;
  colors: ThemeColors;
  // Full-screen art layered behind screen content. null = palette-only theme.
  backgroundImage: ImageSourcePropType | null;
};

// Current app look, unchanged. Kept as the default so existing screens
// render identically until a user picks something else.
const forest: Theme = {
  id: 'forest',
  name: 'Midnight Forest',
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#0F1D1A',
    surface: '#152824',
    card: '#1C312D',

    forest: '#2F5D50',
    pine: '#3E6A5D',
    deepForest: '#0B1614',

    gold: '#C6A56B',
    bronze: '#8F6B42',
    moon: '#E8DFC8',

    onAccent: '#0B1614',

    textPrimary: '#F5F1E8',
    textSecondary: '#B7B2A8',
    textMuted: '#8F9892',

    border: '#28443D',
    softBorder: '#38544C',

    success: '#8FBFA8',
    danger: '#B98A74',
  },
};

const crimson: Theme = {
  id: 'crimson',
  name: 'Crimson Night',
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#1A0E10',
    surface: '#241318',
    card: '#2E181F',

    forest: '#7A2E3A',
    pine: '#8F3E4B',
    deepForest: '#160A0C',

    gold: '#D68A5C',
    bronze: '#9C5A3C',
    moon: '#E9D3C4',

    onAccent: '#160A0C',

    textPrimary: '#F3E7E2',
    textSecondary: '#C2A79E',
    textMuted: '#8F7670',

    border: '#3E2027',
    softBorder: '#4E2A32',

    success: '#8FBF9E',
    danger: '#E0685A',
  },
};

const parchment: Theme = {
  id: 'parchment',
  name: 'Parchment',
  isLight: true,
  backgroundImage: null,
  colors: {
    background: '#F6EFE1',
    surface: '#EFE4CD',
    card: '#FFFBF2',

    forest: '#5C7A63',
    pine: '#6E8C74',
    deepForest: '#2B2013',

    gold: '#A8823D',
    bronze: '#7A5A2E',
    moon: '#FFFBF2',

    onAccent: '#2B2013',

    textPrimary: '#2B2013',
    textSecondary: '#5C513E',
    textMuted: '#8A8069',

    border: '#DCD0B4',
    softBorder: '#CBBD98',

    success: '#4F7A5C',
    danger: '#A6493A',
  },
};

const ocean: Theme = {
  id: 'ocean',
  name: 'Deep Ocean',
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#0B1620',
    surface: '#0F2030',
    card: '#15293B',

    forest: '#2E6485',
    pine: '#3E7A9D',
    deepForest: '#081018',

    gold: '#63B8CC',
    bronze: '#3D8494',
    moon: '#D8ECF2',

    onAccent: '#081018',

    textPrimary: '#EAF3F7',
    textSecondary: '#A9C2CE',
    textMuted: '#7C93A0',

    border: '#1E3A4C',
    softBorder: '#2A4C61',

    success: '#7FBFA0',
    danger: '#D97B6C',
  },
};

// Lightweight placeholder light themes for Stage 2 contrast testing.
// Will be replaced when the real 20-theme collection is defined.
const linen: Theme = {
  id: 'linen',
  name: 'Linen',
  isLight: true,
  backgroundImage: null,
  colors: {
    background: '#F4F1EC',
    surface: '#EAE5DC',
    card: '#FFFFFF',

    forest: '#4A6B5A',
    pine: '#5C7E6C',
    deepForest: '#26312B',

    gold: '#9C7A3C',
    bronze: '#7A5C2E',
    moon: '#FFFFFF',

    onAccent: '#241C0E',

    textPrimary: '#252220',
    textSecondary: '#5A554C',
    textMuted: '#8B857A',

    border: '#DED7C8',
    softBorder: '#CFC6B0',

    success: '#4C7A5C',
    danger: '#A6493A',
  },
};

const sakura: Theme = {
  id: 'sakura',
  name: 'Sakura',
  isLight: true,
  backgroundImage: null,
  colors: {
    background: '#FCEEF1',
    surface: '#F7E0E6',
    card: '#FFFFFF',

    forest: '#6B4A5A',
    pine: '#7D5C6C',
    deepForest: '#3A2430',

    gold: '#C97B94',
    bronze: '#A85C74',
    moon: '#FFFFFF',

    onAccent: '#2E1620',

    textPrimary: '#3A2430',
    textSecondary: '#6B4A5A',
    textMuted: '#9C7E8A',

    border: '#F0D0D8',
    softBorder: '#E6BFC9',

    success: '#5C8A6C',
    danger: '#B94A5A',
  },
};

const sky: Theme = {
  id: 'sky',
  name: 'Sky',
  isLight: true,
  backgroundImage: null,
  colors: {
    background: '#EAF3FA',
    surface: '#DCEAF5',
    card: '#FFFFFF',

    forest: '#3E6B85',
    pine: '#4E7D97',
    deepForest: '#132430',

    gold: '#3E8FBF',
    bronze: '#2E6E99',
    moon: '#FFFFFF',

    onAccent: '#0A1820',

    textPrimary: '#152430',
    textSecondary: '#43586A',
    textMuted: '#7C93A3',

    border: '#CBE0F0',
    softBorder: '#B8D4EA',

    success: '#4C8A6C',
    danger: '#B9483A',
  },
};

export const THEMES: Theme[] = [forest, crimson, parchment, ocean, linen, sakura, sky];

export const DEFAULT_THEME_ID = forest.id;
