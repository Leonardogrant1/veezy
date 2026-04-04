// --- Primitive palette ---

export const Cream = {
  50: '#fdfcfc',
  100: '#fbf9f7',
  200: '#f9f7f3',
  300: '#f6f3ed',
  400: '#f5f1e9',
  500: '#f2ede4',
  600: '#dcd8cf',
  700: '#aca8a2',
  800: '#85827d',
  900: '#66646d',
} as const;

export const Gold = {
  50: '#faf6ed',
  100: '#eee4c8',
  200: '#e6d7ad',
  300: '#dbc587',
  400: '#d4b970',
  500: '#c9a84c',
  600: '#b79945',
  700: '#8f7736',
  800: '#8f5c2a',
  900: '#544720',
} as const;

export const Neutrals = {
  1: '#ffffff',
  2: '#fcfcfc',
  3: '#f5f5f5',
  4: '#f0f0f0',
  5: '#d9d9d9',
  6: '#bfbfbf',
  7: '#8c8c8c',
  8: '#595959',
  9: '#454545',
  10: '#262626',
  11: '#1f1f1f',
  12: '#141414',
  13: '#000000',
} as const;

// --- Semantic tokens ---

export const Colors = {
  // Backgrounds
  background: Cream[200],   // #fdfcfc  — App background
  surface: Cream[100],  // #fbf9f7  — Surface / Cards
  cardElevated: Cream[100],  // #f9f7f3  — Elevated cards

  // Text
  textHeadline: Neutrals[13], // #000000
  text: Neutrals[11], // #1f1f1f  — Body text
  textMuted: Neutrals[8],  // #595959  — Muted / secondary
  textPlaceholder: Neutrals[5],  // #d9d9d9  — Placeholders

  // Accent (gold)
  accent: Gold[500],    // #c9a84c  — CTAs, highlights
  accentSubtle: Gold[300],    // #dbc587  — Subtle gold backgrounds
  accentPressed: Gold[600],    // #b79945  — Pressed / hover state

  // Borders
  borderDivider: Neutrals[4],  // #f0f0f0  — Dividers
  borderCard: Cream[300],   // #f6f3ed  — Card borders
} as const;

// --- Fonts ---

export const Fonts = {
  // Playfair Display — Headlines, titles, editorial
  serif:           'PlayfairDisplay_400Regular',
  serifItalic:     'PlayfairDisplay_400Regular_Italic',
  serifSemiBold:   'PlayfairDisplay_600SemiBold',
  serifBold:       'PlayfairDisplay_700Bold',
  serifBoldItalic: 'PlayfairDisplay_700Bold_Italic',

  // Inter — Body, UI, labels
  sans:            'Inter_400Regular',
  sansMedium:      'Inter_500Medium',
  sansSemiBold:    'Inter_600SemiBold',
  sansBold:        'Inter_700Bold',
} as const;
