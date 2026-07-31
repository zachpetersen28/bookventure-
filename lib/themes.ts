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
    // Always the text color sitting on top of `gold` surfaces (buttons,
    // pills) — must stay dark even in a light theme for contrast.
    deepForest: '#2B2013',

    gold: '#A8823D',
    bronze: '#7A5A2E',
    moon: '#FFFBF2',

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

    textPrimary: '#EAF3F7',
    textSecondary: '#A9C2CE',
    textMuted: '#7C93A0',

    border: '#1E3A4C',
    softBorder: '#2A4C61',

    success: '#7FBFA0',
    danger: '#D97B6C',
  },
};

export const THEMES: Theme[] = [forest, crimson, parchment, ocean];

export const DEFAULT_THEME_ID = forest.id;
