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
  // All 20 themes are null for now — Stage 3 attaches the art-backed ones.
  backgroundImage: ImageSourcePropType | null;
};

// ---------------------------------------------------------------------
// DARK, art-backed (10)
// ---------------------------------------------------------------------

const cozyCabin: Theme = {
  id: 'cozy-cabin',
  name: 'Cozy Cabin',
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#1A120C',
    surface: '#251A11',
    card: '#2E2116',

    forest: '#5C4530',
    pine: '#6E5540',
    deepForest: '#120C08',

    gold: '#E0913F',
    bronze: '#A8672E',
    moon: '#F2D9B0',

    onAccent: '#1F1305',

    textPrimary: '#F5E8D8',
    textSecondary: '#C9AD8F',
    textMuted: '#9C8368',

    border: '#3D2C1C',
    softBorder: '#4D3A26',

    success: '#8FBF8A',
    danger: '#C97052',
  },
};

const leatherWhiskey: Theme = {
  id: 'leather-whiskey',
  name: 'Leather & Whiskey',
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#1C1210',
    surface: '#271A17',
    card: '#33221E',

    forest: '#5E2E28',
    pine: '#733A32',
    deepForest: '#140D0B',

    gold: '#B8823D',
    bronze: '#8F6224',
    moon: '#E8CFA0',

    onAccent: '#1F1608',

    textPrimary: '#F0E2D4',
    textSecondary: '#C3A88F',
    textMuted: '#977E68',

    border: '#402A24',
    softBorder: '#4F352D',

    success: '#8CAE7C',
    danger: '#A8402F',
  },
};

const enchantedLibrary: Theme = {
  id: 'enchanted-library',
  name: 'Enchanted Library',
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#180F22',
    surface: '#22162E',
    card: '#2C1E3A',

    forest: '#5A3E7A',
    pine: '#6E4E90',
    deepForest: '#110A18',

    gold: '#C9A24A',
    bronze: '#8F7028',
    moon: '#DCC8EE',

    onAccent: '#1E1408',

    textPrimary: '#EEE6F5',
    textSecondary: '#BBA8CC',
    textMuted: '#8C7A9E',

    border: '#3A2A4E',
    softBorder: '#4A3660',

    success: '#8CBF9E',
    danger: '#C06A78',
  },
};

const celestial: Theme = {
  id: 'celestial',
  name: 'Celestial',
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#0C1220',
    surface: '#131C2E',
    card: '#1B273C',

    forest: '#3A4F72',
    pine: '#4A6188',
    deepForest: '#080C16',

    gold: '#9FB8DC',
    bronze: '#6E85AC',
    moon: '#E4ECF8',

    onAccent: '#0C1420',

    textPrimary: '#EDF2FA',
    textSecondary: '#AEBEDA',
    textMuted: '#7C8CAC',

    border: '#233252',
    softBorder: '#2E4364',

    success: '#8FC0A8',
    danger: '#C97C82',
  },
};

const mountainExpedition: Theme = {
  id: 'mountain-expedition',
  name: 'Mountain Expedition',
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#12181A',
    surface: '#1A2225',
    card: '#212B2E',

    forest: '#33544A',
    pine: '#40684B',
    deepForest: '#0C1112',

    gold: '#D97D3C',
    bronze: '#A8592A',
    moon: '#F0D8B8',

    onAccent: '#1E0F04',

    textPrimary: '#EDF1EF',
    textSecondary: '#AEBDB8',
    textMuted: '#7C8C87',

    border: '#293634',
    softBorder: '#354442',

    success: '#7FBF9A',
    danger: '#C4634A',
  },
};

const storm: Theme = {
  id: 'storm',
  name: 'Storm',
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#141A22',
    surface: '#1C242E',
    card: '#242E3A',

    forest: '#3E5468',
    pine: '#4E6880',
    deepForest: '#0D1218',

    gold: '#B8D4E6',
    bronze: '#7C9CB4',
    moon: '#EAF4FA',

    onAccent: '#0E161C',

    textPrimary: '#EDF2F6',
    textSecondary: '#AFC0CE',
    textMuted: '#7E8FA0',

    border: '#2A3846',
    softBorder: '#354756',

    success: '#8AC0A6',
    danger: '#C97A76',
  },
};

const lakesideCampsite: Theme = {
  id: 'lakeside-campsite',
  name: 'Lakeside Campsite',
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#0F1826',
    surface: '#172233',
    card: '#1F2C3F',

    forest: '#33526A',
    pine: '#41647E',
    deepForest: '#0A121C',

    gold: '#E0973E',
    bronze: '#A86A2A',
    moon: '#F2DDB4',

    onAccent: '#1F1204',

    textPrimary: '#EFF2F6',
    textSecondary: '#AEBCCC',
    textMuted: '#7D8CA0',

    border: '#233450',
    softBorder: '#2E4360',

    success: '#84BFA0',
    danger: '#C97258',
  },
};

const wizardsTower: Theme = {
  id: 'wizards-tower',
  name: "Wizard's Tower",
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#140E28',
    surface: '#1D1636',
    card: '#261D44',

    // Teal is the secondary arcane accent, carried on the otherwise-unused
    // forest/pine slots; gold stays the primary accent used in buttons/pills.
    forest: '#2E7A6C',
    pine: '#3E9484',
    deepForest: '#0D0920',

    gold: '#C9A24A',
    bronze: '#8F7028',
    moon: '#D8C8F0',

    onAccent: '#1E1404',

    textPrimary: '#EFE9FA',
    textSecondary: '#BBADD6',
    textMuted: '#8B7DA8',

    border: '#362A54',
    softBorder: '#443668',

    success: '#6FBFA0',
    danger: '#C4708A',
  },
};

const waterfallJungle: Theme = {
  id: 'waterfall-jungle',
  name: 'Waterfall Jungle',
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#0E1A14',
    surface: '#15251C',
    card: '#1C3024',

    forest: '#2E6B52',
    pine: '#3E8264',
    deepForest: '#0A130E',

    gold: '#4FBF8E',
    bronze: '#358F68',
    moon: '#C8F0DC',

    onAccent: '#071810',

    textPrimary: '#E9F5EE',
    textSecondary: '#AECDBC',
    textMuted: '#7E9C8C',

    border: '#254636',
    softBorder: '#305A44',

    success: '#7FCB9E',
    danger: '#C97A66',
  },
};

const winterCampfire: Theme = {
  id: 'winter-campfire',
  name: 'Winter Campfire',
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#141A1E',
    surface: '#1C242A',
    card: '#242E36',

    forest: '#3A525E',
    pine: '#4A6874',
    deepForest: '#0D1215',

    gold: '#E08A3E',
    bronze: '#A85E28',
    moon: '#F2D6B0',

    onAccent: '#1F1004',

    textPrimary: '#EDF1F3',
    textSecondary: '#AFC0C6',
    textMuted: '#7E8F96',

    border: '#2A3A42',
    softBorder: '#354A52',

    success: '#82BFA6',
    danger: '#C4664E',
  },
};

// ---------------------------------------------------------------------
// LIGHT, art-backed (7)
// ---------------------------------------------------------------------

const wildflowerMeadow: Theme = {
  id: 'wildflower-meadow',
  name: 'Wildflower Meadow',
  isLight: true,
  backgroundImage: null,
  colors: {
    background: '#F7F0E8',
    surface: '#EFE4D6',
    card: '#FFFFFF',

    forest: '#6E7A52',
    pine: '#7E8C62',
    deepForest: '#2E3320',

    gold: '#C97B8A',
    bronze: '#A85C6C',
    moon: '#FFFFFF',

    onAccent: '#2E141A',

    textPrimary: '#2A2420',
    textSecondary: '#5C5348',
    textMuted: '#6E6455',

    border: '#E2D6C4',
    softBorder: '#D2C4AE',

    success: '#4C7A5C',
    danger: '#A6493A',
  },
};

const goldenMeadow: Theme = {
  id: 'golden-meadow',
  name: 'Golden Meadow',
  isLight: true,
  backgroundImage: null,
  colors: {
    background: '#F8F1DE',
    surface: '#F0E4C6',
    card: '#FFFFFF',

    forest: '#7A6A3E',
    pine: '#8C7C4E',
    deepForest: '#332C14',

    gold: '#C9902E',
    bronze: '#9C6E1E',
    moon: '#FFFFFF',

    onAccent: '#241804',

    textPrimary: '#2A2410',
    textSecondary: '#5A4F2E',
    textMuted: '#6C6040',

    border: '#E6D6A8',
    softBorder: '#D6C288',

    success: '#4C7A5C',
    danger: '#A6493A',
  },
};

const coastal: Theme = {
  id: 'coastal',
  name: 'Coastal',
  isLight: true,
  backgroundImage: null,
  colors: {
    background: '#EEF3F5',
    surface: '#E0E9EC',
    card: '#FFFFFF',

    forest: '#3E6478',
    pine: '#4E7688',
    deepForest: '#101E26',

    gold: '#4A9AC4',
    bronze: '#2E6E8F',
    moon: '#FFFFFF',

    onAccent: '#0A1E28',

    textPrimary: '#141E24',
    textSecondary: '#42525A',
    textMuted: '#57676F',

    border: '#D2E0E6',
    softBorder: '#BFD2DA',

    success: '#4C7A6C',
    danger: '#A6493A',
  },
};

const mistyRiver: Theme = {
  id: 'misty-river',
  name: 'Misty River',
  isLight: true,
  backgroundImage: null,
  colors: {
    background: '#EEF0EA',
    surface: '#E2E6DC',
    card: '#FFFFFF',

    forest: '#5C6E58',
    pine: '#6E8268',
    deepForest: '#20281E',

    gold: '#A8935A',
    bronze: '#8A7440',
    moon: '#FFFFFF',

    onAccent: '#241D0A',

    textPrimary: '#20241C',
    textSecondary: '#4C5446',
    textMuted: '#5E6658',

    border: '#D6DAD0',
    softBorder: '#C6CCC0',

    success: '#4C7A5C',
    danger: '#A6493A',
  },
};

const autumnForest: Theme = {
  id: 'autumn-forest',
  name: 'Autumn Forest',
  isLight: true,
  backgroundImage: null,
  colors: {
    background: '#F8EFE2',
    surface: '#F0E2CC',
    card: '#FFFFFF',

    forest: '#7A5030',
    pine: '#8C6440',
    deepForest: '#331E0C',

    gold: '#C96A2E',
    bronze: '#9C4E1E',
    moon: '#FFFFFF',

    onAccent: '#210F02',

    textPrimary: '#2A1E14',
    textSecondary: '#5A4736',
    textMuted: '#6C5946',

    border: '#E6D2B4',
    softBorder: '#D6BE98',

    success: '#4C7A5C',
    danger: '#A6493A',
  },
};

const tropicalSunset: Theme = {
  id: 'tropical-sunset',
  name: 'Tropical Sunset',
  isLight: true,
  backgroundImage: null,
  colors: {
    background: '#FCEFE2',
    surface: '#F6E0CC',
    card: '#FFFFFF',

    forest: '#7A4E48',
    pine: '#8C6058',
    deepForest: '#331C18',

    gold: '#E0704E',
    bronze: '#B0502E',
    moon: '#FFFFFF',

    onAccent: '#210A04',

    textPrimary: '#2A1C16',
    textSecondary: '#5A4438',
    textMuted: '#6C5646',

    border: '#EAD0BC',
    softBorder: '#DCB89C',

    success: '#4C7A5C',
    danger: '#A6493A',
  },
};

const golfCourseDawn: Theme = {
  id: 'golf-course-dawn',
  name: 'Golf Course Dawn',
  isLight: true,
  backgroundImage: null,
  colors: {
    background: '#F0F3E6',
    surface: '#E4E9D4',
    card: '#FFFFFF',

    forest: '#3E6E4A',
    pine: '#4E8258',
    deepForest: '#152A1A',

    gold: '#3E9C5E',
    bronze: '#2E7A48',
    moon: '#FFFFFF',

    onAccent: '#0A2010',

    textPrimary: '#182014',
    textSecondary: '#44523C',
    textMuted: '#57654E',

    border: '#D8E2C4',
    softBorder: '#C6D4AE',

    success: '#3E8A54',
    danger: '#A6493A',
  },
};

// ---------------------------------------------------------------------
// PALETTE-ONLY (3)
// ---------------------------------------------------------------------

const modernMinimal: Theme = {
  id: 'modern-minimal',
  name: 'Modern Minimal',
  isLight: true,
  backgroundImage: null,
  colors: {
    background: '#FAFAF8',
    surface: '#F0F0EC',
    card: '#FFFFFF',

    forest: '#2E5C42',
    pine: '#3E7052',
    deepForest: '#0E1C14',

    gold: '#4FA070',
    bronze: '#357A54',
    moon: '#FFFFFF',

    onAccent: '#0A1810',

    textPrimary: '#1A1C18',
    textSecondary: '#42463E',
    textMuted: '#565A50',

    border: '#E2E2DC',
    softBorder: '#D2D2C8',

    success: '#3E7A54',
    danger: '#A6493A',
  },
};

const cottagecore: Theme = {
  id: 'cottagecore',
  name: 'Cottagecore',
  isLight: true,
  backgroundImage: null,
  colors: {
    background: '#F9F1E4',
    surface: '#F0E4CE',
    card: '#FFFFFF',

    forest: '#6E5438',
    pine: '#80664A',
    deepForest: '#241A0E',

    gold: '#AC7C48',
    bronze: '#8A6034',
    moon: '#FFFFFF',

    onAccent: '#1E1204',

    textPrimary: '#241A10',
    textSecondary: '#52422E',
    textMuted: '#655440',

    border: '#E6D6BC',
    softBorder: '#D6C2A0',

    success: '#4C7A5C',
    danger: '#A6493A',
  },
};

const highFantasy: Theme = {
  id: 'high-fantasy',
  name: 'High Fantasy',
  isLight: false,
  backgroundImage: null,
  colors: {
    background: '#0A0806',
    surface: '#141110',
    card: '#1C1815',

    forest: '#4A3E28',
    pine: '#5C4E36',
    deepForest: '#060504',

    gold: '#D4AF37',
    bronze: '#9C7A24',
    moon: '#F0E6C8',

    onAccent: '#1C1404',

    textPrimary: '#F2EEE4',
    textSecondary: '#C4BCA8',
    textMuted: '#8F8874',

    border: '#2E2820',
    softBorder: '#3E362A',

    success: '#8FBF8A',
    danger: '#B9564A',
  },
};

// The original app palette (pre-refactor lib/theme.js COLORS), restored
// as a palette-only entry so it stays a safe, art-independent default.
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

export const THEMES: Theme[] = [
  // original app default, palette-only
  forest,
  // dark, art-backed
  cozyCabin,
  leatherWhiskey,
  enchantedLibrary,
  celestial,
  mountainExpedition,
  storm,
  lakesideCampsite,
  wizardsTower,
  waterfallJungle,
  winterCampfire,
  // light, art-backed
  wildflowerMeadow,
  goldenMeadow,
  coastal,
  mistyRiver,
  autumnForest,
  tropicalSunset,
  golfCourseDawn,
  // palette-only
  modernMinimal,
  cottagecore,
  highFantasy,
];

export const DEFAULT_THEME_ID = forest.id;
